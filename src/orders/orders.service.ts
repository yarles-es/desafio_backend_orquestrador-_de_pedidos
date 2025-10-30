import { Injectable, BadRequestException } from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from 'src/prisma/prisma.service';
import { toNormIso4217 } from 'src/utils/to-norm-iso-4217';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('orders') private readonly ordersQueue: Queue,
  ) {}

  private totalItemsAmount(items: CreateOrderDto['items']) {
    return items.reduce(
      (acc, it) => acc.add(new Prisma.Decimal(it.unit_price).mul(it.qty)),
      new Prisma.Decimal(0),
    );
  }

  private async addOrderQueueJob(orderId: string) {
    await this.ordersQueue.add(
      'enrich',
      { orderId },
      {
        jobId: orderId,
        attempts: 5,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: 50,
        removeOnFail: false,
      },
    );
  }

  private async createOrderInTransaction(dto: CreateOrderDto) {
    const currency = toNormIso4217(dto.currency);

    const targetCurrency = toNormIso4217(process.env.TARGET_CURRENCY || 'BRL');

    try {
      return await this.prisma.$transaction(async (tx) => {
        const created = await tx.order.create({
          data: {
            externalId: dto.order_id,
            idempotencyKey: dto.idempotency_key,
            customerEmail: dto.customer.email,
            customerName: dto.customer.name,
            currency,
            targetCurrency,
            total: this.totalItemsAmount(dto.items),
            status: OrderStatus.RECEIVED,
            items: {
              createMany: {
                data: dto.items.map((i) => ({
                  sku: i.sku,
                  qty: i.qty,
                  unitPrice: i.unit_price,
                })),
                skipDuplicates: true,
              },
            },
          },
        });

        return created;
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new BadRequestException('Pedido já recebido (idempotente).');
      }
      throw e;
    }
  }

  async receiveAndEnqueue(dto: CreateOrderDto) {
    const order = await this.createOrderInTransaction(dto);
    await this.addOrderQueueJob(order.id);
    return order;
  }

  async findMany(status?: OrderStatus) {
    return this.prisma.order.findMany({
      where: { status: status ?? undefined },
      orderBy: { createdAt: 'desc' },
      include: { items: true },
    });
  }

  async findOne(id: string) {
    return this.prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });
  }
}

import {
  Processor,
  WorkerHost,
  OnWorkerEvent,
  InjectQueue,
} from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { EnrichmentService } from 'src/enrichment/enrichment.service';

type EnrichJobData = { orderId: string };

@Processor('orders')
export class OrdersProcessor extends WorkerHost {
  constructor(
    private readonly prisma: PrismaService,
    private readonly enrichment: EnrichmentService,
    @InjectQueue('orders-dlq') private readonly dlq: Queue,
  ) {
    super();
  }

  async process(job: Job<EnrichJobData>) {
    const { orderId } = job.data;

    await this.prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.ENRICHING },
    });

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order) throw new Error('ordem não encontrada');

    const result = await this.enrichment.convert(order.currency, order.total);

    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        totalConverted: result.converted,
        targetCurrency: result.to,
        status: OrderStatus.ENRICHED,
        failureReason: null,
      },
    });

    return { ok: true };
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job<EnrichJobData>, err: Error) {
    const attemptsMade = job.attemptsMade ?? 0;
    const max = job.opts.attempts ?? 1;

    if (attemptsMade >= max) {
      const dlqData: EnrichJobData & { failedReason: string } = {
        ...job.data,
        failedReason: err.message ?? 'Unknown error',
      };

      await this.dlq.add('failed-order', dlqData, { removeOnComplete: 100 });

      await this.prisma.order.update({
        where: { id: job.data.orderId },
        data: {
          status: OrderStatus.FAILED_ENRICHMENT,
          failureReason: err.message ?? 'Unknown error',
        },
      });
    }
  }
}

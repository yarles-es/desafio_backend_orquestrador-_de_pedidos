import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { ListOrdersDto } from './dto/list-orders.dto';
import { OrdersService } from './orders.service';

@Controller()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('webhooks/orders')
  @HttpCode(202)
  async receive(@Body() body: CreateOrderDto) {
    const order = await this.ordersService.receiveAndEnqueue(body);
    return { id: order.id, status: order.status };
  }

  @Get('orders')
  async list(@Query() query: ListOrdersDto) {
    const list = await this.ordersService.findMany(query.status);
    return list;
  }

  @Get('orders/:id')
  async get(@Param('id') id: string) {
    const order = await this.ordersService.findOne(id);
    return order;
  }
}

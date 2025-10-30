import { Module } from '@nestjs/common';

import { BullModule } from '@nestjs/bullmq';

import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'orders',
    }),
    BullModule.registerQueue({
      name: 'orders-dlq',
    }),
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}

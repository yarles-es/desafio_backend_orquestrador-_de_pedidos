import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { OrdersProcessor } from './orders.processor';

import { QueueController } from './queue.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { EnrichmentModule } from 'src/enrichment/enrichment.module';

@Module({
  imports: [
    PrismaModule,
    EnrichmentModule,
    BullModule.forRoot({
      connection: { url: process.env.REDIS_URL },
    }),
    BullModule.registerQueue({ name: 'orders' }),
    BullModule.registerQueue({ name: 'orders-dlq' }),
  ],
  controllers: [QueueController],
  providers: [OrdersProcessor],
  exports: [BullModule],
})
export class QueueModule {}

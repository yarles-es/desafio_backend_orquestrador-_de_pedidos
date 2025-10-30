import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { OrdersModule } from './orders/orders.module';
import { EnrichmentModule } from './enrichment/enrichment.module';
import { QueueModule } from './queue/queue.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    OrdersModule,
    EnrichmentModule,
    QueueModule,
  ],
})
export class AppModule {}

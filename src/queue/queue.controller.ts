import { Controller, Get } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Controller('queue')
export class QueueController {
  constructor(
    @InjectQueue('orders') private readonly ordersQueue: Queue,
    @InjectQueue('orders-dlq') private readonly dlq: Queue,
  ) {}

  @Get('metrics')
  async metrics() {
    const counts = await this.ordersQueue.getJobCounts(
      'waiting',
      'active',
      'completed',
      'failed',
      'delayed',
      'paused',
    );
    const dlqCounts = await this.dlq.getJobCounts(
      'waiting',
      'active',
      'completed',
      'failed',
      'delayed',
      'paused',
    );

    return {
      orders: counts,
      dlq: dlqCounts,
    };
  }
}

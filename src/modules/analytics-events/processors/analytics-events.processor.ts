import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QUEUE_ANALYTICS_EVENTS } from '../../../infrastructure/queue/queue.constants';

@Processor(QUEUE_ANALYTICS_EVENTS)
export class AnalyticsEventsProcessor extends WorkerHost {
  private readonly logger = new Logger(AnalyticsEventsProcessor.name);

  process(job: Job): Promise<void> {
    this.logger.debug(`Processing analytics event job ${job.id}`);
    return Promise.resolve();
  }
}

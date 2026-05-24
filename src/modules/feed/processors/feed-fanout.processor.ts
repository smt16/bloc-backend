import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QUEUE_FEED_FANOUT } from '../../../infrastructure/queue/queue.constants';

@Processor(QUEUE_FEED_FANOUT)
export class FeedFanoutProcessor extends WorkerHost {
  private readonly logger = new Logger(FeedFanoutProcessor.name);

  process(job: Job): Promise<void> {
    this.logger.debug(`Processing feed fanout job ${job.id}`);
    return Promise.resolve();
  }
}

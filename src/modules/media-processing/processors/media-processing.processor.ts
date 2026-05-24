import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QUEUE_MEDIA_PROCESSING } from '../../../infrastructure/queue/queue.constants';

@Processor(QUEUE_MEDIA_PROCESSING)
export class MediaProcessingProcessor extends WorkerHost {
  private readonly logger = new Logger(MediaProcessingProcessor.name);

  process(job: Job): Promise<void> {
    this.logger.debug(`Processing media job ${job.id}`);
    return Promise.resolve();
  }
}

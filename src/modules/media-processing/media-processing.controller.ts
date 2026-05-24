import { Controller, Get } from '@nestjs/common';
import { MediaProcessingService } from './media-processing.service';

@Controller('media')
export class MediaProcessingController {
  constructor(
    private readonly mediaProcessingService: MediaProcessingService,
  ) {}

  @Get()
  findAll() {
    return this.mediaProcessingService.findAll();
  }
}

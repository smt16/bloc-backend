import { Controller, Get } from '@nestjs/common';
import { AnalyticsEventsService } from './analytics-events.service';

@Controller('analytics')
export class AnalyticsEventsController {
  constructor(
    private readonly analyticsEventsService: AnalyticsEventsService,
  ) {}

  @Get()
  findAll() {
    return this.analyticsEventsService.findAll();
  }
}

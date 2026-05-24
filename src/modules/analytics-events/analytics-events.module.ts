import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsEventsController } from './analytics-events.controller';
import { AnalyticsEventsService } from './analytics-events.service';
import { AnalyticsEventEntity } from './entities/analytics-event.entity';
import { AnalyticsEventsProcessor } from './processors/analytics-events.processor';

@Module({
  imports: [TypeOrmModule.forFeature([AnalyticsEventEntity])],
  controllers: [AnalyticsEventsController],
  providers: [AnalyticsEventsService, AnalyticsEventsProcessor],
})
export class AnalyticsEventsModule {}

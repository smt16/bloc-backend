import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeedItemEntity } from './entities/feed-item.entity';
import { FeedController } from './feed.controller';
import { FeedService } from './feed.service';
import { FeedFanoutProcessor } from './processors/feed-fanout.processor';

@Module({
  imports: [TypeOrmModule.forFeature([FeedItemEntity])],
  controllers: [FeedController],
  providers: [FeedService, FeedFanoutProcessor],
})
export class FeedModule {}

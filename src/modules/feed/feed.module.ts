import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GymEntity } from '../gyms/entities/gym.entity';
import { UsersModule } from '../users/users.module';
import { FeedCommentEntity } from './entities/feed-comment.entity';
import { FeedItemEntity } from './entities/feed-item.entity';
import { ReactionEntity } from './entities/reaction.entity';
import { FeedController } from './feed.controller';
import { FeedService } from './feed.service';
import { FeedFanoutProcessor } from './processors/feed-fanout.processor';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FeedItemEntity,
      ReactionEntity,
      FeedCommentEntity,
      GymEntity,
    ]),
    UsersModule,
  ],
  controllers: [FeedController],
  providers: [FeedService, FeedFanoutProcessor],
  exports: [FeedService],
})
export class FeedModule {}

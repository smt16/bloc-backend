import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeedModule } from '../feed/feed.module';
import { GymEntity } from '../gyms/entities/gym.entity';
import { UsersModule } from '../users/users.module';
import { ClimbLogEntity } from './entities/climb-log.entity';
import { ClimbSessionEntity } from './entities/climb-session.entity';
import { ClimbingRouteEntity } from './entities/climbing-route.entity';
import { RouteCommentEntity } from './entities/route-comment.entity';
import { LogsController } from './logs.controller';
import { LogsService } from './logs.service';
import { RoutesController } from './routes.controller';
import { RoutesService } from './routes.service';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ClimbingRouteEntity,
      RouteCommentEntity,
      ClimbSessionEntity,
      ClimbLogEntity,
      GymEntity,
    ]),
    UsersModule,
    FeedModule,
  ],
  controllers: [RoutesController, SessionsController, LogsController],
  providers: [RoutesService, SessionsService, LogsService],
})
export class ClimbingModule {}

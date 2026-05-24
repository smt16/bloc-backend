import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClimbingController } from './climbing.controller';
import { ClimbingService } from './climbing.service';
import { ClimbingRouteEntity } from './entities/climbing-route.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ClimbingRouteEntity])],
  controllers: [ClimbingController],
  providers: [ClimbingService],
})
export class ClimbingModule {}

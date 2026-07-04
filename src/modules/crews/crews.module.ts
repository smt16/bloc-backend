import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { CrewMemberEntity } from './entities/crew-member.entity';
import { CrewEntity } from './entities/crew.entity';
import { CrewsController } from './crews.controller';
import { CrewsService } from './crews.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([CrewEntity, CrewMemberEntity]),
    UsersModule,
  ],
  controllers: [CrewsController],
  providers: [CrewsService],
  exports: [CrewsService],
})
export class CrewsModule {}

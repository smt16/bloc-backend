import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RealtimeModule } from '../../infrastructure/realtime/realtime.module';
import { MessageEntity } from './entities/message.entity';
import { MessagingController } from './messaging.controller';
import { MessagingService } from './messaging.service';

@Module({
  imports: [TypeOrmModule.forFeature([MessageEntity]), RealtimeModule],
  controllers: [MessagingController],
  providers: [MessagingService],
})
export class MessagingModule {}

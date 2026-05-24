import { Module } from '@nestjs/common';
import { MuxClientService } from './mux-client.service';

@Module({
  providers: [MuxClientService],
  exports: [MuxClientService],
})
export class MediaInfrastructureModule {}

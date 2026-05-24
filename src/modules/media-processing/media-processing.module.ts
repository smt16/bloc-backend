import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MediaInfrastructureModule } from '../../infrastructure/media/media.module';
import { StorageModule } from '../../infrastructure/storage/storage.module';
import { MediaAssetEntity } from './entities/media-asset.entity';
import { MediaProcessingController } from './media-processing.controller';
import { MediaProcessingService } from './media-processing.service';
import { MediaProcessingProcessor } from './processors/media-processing.processor';

@Module({
  imports: [
    TypeOrmModule.forFeature([MediaAssetEntity]),
    MediaInfrastructureModule,
    StorageModule,
  ],
  controllers: [MediaProcessingController],
  providers: [MediaProcessingService, MediaProcessingProcessor],
})
export class MediaProcessingModule {}

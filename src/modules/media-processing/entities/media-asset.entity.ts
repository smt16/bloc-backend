import { Entity } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('media_assets')
export class MediaAssetEntity extends BaseEntity {}

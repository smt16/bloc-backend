import { Entity } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('feed_items')
export class FeedItemEntity extends BaseEntity {}

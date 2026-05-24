import { Entity } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('analytics_events')
export class AnalyticsEventEntity extends BaseEntity {}

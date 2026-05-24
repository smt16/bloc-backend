import { Entity } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('notifications')
export class NotificationEntity extends BaseEntity {}

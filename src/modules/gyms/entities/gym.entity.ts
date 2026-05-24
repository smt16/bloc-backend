import { Entity } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('gyms')
export class GymEntity extends BaseEntity {}

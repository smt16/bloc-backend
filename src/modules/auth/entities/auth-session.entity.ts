import { Entity } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('auth_sessions')
export class AuthSessionEntity extends BaseEntity {}

import { Column, Entity, Index, Unique } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export type CrewRole = 'owner' | 'admin' | 'member';

/** Membership edge between a crew and a climber. */
@Entity('crew_members')
@Unique('uq_crew_member', ['crewId', 'userId'])
export class CrewMemberEntity extends BaseEntity {
  @Index()
  @Column({ name: 'crew_id', type: 'uuid' })
  crewId!: string;

  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'role', type: 'varchar', length: 16, default: 'member' })
  role!: CrewRole;

  /** Last time this member logged activity — powers "active today". */
  @Column({ name: 'last_active_at', type: 'timestamptz', nullable: true })
  lastActiveAt?: Date | null;
}

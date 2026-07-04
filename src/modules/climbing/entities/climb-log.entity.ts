import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export type ClimbOutcome = 'flash' | 'send' | 'project';

/**
 * A single logged climb — the record created by the "Log a climb" screen.
 * May be attached to a specific route and/or session. Feed items, session
 * summaries and route stats are all derived from these rows.
 */
@Entity('climb_logs')
export class ClimbLogEntity extends BaseEntity {
  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Index()
  @Column({ name: 'route_id', type: 'uuid', nullable: true })
  routeId?: string | null;

  @Column({ name: 'gym_id', type: 'uuid', nullable: true })
  gymId?: string | null;

  @Index()
  @Column({ name: 'session_id', type: 'uuid', nullable: true })
  sessionId?: string | null;

  @Column({ name: 'grade', type: 'varchar', length: 8 })
  grade!: string;

  @Column({ name: 'outcome', type: 'varchar', length: 16 })
  outcome!: ClimbOutcome;

  @Column({ name: 'attempts', type: 'int', default: 1 })
  attempts!: number;

  @Column({ name: 'note', type: 'text', nullable: true })
  note?: string | null;

  @Column({ name: 'has_media', type: 'boolean', default: false })
  hasMedia!: boolean;

  @Column({ name: 'logged_at', type: 'timestamptz', default: () => 'now()' })
  loggedAt!: Date;
}

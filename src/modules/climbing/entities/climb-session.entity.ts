import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

/**
 * A logged climbing session (a single visit to a gym). Per-grade breakdown,
 * sends/attempts/flashes and the hardest grade are derived from the
 * `climb_logs` linked to the session.
 */
@Entity('climb_sessions')
export class ClimbSessionEntity extends BaseEntity {
  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Index()
  @Column({ name: 'gym_id', type: 'uuid', nullable: true })
  gymId?: string | null;

  @Column({ name: 'session_date', type: 'date' })
  sessionDate!: string;

  @Column({ name: 'duration_mins', type: 'int', nullable: true })
  durationMins?: number | null;

  @Column({ name: 'note', type: 'text', nullable: true })
  note?: string | null;
}

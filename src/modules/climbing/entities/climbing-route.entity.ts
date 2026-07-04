import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

/**
 * A set route / boulder problem at a gym. Aggregate stats (total sends, average
 * attempts) are derived from `climb_logs` at read time; `betaVideoCount` is a
 * denormalized counter.
 */
@Entity('climbing_routes')
export class ClimbingRouteEntity extends BaseEntity {
  @Index()
  @Column({ name: 'gym_id', type: 'uuid' })
  gymId!: string;

  @Column({ name: 'name', type: 'varchar', length: 120 })
  name!: string;

  @Index()
  @Column({ name: 'grade', type: 'varchar', length: 8 })
  grade!: string;

  @Column({ name: 'wall', type: 'varchar', length: 80, nullable: true })
  wall?: string | null;

  @Column({ name: 'color', type: 'varchar', length: 9, nullable: true })
  color?: string | null;

  @Column({ name: 'setter', type: 'varchar', length: 80, nullable: true })
  setter?: string | null;

  @Column({
    name: 'setter_initials',
    type: 'varchar',
    length: 4,
    nullable: true,
  })
  setterInitials?: string | null;

  @Column({ name: 'setter_note', type: 'text', nullable: true })
  setterNote?: string | null;

  @Column({ name: 'style_tags', type: 'text', array: true, default: '{}' })
  styleTags!: string[];

  @Column({ name: 'beta_video_count', type: 'int', default: 0 })
  betaVideoCount!: number;
}

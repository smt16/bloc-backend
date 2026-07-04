import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export type MilestoneKind = 'milestone' | 'achievement';
export type MilestoneTone = 'accent' | 'purple' | 'cyan' | 'success';

/**
 * Progression timeline entries and achievement badges shown on the profile
 * screen. `kind` distinguishes the dated timeline ("First V5") from the
 * earned/locked achievement grid.
 */
@Entity('milestones')
export class MilestoneEntity extends BaseEntity {
  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'kind', type: 'varchar', length: 16, default: 'milestone' })
  kind!: MilestoneKind;

  @Column({ name: 'title', type: 'varchar', length: 120 })
  title!: string;

  @Column({ name: 'detail', type: 'text', nullable: true })
  detail?: string | null;

  @Column({ name: 'icon', type: 'varchar', length: 40, nullable: true })
  icon?: string | null;

  @Column({ name: 'tone', type: 'varchar', length: 16, default: 'accent' })
  tone!: MilestoneTone;

  @Column({ name: 'earned', type: 'boolean', default: true })
  earned!: boolean;

  @Column({ name: 'achieved_at', type: 'timestamptz', nullable: true })
  achievedAt?: Date | null;
}

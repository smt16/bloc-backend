import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export type ProfilePrivacy = 'public' | 'private';

/**
 * A Bloc climber. Backed by an Auth0 identity (`auth0Sub`) and enriched with
 * the profile fields surfaced across the mobile app (handle, avatar, home gym,
 * climbing style, etc.).
 */
@Entity('users')
export class UserEntity extends BaseEntity {
  @Index({ unique: true })
  @Column({ name: 'auth0_sub', type: 'varchar', length: 128 })
  auth0Sub!: string;

  @Column({ name: 'email', type: 'varchar', length: 320, nullable: true })
  email?: string | null;

  @Column({ name: 'name', type: 'varchar', length: 120, nullable: true })
  name?: string | null;

  @Index({ unique: true })
  @Column({ name: 'handle', type: 'varchar', length: 40, nullable: true })
  handle?: string | null;

  @Column({ name: 'picture_url', type: 'text', nullable: true })
  pictureUrl?: string | null;

  @Column({ name: 'avatar_color', type: 'varchar', length: 9, nullable: true })
  avatarColor?: string | null;

  @Column({ name: 'initials', type: 'varchar', length: 4, nullable: true })
  initials?: string | null;

  @Column({ name: 'top_grade', type: 'varchar', length: 8, nullable: true })
  topGrade?: string | null;

  @Column({ name: 'home_gym_id', type: 'uuid', nullable: true })
  homeGymId?: string | null;

  @Column({ name: 'bio', type: 'text', nullable: true })
  bio?: string | null;

  @Column({ name: 'style_tags', type: 'text', array: true, default: '{}' })
  styleTags!: string[];

  @Column({
    name: 'privacy',
    type: 'varchar',
    length: 16,
    default: 'public',
  })
  privacy!: ProfilePrivacy;

  /** Denormalized current logging streak (days). Recomputed on new logs. */
  @Column({ name: 'streak_days', type: 'int', default: 0 })
  streakDays!: number;
}

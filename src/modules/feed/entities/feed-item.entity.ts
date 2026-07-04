import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export type FeedKind = 'send' | 'session' | 'milestone' | 'project';

/**
 * An activity-feed post authored by a climber. Reaction counts and comment
 * counts are derived from the `reactions` / `feed_comments` tables at read time.
 */
@Entity('feed_items')
export class FeedItemEntity extends BaseEntity {
  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'kind', type: 'varchar', length: 16 })
  kind!: FeedKind;

  @Column({ name: 'headline', type: 'varchar', length: 160 })
  headline!: string;

  @Column({ name: 'route_id', type: 'uuid', nullable: true })
  routeId?: string | null;

  @Column({ name: 'gym_id', type: 'uuid', nullable: true })
  gymId?: string | null;

  @Column({ name: 'session_id', type: 'uuid', nullable: true })
  sessionId?: string | null;

  @Column({ name: 'grade', type: 'varchar', length: 8, nullable: true })
  grade?: string | null;

  @Column({ name: 'route_name', type: 'varchar', length: 120, nullable: true })
  routeName?: string | null;

  @Column({ name: 'note', type: 'text', nullable: true })
  note?: string | null;

  @Column({ name: 'attempts', type: 'int', nullable: true })
  attempts?: number | null;

  @Column({ name: 'has_media', type: 'boolean', default: false })
  hasMedia!: boolean;
}

import { Column, Entity, Index, Unique } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export type ReactionType = 'fire' | 'strong' | 'clap';

/** A climber's reaction to a feed item. One reaction per user per item. */
@Entity('reactions')
@Unique('uq_reaction_user_item', ['feedItemId', 'userId'])
export class ReactionEntity extends BaseEntity {
  @Index()
  @Column({ name: 'feed_item_id', type: 'uuid' })
  feedItemId!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'type', type: 'varchar', length: 16 })
  type!: ReactionType;
}

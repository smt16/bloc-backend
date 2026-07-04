import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

/** A comment on a feed item. */
@Entity('feed_comments')
export class FeedCommentEntity extends BaseEntity {
  @Index()
  @Column({ name: 'feed_item_id', type: 'uuid' })
  feedItemId!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'body', type: 'text' })
  body!: string;
}

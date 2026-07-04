import { Column, Entity, Index, Unique } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

/** Directed follow edge: `follower` follows `followee`. */
@Entity('follows')
@Unique('uq_follow_pair', ['followerId', 'followeeId'])
export class FollowEntity extends BaseEntity {
  @Index()
  @Column({ name: 'follower_id', type: 'uuid' })
  followerId!: string;

  @Index()
  @Column({ name: 'followee_id', type: 'uuid' })
  followeeId!: string;
}

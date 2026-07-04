import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

/** A comment / beta note left on a route detail page. */
@Entity('route_comments')
export class RouteCommentEntity extends BaseEntity {
  @Index()
  @Column({ name: 'route_id', type: 'uuid' })
  routeId!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'body', type: 'text' })
  body!: string;
}

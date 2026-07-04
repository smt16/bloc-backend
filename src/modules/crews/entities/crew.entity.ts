import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

/** A crew — a climbing community/group that climbers can join. */
@Entity('crews')
export class CrewEntity extends BaseEntity {
  @Column({ name: 'name', type: 'varchar', length: 80 })
  name!: string;

  @Column({ name: 'emoji', type: 'varchar', length: 16, nullable: true })
  emoji?: string | null;

  @Column({ name: 'blurb', type: 'text', nullable: true })
  blurb?: string | null;
}

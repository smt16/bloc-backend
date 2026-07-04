import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

/** A climbing gym / facility. */
@Entity('gyms')
export class GymEntity extends BaseEntity {
  @Column({ name: 'name', type: 'varchar', length: 120 })
  name!: string;

  @Column({ name: 'city', type: 'varchar', length: 120, nullable: true })
  city?: string | null;

  @Column({ name: 'accent_color', type: 'varchar', length: 9, nullable: true })
  accentColor?: string | null;

  /**
   * Denormalized "climbers here now" count used for the explore spotlight.
   * Kept as a column since real-time presence isn't modelled yet.
   */
  @Column({ name: 'climbers_here', type: 'int', default: 0 })
  climbersHere!: number;
}

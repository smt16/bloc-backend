import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CreateGymDto } from './dto';
import { GymEntity } from './entities/gym.entity';

export interface GymView {
  id: string;
  name: string;
  city: string | null;
  accentColor: string | null;
  climbersHere: number;
  newRoutes: number;
}

@Injectable()
export class GymsService {
  constructor(
    @InjectRepository(GymEntity)
    private readonly gyms: Repository<GymEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(): Promise<GymView[]> {
    const gyms = await this.gyms.find({ order: { climbersHere: 'DESC' } });
    const counts = await this.newRouteCounts();
    return gyms.map((g) => this.toView(g, counts.get(g.id) ?? 0));
  }

  async findOne(id: string): Promise<GymView> {
    const gym = await this.gyms.findOne({ where: { id } });
    if (!gym) throw new NotFoundException('Gym not found');
    const counts = await this.newRouteCounts(id);
    return this.toView(gym, counts.get(id) ?? 0);
  }

  async create(dto: CreateGymDto): Promise<GymView> {
    const gym = await this.gyms.save(this.gyms.create(dto));
    return this.toView(gym, 0);
  }

  /** Count of routes set at each gym in the last 30 days ("new sets"). */
  private async newRouteCounts(gymId?: string): Promise<Map<string, number>> {
    const rows: { gym_id: string; count: string }[] = await this.dataSource.query(
      `SELECT gym_id, COUNT(*)::int AS count
       FROM climbing_routes
       WHERE created_at > now() - interval '30 days'
       ${gymId ? 'AND gym_id = $1' : ''}
       GROUP BY gym_id`,
      gymId ? [gymId] : [],
    );
    return new Map(rows.map((r) => [r.gym_id, Number(r.count)]));
  }

  private toView(gym: GymEntity, newRoutes: number): GymView {
    return {
      id: gym.id,
      name: gym.name,
      city: gym.city ?? null,
      accentColor: gym.accentColor ?? null,
      climbersHere: gym.climbersHere,
      newRoutes,
    };
  }
}

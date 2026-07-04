import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { CreateCrewDto } from './dto';
import { CrewMemberEntity } from './entities/crew-member.entity';
import { CrewEntity } from './entities/crew.entity';

@Injectable()
export class CrewsService {
  constructor(
    @InjectRepository(CrewEntity)
    private readonly crews: Repository<CrewEntity>,
    @InjectRepository(CrewMemberEntity)
    private readonly members: Repository<CrewMemberEntity>,
    private readonly usersService: UsersService,
    private readonly dataSource: DataSource,
  ) {}

  async listForUser(userId: string) {
    const crews = await this.crews.find({ order: { createdAt: 'ASC' } });
    const stats = await this.crewStats();
    const myCrewIds = await this.membershipIds(userId);
    const memberColors = await this.memberColorMap(crews.map((c) => c.id));

    return crews.map((c) => ({
      id: c.id,
      name: c.name,
      emoji: c.emoji ?? null,
      blurb: c.blurb ?? null,
      members: stats.get(c.id)?.members ?? 0,
      activeToday: stats.get(c.id)?.activeToday ?? 0,
      memberColors: memberColors.get(c.id) ?? [],
      joined: myCrewIds.has(c.id),
    }));
  }

  async create(userId: string, dto: CreateCrewDto) {
    const crew = await this.crews.save(this.crews.create(dto));
    await this.members.save(
      this.members.create({
        crewId: crew.id,
        userId,
        role: 'owner',
        lastActiveAt: new Date(),
      }),
    );
    return this.getForUser(crew.id, userId);
  }

  async join(crewId: string, userId: string) {
    await this.getCrewOrThrow(crewId);
    const existing = await this.members.findOne({ where: { crewId, userId } });
    if (!existing) {
      await this.members.save(
        this.members.create({
          crewId,
          userId,
          role: 'member',
          lastActiveAt: new Date(),
        }),
      );
    }
    return this.getForUser(crewId, userId);
  }

  async leave(crewId: string, userId: string): Promise<void> {
    await this.members.delete({ crewId, userId });
  }

  private async getForUser(crewId: string, userId: string) {
    const list = await this.listForUser(userId);
    const found = list.find((c) => c.id === crewId);
    if (!found) throw new NotFoundException('Crew not found');
    return found;
  }

  private async getCrewOrThrow(id: string): Promise<CrewEntity> {
    const crew = await this.crews.findOne({ where: { id } });
    if (!crew) throw new NotFoundException('Crew not found');
    return crew;
  }

  private async crewStats(): Promise<
    Map<string, { members: number; activeToday: number }>
  > {
    const rows: {
      crew_id: string;
      members: string;
      active_today: string;
    }[] = await this.dataSource.query(
      `SELECT crew_id,
              COUNT(*)::int AS members,
              COUNT(*) FILTER (WHERE last_active_at >= date_trunc('day', now()))::int AS active_today
       FROM crew_members GROUP BY crew_id`,
    );
    return new Map(
      rows.map((r) => [
        r.crew_id,
        { members: Number(r.members), activeToday: Number(r.active_today) },
      ]),
    );
  }

  private async membershipIds(userId: string): Promise<Set<string>> {
    const rows = await this.members.find({ where: { userId } });
    return new Set(rows.map((r) => r.crewId));
  }

  private async memberColorMap(
    crewIds: string[],
  ): Promise<Map<string, string[]>> {
    if (crewIds.length === 0) return new Map();
    const rows: { crew_id: string; user_id: string }[] =
      await this.dataSource.query(
        `SELECT crew_id, user_id FROM crew_members
         WHERE crew_id = ANY($1) ORDER BY created_at ASC`,
        [crewIds],
      );
    const summaries = await this.usersService.summariesByIds(
      rows.map((r) => r.user_id),
    );
    const map = new Map<string, string[]>();
    for (const row of rows) {
      const colors = map.get(row.crew_id) ?? [];
      if (colors.length < 4) {
        const color = summaries.get(row.user_id)?.avatarColor;
        if (color) colors.push(color);
      }
      map.set(row.crew_id, colors);
    }
    return map;
  }
}

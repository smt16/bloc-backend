import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, ILike, Repository } from 'typeorm';
import { GymEntity } from '../gyms/entities/gym.entity';
import { UsersService } from '../users/users.service';
import { CreateRouteDto, RouteQueryDto } from './dto';
import { ClimbingRouteEntity } from './entities/climbing-route.entity';
import { RouteCommentEntity } from './entities/route-comment.entity';

const timeAgo = (date: Date): string => {
  const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
  if (mins < 60) return `${Math.max(mins, 1)}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
};

@Injectable()
export class RoutesService {
  constructor(
    @InjectRepository(ClimbingRouteEntity)
    private readonly routes: Repository<ClimbingRouteEntity>,
    @InjectRepository(RouteCommentEntity)
    private readonly comments: Repository<RouteCommentEntity>,
    @InjectRepository(GymEntity)
    private readonly gyms: Repository<GymEntity>,
    private readonly usersService: UsersService,
    private readonly dataSource: DataSource,
  ) {}

  async list(query: RouteQueryDto) {
    const limit = Math.min(query.limit ?? 20, 50);
    const where: Record<string, unknown> = {};
    if (query.gymId) where.gymId = query.gymId;
    if (query.grade) where.grade = query.grade;
    if (query.search) where.name = ILike(`%${query.search}%`);

    const routes = await this.routes.find({
      where,
      take: limit,
      skip: query.offset ?? 0,
      order: { createdAt: 'DESC' },
    });

    const stats = await this.statsFor(routes.map((r) => r.id));
    const gyms = await this.gymMap(routes.map((r) => r.gymId));

    return routes
      .map((r) => this.toView(r, stats.get(r.id), gyms.get(r.gymId)))
      .sort((a, b) => b.sends - a.sends);
  }

  async getDetail(id: string, viewerId: string) {
    const route = await this.routes.findOne({ where: { id } });
    if (!route) throw new NotFoundException('Route not found');

    const [stats, gyms, senders, comments, viewerStatus] = await Promise.all([
      this.statsFor([id]),
      this.gymMap([route.gymId]),
      this.recentSenders(id),
      this.listComments(id),
      this.viewerStatus(id, viewerId),
    ]);

    return {
      ...this.toView(route, stats.get(id), gyms.get(route.gymId)),
      setterNote: route.setterNote ?? null,
      recentSenders: senders,
      comments,
      status: viewerStatus,
    };
  }

  async create(dto: CreateRouteDto) {
    const gym = await this.gyms.findOne({ where: { id: dto.gymId } });
    if (!gym) throw new NotFoundException('Gym not found');
    const route = await this.routes.save(
      this.routes.create({ ...dto, styleTags: dto.styleTags ?? [] }),
    );
    const gyms = await this.gymMap([route.gymId]);
    return this.toView(route, undefined, gyms.get(route.gymId));
  }

  async addComment(routeId: string, userId: string, body: string) {
    const route = await this.routes.findOne({ where: { id: routeId } });
    if (!route) throw new NotFoundException('Route not found');
    const saved = await this.comments.save(
      this.comments.create({ routeId, userId, body }),
    );
    const author = await this.usersService.summariesByIds([userId]);
    return {
      id: saved.id,
      body: saved.body,
      timeAgo: timeAgo(saved.createdAt),
      createdAt: saved.createdAt,
      climber: author.get(userId) ?? null,
    };
  }

  async listComments(routeId: string) {
    const rows = await this.comments.find({
      where: { routeId },
      order: { createdAt: 'DESC' },
    });
    const authors = await this.usersService.summariesByIds(
      rows.map((r) => r.userId),
    );
    return rows.map((c) => ({
      id: c.id,
      body: c.body,
      timeAgo: timeAgo(c.createdAt),
      createdAt: c.createdAt,
      climber: authors.get(c.userId) ?? null,
    }));
  }

  /** sends (distinct senders) + average attempts across send logs, per route. */
  private async statsFor(
    routeIds: string[],
  ): Promise<Map<string, { sends: number; attemptsAvg: number }>> {
    if (routeIds.length === 0) return new Map();
    const rows: {
      route_id: string;
      sends: string;
      attempts_avg: string | null;
    }[] = await this.dataSource.query(
      `SELECT route_id,
              COUNT(DISTINCT user_id) FILTER (WHERE outcome IN ('send','flash'))::int AS sends,
              AVG(attempts) FILTER (WHERE outcome IN ('send','flash')) AS attempts_avg
       FROM climb_logs
       WHERE route_id = ANY($1)
       GROUP BY route_id`,
      [routeIds],
    );
    return new Map(
      rows.map((r) => [
        r.route_id,
        {
          sends: Number(r.sends),
          attemptsAvg: r.attempts_avg ? Number(Number(r.attempts_avg).toFixed(1)) : 0,
        },
      ]),
    );
  }

  private async recentSenders(routeId: string) {
    const rows: { user_id: string }[] = await this.dataSource.query(
      `SELECT user_id, MAX(logged_at) AS last
       FROM climb_logs
       WHERE route_id = $1 AND outcome IN ('send','flash')
       GROUP BY user_id
       ORDER BY last DESC
       LIMIT 8`,
      [routeId],
    );
    const summaries = await this.usersService.summariesByIds(
      rows.map((r) => r.user_id),
    );
    return rows
      .map((r) => summaries.get(r.user_id))
      .filter((s): s is NonNullable<typeof s> => Boolean(s));
  }

  private async viewerStatus(
    routeId: string,
    viewerId: string,
  ): Promise<'flashed' | 'sent' | 'project' | null> {
    const [row] = await this.dataSource.query(
      `SELECT
         bool_or(outcome = 'flash') AS flashed,
         bool_or(outcome = 'send') AS sent,
         bool_or(outcome = 'project') AS project
       FROM climb_logs WHERE route_id = $1 AND user_id = $2`,
      [routeId, viewerId],
    );
    if (!row) return null;
    if (row.flashed) return 'flashed';
    if (row.sent) return 'sent';
    if (row.project) return 'project';
    return null;
  }

  private async gymMap(gymIds: string[]): Promise<Map<string, string>> {
    const ids = [...new Set(gymIds)];
    if (ids.length === 0) return new Map();
    const gyms = await this.gyms.findByIds(ids);
    return new Map(gyms.map((g) => [g.id, g.name]));
  }

  private toView(
    route: ClimbingRouteEntity,
    stats: { sends: number; attemptsAvg: number } | undefined,
    gymName: string | undefined,
  ) {
    return {
      id: route.id,
      name: route.name,
      grade: route.grade,
      gymId: route.gymId,
      gym: gymName ?? null,
      wall: route.wall ?? null,
      color: route.color ?? null,
      setter: route.setter ?? null,
      setterInitials: route.setterInitials ?? null,
      style: route.styleTags,
      sends: stats?.sends ?? 0,
      attemptsAvg: stats?.attemptsAvg ?? 0,
      betaVideos: route.betaVideoCount,
    };
  }
}

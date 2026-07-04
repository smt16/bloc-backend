import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FeedKind } from '../feed/entities/feed-item.entity';
import { FeedService } from '../feed/feed.service';
import { UsersService } from '../users/users.service';
import { CreateLogDto } from './dto';
import { ClimbLogEntity } from './entities/climb-log.entity';
import { ClimbSessionEntity } from './entities/climb-session.entity';
import { ClimbingRouteEntity } from './entities/climbing-route.entity';

@Injectable()
export class LogsService {
  constructor(
    @InjectRepository(ClimbLogEntity)
    private readonly logs: Repository<ClimbLogEntity>,
    @InjectRepository(ClimbingRouteEntity)
    private readonly routes: Repository<ClimbingRouteEntity>,
    @InjectRepository(ClimbSessionEntity)
    private readonly sessions: Repository<ClimbSessionEntity>,
    private readonly feedService: FeedService,
    private readonly usersService: UsersService,
  ) {}

  async create(userId: string, dto: CreateLogDto) {
    let gymId = dto.gymId ?? null;
    let routeName: string | null = null;

    if (dto.routeId) {
      const route = await this.routes.findOne({ where: { id: dto.routeId } });
      if (!route) throw new NotFoundException('Route not found');
      routeName = route.name;
      gymId = gymId ?? route.gymId;
    }
    if (dto.sessionId) {
      const session = await this.sessions.findOne({
        where: { id: dto.sessionId, userId },
      });
      if (!session) throw new NotFoundException('Session not found');
      gymId = gymId ?? session.gymId ?? null;
    }

    const log = await this.logs.save(
      this.logs.create({
        userId,
        routeId: dto.routeId ?? null,
        gymId,
        sessionId: dto.sessionId ?? null,
        grade: dto.grade,
        outcome: dto.outcome,
        attempts: dto.attempts ?? 1,
        note: dto.note ?? null,
        hasMedia: dto.hasMedia ?? false,
        loggedAt: new Date(),
      }),
    );

    await this.usersService.recordSendActivity(userId, dto.grade, dto.outcome);

    const feedItem = await this.feedService.createActivity({
      userId,
      kind: this.feedKind(dto.outcome),
      headline: this.headline(dto.outcome, routeName, dto.grade),
      routeId: dto.routeId ?? null,
      routeName,
      gymId,
      sessionId: dto.sessionId ?? null,
      grade: dto.grade,
      note: dto.note ?? null,
      attempts: dto.attempts ?? 1,
      hasMedia: dto.hasMedia ?? false,
    });

    return { log, feedItemId: feedItem.id };
  }

  async listForUser(userId: string) {
    return this.logs.find({
      where: { userId },
      order: { loggedAt: 'DESC' },
      take: 100,
    });
  }

  private feedKind(outcome: string): FeedKind {
    return outcome === 'project' ? 'project' : 'send';
  }

  private headline(
    outcome: string,
    routeName: string | null,
    grade: string,
  ): string {
    const target = routeName ?? `a ${grade}`;
    switch (outcome) {
      case 'flash':
        return `flashed ${target}`;
      case 'project':
        return `is projecting ${target}`;
      default:
        return `sent ${target}`;
    }
  }
}

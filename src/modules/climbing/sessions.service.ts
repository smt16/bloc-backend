import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { GymEntity } from '../gyms/entities/gym.entity';
import { CreateSessionDto } from './dto';
import { ClimbSessionEntity } from './entities/climb-session.entity';

const gradeValue = (grade: string): number => {
  const match = /^[Vv]?(\d+)/.exec(grade ?? '');
  return match ? parseInt(match[1], 10) : -1;
};

@Injectable()
export class SessionsService {
  constructor(
    @InjectRepository(ClimbSessionEntity)
    private readonly sessions: Repository<ClimbSessionEntity>,
    @InjectRepository(GymEntity)
    private readonly gyms: Repository<GymEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async create(userId: string, dto: CreateSessionDto) {
    const session = await this.sessions.save(
      this.sessions.create({
        userId,
        gymId: dto.gymId ?? null,
        sessionDate: dto.sessionDate ?? new Date().toISOString().slice(0, 10),
        durationMins: dto.durationMins ?? null,
        note: dto.note ?? null,
      }),
    );
    return this.decorateOne(session);
  }

  async listForUser(userId: string) {
    const sessions = await this.sessions.find({
      where: { userId },
      order: { sessionDate: 'DESC', createdAt: 'DESC' },
    });
    const gyms = await this.gymMap(sessions.map((s) => s.gymId));
    const breakdown = await this.gradeBreakdown(sessions.map((s) => s.id));

    return {
      summary: await this.weeklySummary(userId),
      sessions: sessions.map((s) =>
        this.toView(s, gyms.get(s.gymId ?? ''), breakdown.get(s.id) ?? []),
      ),
    };
  }

  async getOne(id: string, userId: string) {
    const session = await this.sessions.findOne({ where: { id, userId } });
    if (!session) throw new NotFoundException('Session not found');
    return this.decorateOne(session);
  }

  private async decorateOne(session: ClimbSessionEntity) {
    const gyms = await this.gymMap([session.gymId]);
    const breakdown = await this.gradeBreakdown([session.id]);
    return this.toView(
      session,
      gyms.get(session.gymId ?? ''),
      breakdown.get(session.id) ?? [],
    );
  }

  private async gradeBreakdown(
    sessionIds: string[],
  ): Promise<Map<string, { grade: string; count: number }[]>> {
    if (sessionIds.length === 0) return new Map();
    const rows: { session_id: string; grade: string; count: string }[] =
      await this.dataSource.query(
        `SELECT session_id, grade, COUNT(*)::int AS count
         FROM climb_logs
         WHERE session_id = ANY($1) AND outcome IN ('send','flash')
         GROUP BY session_id, grade`,
        [sessionIds],
      );
    const map = new Map<string, { grade: string; count: number }[]>();
    for (const row of rows) {
      const list = map.get(row.session_id) ?? [];
      list.push({ grade: row.grade, count: Number(row.count) });
      map.set(row.session_id, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => gradeValue(a.grade) - gradeValue(b.grade));
    }
    return map;
  }

  private async sessionTotals(sessionId: string) {
    const [row] = await this.dataSource.query(
      `SELECT
         COUNT(*) FILTER (WHERE outcome IN ('send','flash'))::int AS sends,
         COALESCE(SUM(attempts), 0)::int AS attempts,
         COUNT(*) FILTER (WHERE outcome = 'flash')::int AS flashes
       FROM climb_logs WHERE session_id = $1`,
      [sessionId],
    );
    return {
      sends: row?.sends ?? 0,
      attempts: row?.attempts ?? 0,
      flashes: row?.flashes ?? 0,
    };
  }

  private async weeklySummary(userId: string) {
    const [row] = await this.dataSource.query(
      `SELECT
         COUNT(*) FILTER (WHERE session_date >= date_trunc('week', current_date))::int AS sessions_this_week,
         COALESCE(SUM(duration_mins) FILTER (WHERE session_date >= date_trunc('week', current_date)), 0)::int AS minutes_this_week
       FROM climb_sessions WHERE user_id = $1`,
      [userId],
    );
    const [flashRow] = await this.dataSource.query(
      `SELECT
         COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE outcome = 'flash')::int AS flashes
       FROM (
         SELECT outcome FROM climb_logs
         WHERE user_id = $1 AND outcome IN ('send','flash')
         ORDER BY logged_at DESC LIMIT 10
       ) recent`,
      [userId],
    );
    const flashRate =
      flashRow && flashRow.total > 0
        ? Math.round((flashRow.flashes / flashRow.total) * 100)
        : 0;
    return {
      sessionsThisWeek: row?.sessions_this_week ?? 0,
      hoursThisWeek: Number(((row?.minutes_this_week ?? 0) / 60).toFixed(1)),
      flashRate,
    };
  }

  private async toView(
    session: ClimbSessionEntity,
    gymName: string | undefined,
    grades: { grade: string; count: number }[],
  ) {
    const totals = await this.sessionTotals(session.id);
    const hardest = grades.length
      ? grades.reduce((a, b) => (gradeValue(b.grade) > gradeValue(a.grade) ? b : a))
          .grade
      : null;
    return {
      id: session.id,
      date: session.sessionDate,
      gym: gymName ?? null,
      gymId: session.gymId,
      durationMins: session.durationMins,
      note: session.note,
      hardest,
      sends: totals.sends,
      attempts: totals.attempts,
      flashes: totals.flashes,
      grades,
    };
  }

  private async gymMap(gymIds: (string | null | undefined)[]) {
    const ids = [...new Set(gymIds.filter((id): id is string => Boolean(id)))];
    if (ids.length === 0) return new Map<string, string>();
    const gyms = await this.gyms.findByIds(ids);
    return new Map(gyms.map((g) => [g.id, g.name]));
  }
}

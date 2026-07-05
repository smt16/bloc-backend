import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, ILike, Not, QueryFailedError, Repository } from 'typeorm';
import { AuthenticatedUser } from '../auth/auth0.types';
import { Auth0UserInfoService } from '../auth/services/auth0-userinfo.service';
import { GymEntity } from '../gyms/entities/gym.entity';
import { ListUsersQueryDto, UpdateMeDto } from './dto';
import { FollowEntity } from './entities/follow.entity';
import { MilestoneEntity } from './entities/milestone.entity';
import { UserEntity } from './entities/user.entity';
import {
  ClimberSummary,
  colorForSeed,
  initialsForName,
  toClimberSummary,
} from './user.mapper';

const gradeValue = (grade: string): number => {
  const match = /^[Vv]?(\d+)/.exec(grade ?? '');
  return match ? parseInt(match[1], 10) : -1;
};

const monthYear = (date: Date | null): string | null =>
  date
    ? date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : null;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly users: Repository<UserEntity>,
    @InjectRepository(FollowEntity)
    private readonly follows: Repository<FollowEntity>,
    @InjectRepository(MilestoneEntity)
    private readonly milestones: Repository<MilestoneEntity>,
    @InjectRepository(GymEntity)
    private readonly gyms: Repository<GymEntity>,
    private readonly dataSource: DataSource,
    private readonly auth0UserInfo: Auth0UserInfoService,
  ) {}

  /**
   * Upserts and returns the local user record for the authenticated Auth0
   * principal. Called at the start of any request that needs a local user id.
   */
  async resolveCurrentUser(auth: AuthenticatedUser): Promise<UserEntity> {
    let user = await this.users.findOne({ where: { auth0Sub: auth.sub } });

    const missingFromToken = !auth.email || !auth.name || !auth.picture;
    const missingFromDb =
      !user || !user.email || !user.name || !user.pictureUrl;

    const profile =
      missingFromToken && missingFromDb
        ? await this.auth0UserInfo.resolveProfileFields(auth)
        : {
            email: auth.email,
            name: auth.name,
            picture: auth.picture,
          };

    if (!user) {
      user = this.users.create({
        auth0Sub: auth.sub,
        email: profile.email ?? null,
        name: profile.name ?? null,
        pictureUrl: profile.picture ?? null,
        avatarColor: colorForSeed(auth.sub),
        initials: initialsForName(profile.name),
        styleTags: [],
      });
      try {
        return await this.users.save(user);
      } catch (err) {
        // A concurrent request for the same principal may have inserted the
        // row first (unique_violation on uq_users_auth0_sub). Re-read it.
        const pgCode =
          err instanceof QueryFailedError
            ? ((err.driverError as { code?: string })?.code ??
              (err as unknown as { code?: string }).code)
            : undefined;
        if (pgCode === '23505') {
          const existing = await this.users.findOne({
            where: { auth0Sub: auth.sub },
          });
          if (existing) return this.syncIdentityFields(existing, profile);
        }
        throw err;
      }
    }

    return this.syncIdentityFields(user, profile);
  }

  /** Keep identity fields fresh from Auth0 without clobbering user edits. */
  private syncIdentityFields(
    user: UserEntity,
    profile: { email?: string; name?: string; picture?: string },
  ): Promise<UserEntity> | UserEntity {
    let dirty = false;

    if (profile.email && profile.email !== user.email) {
      user.email = profile.email;
      dirty = true;
    }
    if (profile.picture && profile.picture !== user.pictureUrl) {
      user.pictureUrl = profile.picture;
      dirty = true;
    }
    if (!user.name && profile.name) {
      user.name = profile.name;
      user.initials = initialsForName(profile.name);
      dirty = true;
    } else if (
      user.initials === '?' &&
      profile.name &&
      initialsForName(profile.name) !== '?'
    ) {
      user.initials = initialsForName(profile.name);
      dirty = true;
    }

    return dirty ? this.users.save(user) : user;
  }

  async findByIdOrThrow(id: string): Promise<UserEntity> {
    const user = await this.users.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  /** Batch-load compact climber summaries keyed by user id. */
  async summariesByIds(ids: string[]): Promise<Map<string, ClimberSummary>> {
    const unique = [...new Set(ids.filter(Boolean))];
    if (unique.length === 0) return new Map();
    const users = await this.users.findByIds(unique);
    return new Map(users.map((u) => [u.id, toClimberSummary(u)]));
  }

  /**
   * Called after a climb is logged: bumps the top grade if the send is harder
   * and recomputes the current daily logging streak.
   */
  async recordSendActivity(
    userId: string,
    grade: string,
    outcome: string,
  ): Promise<void> {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) return;

    let dirty = false;
    if (
      (outcome === 'send' || outcome === 'flash') &&
      gradeValue(grade) > gradeValue(user.topGrade ?? 'V-1')
    ) {
      user.topGrade = grade;
      dirty = true;
    }

    const [row] = await this.dataSource.query(
      `WITH days AS (
         SELECT DISTINCT date_trunc('day', logged_at)::date AS d
         FROM climb_logs WHERE user_id = $1
       ),
       ordered AS (
         SELECT d, (d - (ROW_NUMBER() OVER (ORDER BY d DESC))::int) AS grp
         FROM days
       )
       SELECT COUNT(*)::int AS streak
       FROM ordered
       WHERE grp = (
         SELECT grp FROM ordered ORDER BY d DESC LIMIT 1
       )
       AND (SELECT MAX(d) FROM days) >= current_date - 1`,
      [userId],
    );
    const streak = row?.streak ?? 0;
    if (streak !== user.streakDays) {
      user.streakDays = streak;
      dirty = true;
    }

    if (dirty) await this.users.save(user);
  }

  async listClimbers(
    query: ListUsersQueryDto,
    viewerId: string,
  ): Promise<
    (ClimberSummary & { homeGym?: string | null; isFollowing: boolean })[]
  > {
    const limit = Math.min(query.limit ?? 20, 100);
    const where = query.search
      ? [
          { name: ILike(`%${query.search}%`), id: Not(viewerId) },
          { handle: ILike(`%${query.search}%`), id: Not(viewerId) },
        ]
      : { id: Not(viewerId) };

    const users = await this.users.find({
      where,
      take: limit,
      skip: query.offset ?? 0,
      order: { createdAt: 'DESC' },
    });

    const following = await this.followingIds(viewerId);
    const gymNames = await this.gymNameMap(users);

    return users.map((u) => ({
      ...toClimberSummary(u),
      homeGym: u.homeGymId ? (gymNames.get(u.homeGymId) ?? null) : null,
      isFollowing: following.has(u.id),
    }));
  }

  async updateMe(userId: string, dto: UpdateMeDto): Promise<UserEntity> {
    const user = await this.findByIdOrThrow(userId);

    if (dto.handle && dto.handle !== user.handle) {
      const clash = await this.users.findOne({
        where: { handle: dto.handle },
      });
      if (clash && clash.id !== userId) {
        throw new ConflictException('Handle already taken');
      }
    }
    if (dto.homeGymId) {
      const gym = await this.gyms.findOne({ where: { id: dto.homeGymId } });
      if (!gym) throw new NotFoundException('Home gym not found');
    }

    Object.assign(user, {
      name: dto.name ?? user.name,
      handle: dto.handle ?? user.handle,
      bio: dto.bio ?? user.bio,
      homeGymId: dto.homeGymId ?? user.homeGymId,
      topGrade: dto.topGrade ?? user.topGrade,
      avatarColor: dto.avatarColor ?? user.avatarColor,
      styleTags: dto.styleTags ?? user.styleTags,
      privacy: dto.privacy ?? user.privacy,
    });
    return this.users.save(user);
  }

  async follow(followerId: string, followeeId: string): Promise<void> {
    if (followerId === followeeId) {
      throw new ConflictException('You cannot follow yourself');
    }
    await this.findByIdOrThrow(followeeId);
    const existing = await this.follows.findOne({
      where: { followerId, followeeId },
    });
    if (!existing) {
      await this.follows.save(this.follows.create({ followerId, followeeId }));
    }
  }

  async unfollow(followerId: string, followeeId: string): Promise<void> {
    await this.follows.delete({ followerId, followeeId });
  }

  /** Full profile payload for the profile screen. */
  async getProfile(userId: string, viewerId: string) {
    const user = await this.findByIdOrThrow(userId);

    const [stats, pyramid, timeline, achievements, gymNames, following] =
      await Promise.all([
        this.computeStats(userId),
        this.computeGradePyramid(userId),
        this.milestones.find({
          where: { userId, kind: 'milestone' },
          order: { achievedAt: 'DESC' },
        }),
        this.milestones.find({
          where: { userId, kind: 'achievement' },
          order: { createdAt: 'ASC' },
        }),
        this.gymNameMap([user]),
        viewerId === userId
          ? this.followingIds(viewerId)
          : Promise.resolve(new Set<string>()),
      ]);

    return {
      ...toClimberSummary(user),
      email: user.email ?? null,
      bio: user.bio ?? null,
      styleTags: user.styleTags,
      privacy: user.privacy,
      homeGym: user.homeGymId
        ? { id: user.homeGymId, name: gymNames.get(user.homeGymId) ?? null }
        : null,
      stats,
      gradePyramid: pyramid,
      timeline: timeline.map((m) => ({
        id: m.id,
        title: m.title,
        detail: m.detail,
        icon: m.icon,
        tone: m.tone,
        date: monthYear(m.achievedAt ?? null),
      })),
      achievements: achievements.map((a) => ({
        id: a.id,
        label: a.title,
        icon: a.icon,
        tone: a.tone,
        earned: a.earned,
      })),
      isFollowing: viewerId !== userId ? following.has(userId) : undefined,
      isMe: viewerId === userId,
    };
  }

  private async computeStats(userId: string) {
    const [logRow] = await this.dataSource.query(
      `SELECT
         COUNT(*) FILTER (WHERE outcome IN ('send','flash'))::int AS sends,
         COUNT(*) FILTER (WHERE outcome = 'flash')::int AS flashes
       FROM climb_logs WHERE user_id = $1`,
      [userId],
    );
    const [hardestRow] = await this.dataSource.query(
      `SELECT grade FROM climb_logs
       WHERE user_id = $1 AND outcome IN ('send','flash')
       ORDER BY NULLIF(regexp_replace(grade, '\\D', '', 'g'), '')::int DESC NULLS LAST
       LIMIT 1`,
      [userId],
    );
    const [sessionRow] = await this.dataSource.query(
      `SELECT COUNT(*)::int AS sessions FROM climb_sessions WHERE user_id = $1`,
      [userId],
    );
    const [crewRow] = await this.dataSource.query(
      `SELECT COUNT(*)::int AS crews FROM crew_members WHERE user_id = $1`,
      [userId],
    );
    const user = await this.users.findOne({ where: { id: userId } });

    return {
      sends: logRow?.sends ?? 0,
      flashes: logRow?.flashes ?? 0,
      sessions: sessionRow?.sessions ?? 0,
      crews: crewRow?.crews ?? 0,
      streak: user?.streakDays ?? 0,
      hardest: hardestRow?.grade ?? null,
    };
  }

  private async computeGradePyramid(
    userId: string,
  ): Promise<{ grade: string; sends: number }[]> {
    const rows: { grade: string; sends: string }[] =
      await this.dataSource.query(
        `SELECT grade, COUNT(*)::int AS sends
       FROM climb_logs
       WHERE user_id = $1 AND outcome IN ('send','flash')
       GROUP BY grade`,
        [userId],
      );
    return rows
      .map((r) => ({ grade: r.grade, sends: Number(r.sends) }))
      .sort((a, b) => gradeValue(b.grade) - gradeValue(a.grade))
      .slice(0, 6);
  }

  private async followingIds(userId: string): Promise<Set<string>> {
    const rows = await this.follows.find({ where: { followerId: userId } });
    return new Set(rows.map((r) => r.followeeId));
  }

  private async gymNameMap(users: UserEntity[]): Promise<Map<string, string>> {
    const ids = users
      .map((u) => u.homeGymId)
      .filter((id): id is string => Boolean(id));
    if (ids.length === 0) return new Map();
    const gyms = await this.gyms.findByIds(ids);
    return new Map(gyms.map((g) => [g.id, g.name]));
  }
}

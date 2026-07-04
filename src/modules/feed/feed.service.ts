import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { GymEntity } from '../gyms/entities/gym.entity';
import { UsersService } from '../users/users.service';
import { FeedQueryDto, ReactionTypeDto } from './dto';
import { FeedCommentEntity } from './entities/feed-comment.entity';
import { FeedItemEntity, FeedKind } from './entities/feed-item.entity';
import { ReactionEntity } from './entities/reaction.entity';

export interface CreateActivityInput {
  userId: string;
  kind: FeedKind;
  headline: string;
  routeId?: string | null;
  routeName?: string | null;
  gymId?: string | null;
  sessionId?: string | null;
  grade?: string | null;
  note?: string | null;
  attempts?: number | null;
  hasMedia?: boolean;
}

const timeAgo = (date: Date): string => {
  const diffMs = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return `${Math.floor(days / 7)}w`;
};

@Injectable()
export class FeedService {
  constructor(
    @InjectRepository(FeedItemEntity)
    private readonly feedItems: Repository<FeedItemEntity>,
    @InjectRepository(ReactionEntity)
    private readonly reactions: Repository<ReactionEntity>,
    @InjectRepository(FeedCommentEntity)
    private readonly comments: Repository<FeedCommentEntity>,
    @InjectRepository(GymEntity)
    private readonly gyms: Repository<GymEntity>,
    private readonly usersService: UsersService,
    private readonly dataSource: DataSource,
  ) {}

  async listFeed(viewerId: string, query: FeedQueryDto) {
    const limit = Math.min(query.limit ?? 20, 50);
    const offset = query.offset ?? 0;

    const qb = this.feedItems
      .createQueryBuilder('f')
      .orderBy('f.created_at', 'DESC')
      .take(limit)
      .skip(offset);

    if (query.scope === 'following') {
      const following = await this.dataSource.query(
        `SELECT followee_id FROM follows WHERE follower_id = $1`,
        [viewerId],
      );
      const ids = [
        viewerId,
        ...following.map((r: { followee_id: string }) => r.followee_id),
      ];
      qb.where('f.user_id IN (:...ids)', { ids });
    }

    const items = await qb.getMany();
    return this.decorate(items, viewerId);
  }

  async createActivity(input: CreateActivityInput): Promise<FeedItemEntity> {
    const item = this.feedItems.create({
      userId: input.userId,
      kind: input.kind,
      headline: input.headline,
      routeId: input.routeId ?? null,
      routeName: input.routeName ?? null,
      gymId: input.gymId ?? null,
      sessionId: input.sessionId ?? null,
      grade: input.grade ?? null,
      note: input.note ?? null,
      attempts: input.attempts ?? null,
      hasMedia: input.hasMedia ?? false,
    });
    return this.feedItems.save(item);
  }

  /** Toggle a reaction: same type removes it, a new type replaces it. */
  async react(
    feedItemId: string,
    userId: string,
    type: ReactionTypeDto,
  ): Promise<void> {
    await this.getItemOrThrow(feedItemId);
    const existing = await this.reactions.findOne({
      where: { feedItemId, userId },
    });
    if (existing) {
      if (existing.type === type) {
        await this.reactions.delete({ id: existing.id });
        return;
      }
      existing.type = type;
      await this.reactions.save(existing);
      return;
    }
    await this.reactions.save(
      this.reactions.create({ feedItemId, userId, type }),
    );
  }

  async removeReaction(feedItemId: string, userId: string): Promise<void> {
    await this.reactions.delete({ feedItemId, userId });
  }

  async addComment(feedItemId: string, userId: string, body: string) {
    await this.getItemOrThrow(feedItemId);
    const comment = await this.comments.save(
      this.comments.create({ feedItemId, userId, body }),
    );
    const author = await this.usersService.summariesByIds([userId]);
    return {
      id: comment.id,
      body: comment.body,
      createdAt: comment.createdAt,
      timeAgo: timeAgo(comment.createdAt),
      author: author.get(userId) ?? null,
    };
  }

  async listComments(feedItemId: string) {
    const rows = await this.comments.find({
      where: { feedItemId },
      order: { createdAt: 'ASC' },
    });
    const authors = await this.usersService.summariesByIds(
      rows.map((r) => r.userId),
    );
    return rows.map((c) => ({
      id: c.id,
      body: c.body,
      createdAt: c.createdAt,
      timeAgo: timeAgo(c.createdAt),
      author: authors.get(c.userId) ?? null,
    }));
  }

  private async getItemOrThrow(id: string): Promise<FeedItemEntity> {
    const item = await this.feedItems.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Feed item not found');
    return item;
  }

  /** Enrich raw feed rows with author, gym, reaction + comment counts. */
  private async decorate(items: FeedItemEntity[], viewerId: string) {
    if (items.length === 0) return [];
    const ids = items.map((i) => i.id);
    const [authors, gyms, reactionRows, myReactions, commentRows] =
      await Promise.all([
        this.usersService.summariesByIds(items.map((i) => i.userId)),
        this.gymMap(items),
        this.dataSource.query(
          `SELECT feed_item_id,
                  COUNT(*) FILTER (WHERE type='fire')::int AS fire,
                  COUNT(*) FILTER (WHERE type='strong')::int AS strong,
                  COUNT(*) FILTER (WHERE type='clap')::int AS clap
           FROM reactions WHERE feed_item_id = ANY($1) GROUP BY feed_item_id`,
          [ids],
        ),
        this.reactions.find({
          where: { feedItemId: In(ids), userId: viewerId },
        }),
        this.dataSource.query(
          `SELECT feed_item_id, COUNT(*)::int AS count
           FROM feed_comments WHERE feed_item_id = ANY($1) GROUP BY feed_item_id`,
          [ids],
        ),
      ]);

    const reactionMap = new Map(
      reactionRows.map((r: any) => [
        r.feed_item_id,
        { fire: r.fire, strong: r.strong, clap: r.clap },
      ]),
    );
    const commentMap = new Map(
      commentRows.map((r: any) => [r.feed_item_id, Number(r.count)]),
    );
    const mineMap = new Map(myReactions.map((r) => [r.feedItemId, r.type]));

    return items.map((item) => ({
      id: item.id,
      kind: item.kind,
      headline: item.headline,
      climber: authors.get(item.userId) ?? null,
      routeId: item.routeId,
      routeName: item.routeName,
      grade: item.grade,
      gym: item.gymId ? (gyms.get(item.gymId) ?? null) : null,
      note: item.note,
      attempts: item.attempts,
      media: item.hasMedia,
      timeAgo: timeAgo(item.createdAt),
      createdAt: item.createdAt,
      reactions: reactionMap.get(item.id) ?? { fire: 0, strong: 0, clap: 0 },
      comments: commentMap.get(item.id) ?? 0,
      reactedByMe: mineMap.get(item.id) ?? null,
    }));
  }

  private async gymMap(items: FeedItemEntity[]): Promise<Map<string, string>> {
    const ids = items
      .map((i) => i.gymId)
      .filter((id): id is string => Boolean(id));
    if (ids.length === 0) return new Map();
    const gyms = await this.gyms.findByIds(ids);
    return new Map(gyms.map((g) => [g.id, g.name]));
  }
}

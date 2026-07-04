import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export const REACTION_TYPES = ['fire', 'strong', 'clap'] as const;
export type ReactionTypeDto = (typeof REACTION_TYPES)[number];

export class FeedQueryDto {
  @IsOptional()
  @IsIn(['following', 'global'])
  scope?: 'following' | 'global';

  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  offset?: number;
}

export class ReactDto {
  @IsIn(REACTION_TYPES)
  type!: ReactionTypeDto;
}

export class CreateFeedCommentDto {
  @IsString()
  @MaxLength(1000)
  body!: string;
}

import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export const CLIMB_OUTCOMES = ['flash', 'send', 'project'] as const;
export type ClimbOutcomeDto = (typeof CLIMB_OUTCOMES)[number];

export class RouteQueryDto {
  @IsOptional()
  @IsUUID()
  gymId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  grade?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  search?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  offset?: number;
}

export class CreateRouteDto {
  @IsUUID()
  gymId!: string;

  @IsString()
  @MaxLength(120)
  name!: string;

  @IsString()
  @MaxLength(8)
  grade!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  wall?: string;

  @IsOptional()
  @IsString()
  @MaxLength(9)
  color?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  setter?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4)
  setterInitials?: string;

  @IsOptional()
  @IsString()
  @MaxLength(280)
  setterNote?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  styleTags?: string[];
}

export class CreateRouteCommentDto {
  @IsString()
  @MaxLength(1000)
  body!: string;
}

export class CreateSessionDto {
  @IsOptional()
  @IsUUID()
  gymId?: string;

  @IsOptional()
  @IsDateString()
  sessionDate?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  durationMins?: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;
}

export class CreateLogDto {
  @IsString()
  @MaxLength(8)
  grade!: string;

  @IsIn(CLIMB_OUTCOMES)
  outcome!: ClimbOutcomeDto;

  @IsOptional()
  @IsInt()
  @Min(1)
  attempts?: number;

  @IsOptional()
  @IsUUID()
  routeId?: string;

  @IsOptional()
  @IsUUID()
  gymId?: string;

  @IsOptional()
  @IsUUID()
  sessionId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;

  @IsOptional()
  @IsBoolean()
  hasMedia?: boolean;
}

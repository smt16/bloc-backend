import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCrewDto {
  @IsString()
  @MaxLength(80)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(16)
  emoji?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  blurb?: string;
}

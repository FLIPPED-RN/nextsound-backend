import { IsString, IsOptional, IsInt, IsEnum } from 'class-validator';
import { TrackVisibility } from '../entities/track.entity';

export class CreateTrackDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  genre?: string;

  @IsOptional()
  @IsInt()
  bpm?: number;

  @IsString()
  file_path!: string;

  @IsOptional()
  @IsString()
  cover_path?: string;

  @IsOptional()
  @IsEnum(TrackVisibility)
  visibility?: TrackVisibility;
}
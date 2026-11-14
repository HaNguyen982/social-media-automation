
import {
  IsDateString,
  IsIn,
  IsMongoId,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreatePublishingLogDto {
  @IsMongoId()
  contentId: string;

  @IsIn(['SIMULATED', 'SUCCESS', 'FAILED'])
  logStatus: 'SIMULATED' | 'SUCCESS' | 'FAILED';

  @IsString()
  @MinLength(1)
  logMessage: string;

  @IsIn(['SIMULATION', 'LIVE'])
  publishingMode: 'SIMULATION' | 'LIVE';

  @IsOptional()
  @IsString()
  facebookPostId?: string | null;

  @IsDateString()
  loggedAt: string;
}

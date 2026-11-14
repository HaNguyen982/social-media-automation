
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  ContentStatus,
  MedicalReviewDecision,
} from '../schemas/content.schema';

export class MedicalReviewDto {
  @IsEnum(MedicalReviewDecision)
  decision!: MedicalReviewDecision;

  @IsArray()
  @IsString({ each: true })
  medicalIssues!: string[];

  @IsString()
  explanation!: string;

}

export class CreateContentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  topic!: string;

  @IsString()
  @IsNotEmpty()
  body!: string;

  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  sourceUrls?: string[];

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => MedicalReviewDto)
  medicalReview?: MedicalReviewDto;

  @IsOptional()
  @IsString()
  reviewStatus?: string;

  @IsOptional()
  @IsBoolean()
  requiresHumanReview?: boolean;

  @IsOptional()
  @IsString()
  reviewMessage?: string;

  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;
}

export class ReviewContentDto {
  @IsOptional()
  @IsString()
  reviewer?: string;

  @IsOptional()
  @IsString()
  reviewMessage?: string;
}

export class PublishContentDto {
  @IsString()
  @IsNotEmpty()
  facebookPostId!: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  bufferPostId?: string;

  @IsOptional()
  @IsUrl({
    protocols: ['https'],
    require_protocol: true,
    require_tld: true,
    require_valid_protocol: true,
    host_whitelist: ['facebook.com', 'www.facebook.com', 'm.facebook.com'],
  })
  facebookPostUrl?: string;
}

export class MarkReconciliationDto {
  @IsString()
  @IsNotEmpty()
  reconciliationNote!: string;
}
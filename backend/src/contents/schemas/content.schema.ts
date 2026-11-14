
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ContentDocument = HydratedDocument<Content>;

export enum ContentStatus {
  PENDING_REVIEW = 'PENDING_REVIEW',
  APPROVED = 'APPROVED',
  PUBLISHING = 'PUBLISHING',
  REJECTED = 'REJECTED',
  PUBLISHED = 'PUBLISHED',
}

export enum MedicalReviewDecision {
  APPROVED = 'APPROVED',
  NEEDS_REVIEW = 'NEEDS_REVIEW',
  REJECTED = 'REJECTED',
}

@Schema({ _id: false })
export class MedicalReview {
  @Prop({
    type: String,
    enum: MedicalReviewDecision,
    required: true,
  })
  decision!: MedicalReviewDecision;

  @Prop({ type: [String], default: [] })
  medicalIssues!: string[];

  @Prop({ type: String, default: '' })
  explanation!: string;
}

export const MedicalReviewSchema =
  SchemaFactory.createForClass(MedicalReview);

export enum ReconciliationStatus {
  NOT_REQUIRED = 'NOT_REQUIRED',
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  NEEDS_MANUAL_REVIEW = 'NEEDS_MANUAL_REVIEW',
}

@Schema({ timestamps: true, versionKey: false })
export class Content {
  @Prop({ required: true, trim: true, maxlength: 200 })
  title!: string;

  @Prop({ required: true, trim: true, maxlength: 100 })
  topic!: string;

  @Prop({ required: true, trim: true })
  body!: string;

  @Prop({ type: [String], default: [] })
  sourceUrls!: string[];

  @Prop({
    type: String,
    enum: ContentStatus,
    default: ContentStatus.PENDING_REVIEW,
  })
  status!: ContentStatus;

  @Prop({
    type: MedicalReviewSchema,
    default: undefined,
  })
  medicalReview?: MedicalReview;

  @Prop({ type: String, default: 'NOT_REVIEWED' })
  reviewStatus!: string;

  @Prop({ type: Boolean, default: false })
  requiresHumanReview!: boolean;

  @Prop({ type: String, default: '' })
  reviewMessage!: string;

  @Prop({ type: String, default: '' })
  reviewer!: string;

  @Prop({ type: Date, default: null })
  reviewedAt?: Date | null;

  // ID bài đăng do Buffer trả về
  @Prop({ type: String, default: '' })
  bufferPostId!: string;

  @Prop({
    type: String,
    enum: ReconciliationStatus,
    default: ReconciliationStatus.NOT_REQUIRED,
  })
  reconciliationStatus!: ReconciliationStatus;

  @Prop({ type: String, default: '' })
  reconciliationNote!: string;

  // ID bài đăng Facebook
  @Prop({ type: String, default: '' })
  facebookPostId!: string;

  // Đường dẫn bài đăng Facebook
  @Prop({ type: String, default: '' })
  facebookPostUrl!: string;

  @Prop({ type: Date, default: null })
  publishedAt?: Date | null;
}



export const ContentSchema = SchemaFactory.createForClass(Content);

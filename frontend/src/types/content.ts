/**
 * Data contracts strictly matching the NestJS Content Schema
 * (/social-media-content-api/src/contents/schemas/content.schema.ts)
 */

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

export interface MedicalReview {
  decision: MedicalReviewDecision;
  medicalIssues: string[];
  explanation: string;
}

export interface ContentItem {
  _id: string;
  title: string;
  topic: string;
  body: string;
  sourceUrls: string[];
  status: ContentStatus;
  medicalReview?: MedicalReview;
  reviewStatus: string;
  requiresHumanReview: boolean;
  reviewMessage?: string;
  reviewer?: string;
  reviewedAt?: string | null;
  facebookPostId?: string;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateContentInput {
  title: string;
  topic: string;
  body: string;
  sourceUrls?: string[];
  medicalReview?: MedicalReview;
  reviewStatus?: string;
  requiresHumanReview?: boolean;
  reviewMessage?: string;
  status?: ContentStatus;
}

export interface ReviewContentInput {
  reviewer?: string;
  reviewMessage?: string;
}

export interface PublishContentInput {
  facebookPostId: string;
}

/**
 * Data contracts strictly matching the NestJS PublishingLog Schema
 * (/social-media-content-api/src/publishing-logs/schemas/publishing-log.schema.ts)
 */

export type LogStatus = 'SIMULATED' | 'SUCCESS' | 'FAILED';
export type PublishingMode = 'SIMULATION' | 'LIVE';

export interface PublishingLogItem {
  _id?: string;
  contentId: string;
  logStatus: LogStatus;
  logMessage: string;
  publishingMode: PublishingMode;
  facebookPostId?: string | null;
  loggedAt: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePublishingLogInput {
  contentId: string;
  logStatus: LogStatus;
  logMessage: string;
  publishingMode: PublishingMode;
  facebookPostId?: string | null;
  loggedAt: string;
}

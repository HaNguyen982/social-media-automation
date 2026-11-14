export type SocialPlatform = 'facebook' | 'instagram' | 'tiktok' | 'threads' | 'youtube';

export interface SocialAccount {
  id: string;
  platform: SocialPlatform;
  accountName: string;
  handle: string;
  avatarUrl: string;
  status: 'connected' | 'expired' | 'disconnected';
  pageId: string;
  followersCount: number;
  postCount: number;
  lastSyncAt: string;
  tokenExpiresAt?: string;
}

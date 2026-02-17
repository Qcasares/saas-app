import { z } from 'zod';

export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().nullable(),
  image: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  credits: z.number().default(0),
});

export const socialAccountSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  platform: z.enum(['twitter', 'instagram', 'linkedin', 'tiktok']),
  accountId: z.string(),
  accountName: z.string(),
  accountImage: z.string().nullable(),
  accessToken: z.string(),
  refreshToken: z.string().nullable(),
  expiresAt: z.string().datetime().nullable(),
  followersCount: z.number().nullable(),
  followingCount: z.number().nullable(),
  postsCount: z.number().nullable(),
  connectedAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const subscriptionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  stripeCustomerId: z.string(),
  stripeSubscriptionId: z.string().nullable(),
  stripePriceId: z.string().nullable(),
  status: z.enum(['incomplete', 'incomplete_expired', 'trialing', 'active', 'past_due', 'canceled', 'unpaid', 'paused']),
  plan: z.enum(['starter', 'pro', 'enterprise']).nullable(),
  currentPeriodStart: z.string().datetime(),
  currentPeriodEnd: z.string().datetime(),
  cancelAtPeriodEnd: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const postSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  content: z.string().max(5000),
  mediaUrls: z.array(z.string()),
  platforms: z.array(z.enum(['twitter', 'instagram', 'linkedin', 'tiktok'])),
  status: z.enum(['draft', 'scheduled', 'publishing', 'published', 'failed']),
  scheduledAt: z.string().datetime().nullable(),
  publishedAt: z.string().datetime().nullable(),
  platformPostIds: z.record(z.string()),
  analytics: z.record(z.unknown()),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const analyticsSchema = z.object({
  id: z.string().uuid(),
  accountId: z.string().uuid(),
  platform: z.enum(['twitter', 'instagram', 'linkedin', 'tiktok']),
  date: z.string().date(),
  followers: z.number().default(0),
  following: z.number().default(0),
  posts: z.number().default(0),
  likes: z.number().default(0),
  comments: z.number().default(0),
  shares: z.number().default(0),
  impressions: z.number().default(0),
  reach: z.number().default(0),
  engagementRate: z.number().default(0),
  createdAt: z.string().datetime(),
});

export const otpSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
  expiresAt: z.string().datetime(),
  createdAt: z.string().datetime(),
});

export type UserInput = z.infer<typeof userSchema>;
export type SocialAccountInput = z.infer<typeof socialAccountSchema>;
export type SubscriptionInput = z.infer<typeof subscriptionSchema>;
export type PostInput = z.infer<typeof postSchema>;
export type AnalyticsInput = z.infer<typeof analyticsSchema>;
export type OtpInput = z.infer<typeof otpSchema>;

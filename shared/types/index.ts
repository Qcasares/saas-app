export interface User {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  createdAt: string;
  updatedAt: string;
  credits: number;
}

export interface SocialAccount {
  id: string;
  userId: string;
  platform: 'twitter' | 'instagram' | 'linkedin' | 'tiktok';
  accountId: string;
  accountName: string;
  accountImage?: string | null;
  accessToken: string;
  refreshToken?: string | null;
  expiresAt?: string | null;
  followersCount?: number;
  followingCount?: number;
  postsCount?: number;
  connectedAt: string;
  updatedAt: string;
}

export interface Subscription {
  id: string;
  userId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;
  status: 'incomplete' | 'incomplete_expired' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid' | 'paused';
  plan: 'starter' | 'pro' | 'enterprise' | null;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Post {
  id: string;
  userId: string;
  content: string;
  mediaUrls: string[];
  platforms: string[];
  status: 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed';
  scheduledAt: string | null;
  publishedAt: string | null;
  platformPostIds: Record<string, string>;
  analytics: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Analytics {
  id: string;
  accountId: string;
  platform: string;
  date: string;
  followers: number;
  following: number;
  posts: number;
  likes: number;
  comments: number;
  shares: number;
  impressions: number;
  reach: number;
  engagementRate: number;
  createdAt: string;
}

export interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  stripePriceId: string;
  limits: {
    accounts: number;
    postsPerMonth: number;
    teamMembers: number;
    analyticsRetention: number;
  };
}

export interface DashboardStats {
  totalFollowers: number;
  totalEngagement: number;
  postsThisMonth: number;
  scheduledPosts: number;
  connectedAccounts: number;
  engagementChange: number;
  followersChange: number;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  platforms: string[];
  status: Post['status'];
}

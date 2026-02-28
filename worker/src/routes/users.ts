import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { verify } from 'hono/jwt';
import type { Bindings, Variables } from '../index';
import { getUserById, updateUser } from '../db/users';

const userRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Auth middleware
const authMiddleware = async (c: any, next: any) => {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const token = authHeader.substring(7);
  
  try {
    const payload = await verify(token, c.env.JWT_SECRET) as { userId: string; email: string };
    c.set('userId', payload.userId);
    c.set('user', payload);
    await next();
  } catch {
    return c.json({ error: 'Invalid token' }, 401);
  }
};

userRoutes.use('*', authMiddleware);

// Get current user profile
userRoutes.get('/profile', async (c) => {
  const userId = c.get('userId');
  const user = await getUserById(c.env.DB, userId);
  
  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }
  
  return c.json({ user });
});

// Update user profile
userRoutes.put('/profile',
  zValidator('json', z.object({
    name: z.string().min(1).max(100).optional(),
    image: z.string().url().optional().nullable(),
  })),
  async (c) => {
    const userId = c.get('userId');
    const data = c.req.valid('json');
    
    try {
      const user = await updateUser(c.env.DB, userId, data);
      return c.json({ user });
    } catch (error) {
      return c.json({ error: 'Failed to update profile' }, 500);
    }
  }
);

// Get user stats
userRoutes.get('/stats', async (c) => {
  const userId = c.get('userId');
  const db = c.env.DB;
  
  try {
    // Get total followers across all accounts
    const followersResult = await db.prepare(`
      SELECT SUM(followers_count) as total_followers
      FROM social_accounts
      WHERE user_id = ?
    `).bind(userId).first();
    
    // Get posts this month
    const postsResult = await db.prepare(`
      SELECT COUNT(*) as posts_count
      FROM posts
      WHERE user_id = ? 
      AND created_at >= datetime('now', 'start of month')
    `).bind(userId).first();
    
    // Get scheduled posts
    const scheduledResult = await db.prepare(`
      SELECT COUNT(*) as scheduled_count
      FROM posts
      WHERE user_id = ? AND status = 'scheduled'
    `).bind(userId).first();
    
    // Get connected accounts
    const accountsResult = await db.prepare(`
      SELECT COUNT(*) as accounts_count
      FROM social_accounts
      WHERE user_id = ?
    `).bind(userId).first();
    
    // Get user credits
    const userResult = await db.prepare(`
      SELECT credits FROM users WHERE id = ?
    `).bind(userId).first();
    
    return c.json({
      totalFollowers: followersResult?.total_followers || 0,
      postsThisMonth: postsResult?.posts_count || 0,
      scheduledPosts: scheduledResult?.scheduled_count || 0,
      connectedAccounts: accountsResult?.accounts_count || 0,
      credits: userResult?.credits || 0,
    });
  } catch (error) {
    console.error('Stats error:', error);
    return c.json({ error: 'Failed to fetch stats' }, 500);
  }
});

export { userRoutes };

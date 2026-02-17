import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import type { Context, Next } from 'hono';

// Import route handlers
import { authRoutes } from './routes/auth';
import { userRoutes } from './routes/users';
import { subscriptionRoutes } from './routes/subscriptions';
import { socialRoutes } from './routes/social';
import { postRoutes } from './routes/posts';
import { analyticsRoutes } from './routes/analytics';
import { webhookRoutes } from './routes/webhooks';
import { mediaRoutes } from './routes/media';
import { teamRoutes } from './routes/teams';
import { notificationRoutes } from './routes/notifications';

// Types
export type Bindings = {
  DB: D1Database;
  JWT_SECRET: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  STRIPE_PUBLISHABLE_KEY: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  TWITTER_CLIENT_ID: string;
  TWITTER_CLIENT_SECRET: string;
  INSTAGRAM_CLIENT_ID: string;
  INSTAGRAM_CLIENT_SECRET: string;
  LINKEDIN_CLIENT_ID: string;
  LINKEDIN_CLIENT_SECRET: string;
  TIKTOK_CLIENT_KEY: string;
  TIKTOK_CLIENT_SECRET: string;
  RESEND_API_KEY: string;
  R2_BUCKET_NAME: string;
  R2_ACCESS_KEY_ID: string;
  R2_SECRET_ACCESS_KEY: string;
  R2_ENDPOINT: string;
  ENVIRONMENT: string;
};

export type Variables = {
  userId: string;
  user: {
    id: string;
    email: string;
    name: string | null;
  };
};

export type AppContext = Context<{ Bindings: Bindings; Variables: Variables }>;

// Create app
const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Middleware
app.use('*', logger());
app.use('*', prettyJSON());
app.use('*', cors({
  origin: ['http://localhost:3000', 'https://localhost:3000', 'https://socialflow.app'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Health check
app.get('/health', (c) => {
  return c.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// Mount routes
app.route('/auth', authRoutes);
app.route('/users', userRoutes);
app.route('/subscriptions', subscriptionRoutes);
app.route('/social', socialRoutes);
app.route('/posts', postRoutes);
app.route('/analytics', analyticsRoutes);
app.route('/webhooks', webhookRoutes);
app.route('/media', mediaRoutes);
app.route('/teams', teamRoutes);
app.route('/notifications', notificationRoutes);

// Scheduled post publisher cron trigger handler
app.get('/cron/publish-scheduled', async (c) => {
  // This endpoint is meant to be called by a cron trigger
  // In production, configure this in wrangler.toml
  const db = c.env.DB;
  
  try {
    // Get posts that should be published now
    const postsToPublish = await db.prepare(`
      SELECT id, user_id, content, media_urls, platforms
      FROM scheduled_posts
      WHERE status = 'pending'
      AND scheduled_at <= datetime('now')
      ORDER BY scheduled_at ASC
      LIMIT 50
    `).all();
    
    const results: Record<string, any> = {};
    
    for (const post of (postsToPublish.results || [])) {
      const p = post as any;
      
      try {
        // Update status to publishing
        await db.prepare(`
          UPDATE scheduled_posts SET status = 'publishing' WHERE id = ?
        `).bind(p.id).run();
        
        // Get connected accounts for platforms
        const platforms = JSON.parse(p.platforms) as string[];
        const accounts = await db.prepare(`
          SELECT * FROM social_connections 
          WHERE user_id = ? AND platform IN (${platforms.map(() => '?').join(',')})
        `).bind(p.user_id, ...platforms).all();
        
        const platformPostIds: Record<string, string> = {};
        const errors: Record<string, string> = {};
        
        // Publish to each platform
        for (const account of (accounts.results || [])) {
          // In production, call platform-specific API
          platformPostIds[(account as any).platform] = `published_${Date.now()}`;
        }
        
        const success = Object.keys(platformPostIds).length > 0;
        
        await db.prepare(`
          UPDATE scheduled_posts 
          SET status = ?, published_at = ?, platform_post_ids = ?, error_message = ?
          WHERE id = ?
        `).bind(
          success ? 'published' : 'failed',
          new Date().toISOString(),
          JSON.stringify(platformPostIds),
          Object.keys(errors).length > 0 ? JSON.stringify(errors) : null,
          p.id
        ).run();
        
        // Create notification for user
        if (success) {
          await db.prepare(`
            INSERT INTO notifications (id, user_id, type, title, message, data)
            VALUES (?, ?, 'post_published', 'Post Published', ?, ?)
          `).bind(
            crypto.randomUUID(),
            p.user_id,
            `Your scheduled post has been published to ${Object.keys(platformPostIds).join(', ')}`,
            JSON.stringify({ postId: p.id, platforms: Object.keys(platformPostIds) })
          ).run();
        }
        
        results[p.id] = { success, platforms: Object.keys(platformPostIds) };
      } catch (err: any) {
        await db.prepare(`
          UPDATE scheduled_posts SET status = 'failed', error_message = ? WHERE id = ?
        `).bind(err.message, p.id).run();
        
        results[p.id] = { success: false, error: err.message };
      }
    }
    
    return c.json({ 
      processed: (postsToPublish.results || []).length,
      results 
    });
  } catch (error: any) {
    console.error('Cron error:', error);
    return c.json({ error: 'Cron failed' }, 500);
  }
});

// Error handler
app.onError((err, c) => {
  console.error('Error:', err);
  return c.json({ 
    error: 'Internal Server Error',
    message: err.message,
    ...(c.env.ENVIRONMENT === 'development' && { stack: err.stack })
  }, 500);
});

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not Found' }, 404);
});

export default app;

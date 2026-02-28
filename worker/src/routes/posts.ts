import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { verify } from 'hono/jwt';
import type { Bindings, Variables } from '../index';

const postRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

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

postRoutes.use('*', authMiddleware);

// Get all posts with filtering
postRoutes.get('/', async (c) => {
  const userId = c.get('userId');
  const status = c.req.query('status');
  const platform = c.req.query('platform');
  const startDate = c.req.query('startDate');
  const endDate = c.req.query('endDate');
  const limit = parseInt(c.req.query('limit') || '50');
  const offset = parseInt(c.req.query('offset') || '0');
  const db = c.env.DB;
  
  try {
    let whereClause = 'WHERE p.user_id = ?';
    const params: (string | number)[] = [userId];
    
    if (status) {
      whereClause += ' AND p.status = ?';
      params.push(status);
    }
    
    if (platform) {
      whereClause += ' AND json_extract(p.platforms, \'$\') LIKE ?';
      params.push(`%${platform}%`);
    }
    
    if (startDate) {
      whereClause += ' AND p.scheduled_at >= ?';
      params.push(startDate);
    }
    
    if (endDate) {
      whereClause += ' AND p.scheduled_at <= ?';
      params.push(endDate);
    }
    
    const query = `
      SELECT 
        p.*,
        (SELECT COUNT(*) FROM post_comments WHERE post_id = p.id) as comment_count
      FROM scheduled_posts p
      ${whereClause}
      ORDER BY 
        CASE p.status 
          WHEN 'pending' THEN 1 
          WHEN 'draft' THEN 2 
          WHEN 'published' THEN 3 
          ELSE 4 
        END,
        p.scheduled_at DESC
      LIMIT ? OFFSET ?
    `;
    params.push(limit, offset);
    
    const posts = await db.prepare(query).bind(...params).all();
    
    // Parse JSON fields
    const parsedPosts = (posts.results || []).map((post: any) => ({
      ...post,
      media_urls: JSON.parse(post.media_urls || '[]'),
      platforms: JSON.parse(post.platforms),
      platform_post_ids: post.platform_post_ids ? JSON.parse(post.platform_post_ids) : null,
      engagement_data: post.engagement_data ? JSON.parse(post.engagement_data) : null,
    }));
    
    // Get total count
    const countResult = await db.prepare(`
      SELECT COUNT(*) as total FROM scheduled_posts p ${whereClause}
    `).bind(...params.slice(0, -2)).first() as { total: number };
    
    return c.json({ 
      posts: parsedPosts,
      pagination: {
        total: countResult.total,
        limit,
        offset,
        hasMore: offset + limit < countResult.total
      }
    });
  } catch (error) {
    console.error('Fetch posts error:', error);
    return c.json({ error: 'Failed to fetch posts' }, 500);
  }
});

// Get posts for calendar view
postRoutes.get('/calendar', async (c) => {
  const userId = c.get('userId');
  const startDate = c.req.query('start');
  const endDate = c.req.query('end');
  const db = c.env.DB;
  
  if (!startDate || !endDate) {
    return c.json({ error: 'Start and end dates required' }, 400);
  }
  
  try {
    const posts = await db.prepare(`
      SELECT 
        p.id,
        p.content,
        p.media_urls,
        p.platforms,
        p.status,
        p.scheduled_at,
        p.platform_post_ids
      FROM scheduled_posts p
      WHERE p.user_id = ?
      AND (
        (p.scheduled_at >= ? AND p.scheduled_at <= ?)
        OR (p.published_at >= ? AND p.published_at <= ?)
      )
      ORDER BY p.scheduled_at ASC
    `).bind(userId, startDate, endDate, startDate, endDate).all();
    
    const parsedPosts = (posts.results || []).map((post: any) => ({
      ...post,
      media_urls: JSON.parse(post.media_urls || '[]'),
      platforms: JSON.parse(post.platforms),
      platform_post_ids: post.platform_post_ids ? JSON.parse(post.platform_post_ids) : null,
    }));
    
    return c.json({ posts: parsedPosts });
  } catch (error) {
    console.error('Calendar posts error:', error);
    return c.json({ error: 'Failed to fetch calendar posts' }, 500);
  }
});

// Create post
postRoutes.post('/',
  zValidator('json', z.object({
    content: z.string().min(1).max(10000),
    mediaUrls: z.array(z.string().url()).default([]),
    platforms: z.array(z.enum(['twitter', 'instagram', 'linkedin', 'tiktok'])).min(1),
    status: z.enum(['draft', 'scheduled', 'pending']).default('draft'),
    scheduledAt: z.string().datetime().optional().nullable(),
    isThread: z.boolean().default(false),
    threadPosts: z.array(z.object({
      content: z.string().min(1).max(10000),
      mediaUrls: z.array(z.string().url()).default([]),
    })).optional(),
  })),
  async (c) => {
    const userId = c.get('userId');
    const data = c.req.valid('json');
    const db = c.env.DB;
    
    try {
      // Check user's subscription limits
      const usage = await db.prepare(`
        SELECT 
          s.plan,
          s.status,
          COUNT(p.id) as current_month_posts,
          (SELECT COUNT(*) FROM social_connections WHERE user_id = ?) as connected_accounts
        FROM subscriptions s
        LEFT JOIN scheduled_posts p ON p.user_id = s.user_id 
          AND p.created_at >= datetime('now', 'start of month')
          AND p.status != 'draft'
        WHERE s.user_id = ?
        GROUP BY s.user_id
      `).bind(userId, userId).first() as { 
        plan: string; 
        status: string; 
        current_month_posts: number;
        connected_accounts: number;
      } | null;
      
      // Plan limits
      const limits = {
        free: { posts: 10, accounts: 2 },
        starter: { posts: 50, accounts: 3 },
        pro: { posts: -1, accounts: 10 },
        enterprise: { posts: -1, accounts: -1 },
      };
      
      const plan = usage?.plan || 'free';
      const planLimit = limits[plan as keyof typeof limits] || limits.free;
      
      // Check post limit
      if (planLimit.posts !== -1 && data.status !== 'draft') {
        if (usage && usage.current_month_posts >= planLimit.posts) {
          return c.json({ 
            error: `Post limit reached for your ${plan} plan`, 
            upgrade: true 
          }, 403);
        }
      }
      
      // Check account limit for new connections
      if (planLimit.accounts !== -1 && usage && usage.connected_accounts > planLimit.accounts) {
        return c.json({ 
          error: `Account limit reached for your ${plan} plan`,
          upgrade: true 
        }, 403);
      }
      
      const id = crypto.randomUUID();
      const scheduledAt = data.scheduledAt && data.status !== 'draft' 
        ? data.scheduledAt 
        : null;
      
      await db.prepare(`
        INSERT INTO scheduled_posts (id, user_id, content, media_urls, platforms, status, scheduled_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(
        id,
        userId,
        data.content,
        JSON.stringify(data.mediaUrls),
        JSON.stringify(data.platforms),
        scheduledAt ? 'pending' : data.status,
        scheduledAt
      ).run();
      
      // Create thread posts if any
      if (data.isThread && data.threadPosts && data.threadPosts.length > 0) {
        for (let i = 0; i < data.threadPosts.length; i++) {
          const threadPost = data.threadPosts[i];
          await db.prepare(`
            INSERT INTO thread_posts (id, parent_post_id, sequence, content, media_urls, status)
            VALUES (?, ?, ?, ?, ?, ?)
          `).bind(
            crypto.randomUUID(),
            id,
            i + 1,
            threadPost.content,
            JSON.stringify(threadPost.mediaUrls),
            scheduledAt ? 'pending' : data.status
          ).run();
        }
      }
      
      // Log activity
      await db.prepare(`
        INSERT INTO activity_logs (id, user_id, action, entity_type, entity_id, metadata)
        VALUES (?, ?, ?, 'post', ?, ?)
      `).bind(
        crypto.randomUUID(),
        userId,
        data.status === 'draft' ? 'draft_created' : 'post_scheduled',
        id,
        JSON.stringify({ platforms: data.platforms, scheduled: !!scheduledAt })
      ).run();
      
      // Update usage tracking
      const currentMonth = new Date().toISOString().slice(0, 7);
      await db.prepare(`
        INSERT INTO usage_tracking (id, user_id, month, posts_count)
        VALUES (?, ?, ?, 1)
        ON CONFLICT(user_id, month) DO UPDATE SET
        posts_count = posts_count + 1,
        updated_at = CURRENT_TIMESTAMP
      `).bind(crypto.randomUUID(), userId, currentMonth).run();
      
      return c.json({ 
        id, 
        message: scheduledAt ? 'Post scheduled' : 'Draft saved',
        post: { 
          id, 
          content: data.content,
          mediaUrls: data.mediaUrls,
          platforms: data.platforms,
          status: scheduledAt ? 'pending' : data.status,
          scheduledAt 
        }
      }, 201);
    } catch (error) {
      console.error('Create post error:', error);
      return c.json({ error: 'Failed to create post' }, 500);
    }
  }
);

// Get single post with thread posts
postRoutes.get('/:id', async (c) => {
  const userId = c.get('userId');
  const postId = c.req.param('id');
  const db = c.env.DB;
  
  try {
    const post = await db.prepare(`
      SELECT * FROM scheduled_posts WHERE id = ? AND user_id = ?
    `).bind(postId, userId).first();
    
    if (!post) {
      return c.json({ error: 'Post not found' }, 404);
    }
    
    // Get thread posts
    const threadPosts = await db.prepare(`
      SELECT * FROM thread_posts 
      WHERE parent_post_id = ? 
      ORDER BY sequence ASC
    `).bind(postId).all();
    
    // Get comments
    const comments = await db.prepare(`
      SELECT 
        c.*,
        u.name as user_name,
        u.image as user_image
      FROM post_comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.post_id = ?
      ORDER BY c.created_at ASC
    `).bind(postId).all();
    
    return c.json({ 
      post: {
        ...post,
        media_urls: JSON.parse((post as any).media_urls || '[]'),
        platforms: JSON.parse((post as any).platforms),
        platform_post_ids: (post as any).platform_post_ids ? JSON.parse((post as any).platform_post_ids) : null,
        engagement_data: (post as any).engagement_data ? JSON.parse((post as any).engagement_data) : null,
      },
      threadPosts: (threadPosts.results || []).map((tp: any) => ({
        ...tp,
        media_urls: JSON.parse(tp.media_urls || '[]'),
      })),
      comments: comments.results || [],
    });
  } catch (error) {
    console.error('Fetch post error:', error);
    return c.json({ error: 'Failed to fetch post' }, 500);
  }
});

// Update post
postRoutes.put('/:id',
  zValidator('json', z.object({
    content: z.string().min(1).max(10000).optional(),
    mediaUrls: z.array(z.string().url()).optional(),
    platforms: z.array(z.enum(['twitter', 'instagram', 'linkedin', 'tiktok'])).optional(),
    status: z.enum(['draft', 'scheduled', 'pending']).optional(),
    scheduledAt: z.string().datetime().optional().nullable(),
  })),
  async (c) => {
    const userId = c.get('userId');
    const postId = c.req.param('id');
    const data = c.req.valid('json');
    const db = c.env.DB;
    
    try {
      // Check if post exists and belongs to user
      const existing = await db.prepare(`
        SELECT status, scheduled_at FROM scheduled_posts WHERE id = ? AND user_id = ?
      `).bind(postId, userId).first() as { status: string; scheduled_at: string } | null;
      
      if (!existing) {
        return c.json({ error: 'Post not found' }, 404);
      }
      
      if (existing.status === 'published') {
        return c.json({ error: 'Cannot edit published posts' }, 400);
      }
      
      // Build update query
      const updates: string[] = [];
      const params: (string | number | null)[] = [];
      
      if (data.content !== undefined) {
        updates.push('content = ?');
        params.push(data.content);
      }
      if (data.mediaUrls !== undefined) {
        updates.push('media_urls = ?');
        params.push(JSON.stringify(data.mediaUrls));
      }
      if (data.platforms !== undefined) {
        updates.push('platforms = ?');
        params.push(JSON.stringify(data.platforms));
      }
      if (data.status !== undefined) {
        updates.push('status = ?');
        params.push(data.scheduledAt && data.status !== 'draft' ? 'pending' : data.status);
      }
      if (data.scheduledAt !== undefined) {
        updates.push('scheduled_at = ?');
        params.push(data.scheduledAt);
      }
      
      updates.push('updated_at = CURRENT_TIMESTAMP');
      
      if (updates.length === 0) {
        return c.json({ error: 'No fields to update' }, 400);
      }
      
      params.push(postId, userId);
      
      await db.prepare(`
        UPDATE scheduled_posts SET ${updates.join(', ')} WHERE id = ? AND user_id = ?
      `).bind(...params).run();
      
      // Log activity
      await db.prepare(`
        INSERT INTO activity_logs (id, user_id, action, entity_type, entity_id)
        VALUES (?, ?, 'post_updated', 'post', ?)
      `).bind(crypto.randomUUID(), userId, postId).run();
      
      return c.json({ message: 'Post updated' });
    } catch (error) {
      console.error('Update post error:', error);
      return c.json({ error: 'Failed to update post' }, 500);
    }
  }
);

// Delete post
postRoutes.delete('/:id', async (c) => {
  const userId = c.get('userId');
  const postId = c.req.param('id');
  const db = c.env.DB;
  
  try {
    const existing = await db.prepare(`
      SELECT status FROM scheduled_posts WHERE id = ? AND user_id = ?
    `).bind(postId, userId).first() as { status: string } | null;
    
    if (!existing) {
      return c.json({ error: 'Post not found' }, 404);
    }
    
    await db.prepare(`
      DELETE FROM scheduled_posts WHERE id = ? AND user_id = ?
    `).bind(postId, userId).run();
    
    // Log activity
    await db.prepare(`
      INSERT INTO activity_logs (id, user_id, action, entity_type, entity_id)
      VALUES (?, ?, 'post_deleted', 'post', ?)
    `).bind(crypto.randomUUID(), userId, postId).run();
    
    return c.json({ message: 'Post deleted' });
  } catch (error) {
    console.error('Delete post error:', error);
    return c.json({ error: 'Failed to delete post' }, 500);
  }
});

// Bulk delete posts
postRoutes.post('/bulk-delete',
  zValidator('json', z.object({
    ids: z.array(z.string()).min(1),
  })),
  async (c) => {
    const userId = c.get('userId');
    const { ids } = c.req.valid('json');
    const db = c.env.DB;
    
    try {
      const placeholders = ids.map(() => '?').join(',');
      const result = await db.prepare(`
        DELETE FROM scheduled_posts 
        WHERE id IN (${placeholders}) AND user_id = ? AND status != 'published'
      `).bind(...ids, userId).run();
      
      return c.json({ 
        message: 'Posts deleted',
        deleted: (result.meta as any)?.changes || 0
      });
    } catch (error) {
      console.error('Bulk delete error:', error);
      return c.json({ error: 'Failed to delete posts' }, 500);
    }
  }
);

// Bulk reschedule posts
postRoutes.post('/bulk-reschedule',
  zValidator('json', z.object({
    ids: z.array(z.string()).min(1),
    scheduledAt: z.string().datetime(),
  })),
  async (c) => {
    const userId = c.get('userId');
    const { ids, scheduledAt } = c.req.valid('json');
    const db = c.env.DB;
    
    try {
      const placeholders = ids.map(() => '?').join(',');
      await db.prepare(`
        UPDATE scheduled_posts 
        SET scheduled_at = ?, status = 'pending', updated_at = CURRENT_TIMESTAMP
        WHERE id IN (${placeholders}) AND user_id = ? AND status != 'published'
      `).bind(scheduledAt, ...ids, userId).run();
      
      return c.json({ message: 'Posts rescheduled' });
    } catch (error) {
      console.error('Bulk reschedule error:', error);
      return c.json({ error: 'Failed to reschedule posts' }, 500);
    }
  }
);

// Add comment to post
postRoutes.post('/:id/comments',
  zValidator('json', z.object({
    content: z.string().min(1).max(2000),
    parentCommentId: z.string().optional(),
  })),
  async (c) => {
    const userId = c.get('userId');
    const postId = c.req.param('id');
    const data = c.req.valid('json');
    const db = c.env.DB;
    
    try {
      // Verify post exists
      const post = await db.prepare(`
        SELECT id FROM scheduled_posts WHERE id = ?
      `).bind(postId).first();
      
      if (!post) {
        return c.json({ error: 'Post not found' }, 404);
      }
      
      const commentId = crypto.randomUUID();
      await db.prepare(`
        INSERT INTO post_comments (id, post_id, user_id, content, parent_comment_id)
        VALUES (?, ?, ?, ?, ?)
      `).bind(commentId, postId, userId, data.content, data.parentCommentId || null).run();
      
      // Get created comment with user info
      const comment = await db.prepare(`
        SELECT 
          c.*,
          u.name as user_name,
          u.image as user_image
        FROM post_comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.id = ?
      `).bind(commentId).first();
      
      return c.json({ comment }, 201);
    } catch (error) {
      console.error('Add comment error:', error);
      return c.json({ error: 'Failed to add comment' }, 500);
    }
  }
);

// Delete comment
postRoutes.delete('/:postId/comments/:commentId', async (c) => {
  const userId = c.get('userId');
  const commentId = c.req.param('commentId');
  const db = c.env.DB;
  
  try {
    await db.prepare(`
      DELETE FROM post_comments WHERE id = ? AND user_id = ?
    `).bind(commentId, userId).run();
    
    return c.json({ message: 'Comment deleted' });
  } catch (error) {
    console.error('Delete comment error:', error);
    return c.json({ error: 'Failed to delete comment' }, 500);
  }
});

// Publish post immediately
postRoutes.post('/:id/publish', async (c) => {
  const userId = c.get('userId');
  const postId = c.req.param('id');
  const db = c.env.DB;
  
  try {
    const post = await db.prepare(`
      SELECT * FROM scheduled_posts WHERE id = ? AND user_id = ?
    `).bind(postId, userId).first() as { 
      status: string; 
      platforms: string; 
      content: string;
      media_urls: string;
    } | null;
    
    if (!post) {
      return c.json({ error: 'Post not found' }, 404);
    }
    
    if (post.status === 'published') {
      return c.json({ error: 'Post already published' }, 400);
    }
    
    // Get connected accounts for the platforms
    const platforms = JSON.parse(post.platforms) as string[];
    const mediaUrls = JSON.parse(post.media_urls || '[]') as string[];
    
    const accounts = await db.prepare(`
      SELECT * FROM social_accounts 
      WHERE user_id = ? AND platform IN (${platforms.map(() => '?').join(',')})
    `).bind(userId, ...platforms).all();
    
    if (!accounts.results || accounts.results.length === 0) {
      return c.json({ error: 'No connected accounts found for selected platforms' }, 400);
    }
    
    // Update status to publishing
    await db.prepare(`
      UPDATE scheduled_posts SET status = 'publishing', updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).bind(postId).run();
    
    // Publish to each platform (this would call platform APIs in production)
    const platformPostIds: Record<string, string> = {};
    const errors: Record<string, string> = {};
    
    // Simulate publishing
    for (const platform of platforms) {
      const account = (accounts.results || []).find((a: any) => a.platform === platform);
      if (!account) {
        errors[platform] = 'Account not connected';
        continue;
      }
      
      try {
        // In production, this would call the actual platform API
        platformPostIds[platform] = `mock_${platform}_${Date.now()}`;
      } catch (err: any) {
        errors[platform] = err.message;
      }
    }
    
    const success = Object.keys(platformPostIds).length > 0;
    
    // Update post as published
    await db.prepare(`
      UPDATE posts 
      SET status = ?, 
          published_at = CURRENT_TIMESTAMP,
          platform_post_ids = ?,
          error_message = ?
      WHERE id = ?
    `).bind(
      success ? 'published' : 'failed',
      JSON.stringify(platformPostIds),
      Object.keys(errors).length > 0 ? JSON.stringify(errors) : null,
      postId
    ).run();
    
    // Log activity
    await db.prepare(`
      INSERT INTO activity_logs (id, user_id, action, entity_type, entity_id, metadata)
      VALUES (?, ?, 'post_published', 'post', ?, ?)
    `).bind(
      crypto.randomUUID(),
      userId,
      postId,
      JSON.stringify({ platforms: Object.keys(platformPostIds) })
    ).run();
    
    return c.json({ 
      success,
      platformPostIds,
      errors: Object.keys(errors).length > 0 ? errors : undefined
    });
  } catch (error: any) {
    // Update status to failed
    await db.prepare(`
      UPDATE scheduled_posts SET status = 'failed', error_message = ? WHERE id = ?
    `).bind(error.message, postId).run();
    
    console.error('Publish error:', error);
    return c.json({ error: 'Failed to publish post' }, 500);
  }
});

export { postRoutes };

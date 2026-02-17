import { Hono } from 'hono';
import { verify } from 'hono/jwt';
import type { Bindings, Variables } from '../index';

const analyticsRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

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

analyticsRoutes.use('*', authMiddleware);

// Get dashboard analytics summary
analyticsRoutes.get('/dashboard', async (c) => {
  const userId = c.get('userId');
  const days = parseInt(c.req.query('days') || '30');
  const db = c.env.DB;
  
  try {
    // Get all connected accounts
    const accounts = await db.prepare(`
      SELECT id, platform, account_name, followers_count, account_image
      FROM social_connections
      WHERE user_id = ? AND is_active = 1
    `).bind(userId).all();
    
    // Get total followers count
    const followersResult = await db.prepare(`
      SELECT SUM(followers_count) as total_followers
      FROM social_connections
      WHERE user_id = ? AND is_active = 1
    `).bind(userId).first() as { total_followers: number };
    
    // Get posts published in period
    const postsResult = await db.prepare(`
      SELECT COUNT(*) as total_posts, platform, SUM(engagement_data) as engagement
      FROM scheduled_posts
      WHERE user_id = ? 
      AND status = 'published'
      AND published_at >= date('now', '-${days} days')
      GROUP BY platforms
    `).bind(userId).all();
    
    // Get follower growth over time
    const growthData = await db.prepare(`
      SELECT 
        ad.date,
        SUM(ad.followers) as total_followers,
        GROUP_CONCAT(DISTINCT ad.platform) as platforms
      FROM analytics_daily ad
      JOIN social_connections sc ON ad.connection_id = sc.id
      WHERE sc.user_id = ?
      AND ad.date >= date('now', '-${days} days')
      GROUP BY ad.date
      ORDER BY ad.date ASC
    `).bind(userId).all();
    
    // Get platform breakdown
    const platformBreakdown = await db.prepare(`
      SELECT 
        sc.platform,
        SUM(ad.followers) as followers,
        SUM(ad.likes) as likes,
        SUM(ad.comments) as comments,
        SUM(ad.shares) as shares,
        SUM(ad.impressions) as impressions,
        AVG(ad.engagement_rate) as avg_engagement_rate
      FROM analytics_daily ad
      JOIN social_connections sc ON ad.connection_id = sc.id
      WHERE sc.user_id = ?
      AND ad.date >= date('now', '-${days} days')
      GROUP BY sc.platform
    `).bind(userId).all();
    
    // Get engagement trends
    const engagementTrends = await db.prepare(`
      SELECT 
        strftime('%Y-%m-%d', sp.published_at) as date,
        sp.platforms,
        COUNT(*) as posts,
        SUM(CASE WHEN sp.engagement_data IS NOT NULL THEN 1 ELSE 0 END) as posts_with_engagement
      FROM scheduled_posts sp
      WHERE sp.user_id = ?
      AND sp.status = 'published'
      AND sp.published_at >= date('now', '-${days} days')
      GROUP BY date
      ORDER BY date ASC
    `).bind(userId).all();
    
    return c.json({
      summary: {
        totalFollowers: followersResult?.total_followers || 0,
        totalPosts: (postsResult.results || []).reduce((sum: number, p: any) => sum + p.total_posts, 0),
        connectedAccounts: (accounts.results || []).length,
        period: days,
      },
      accounts: accounts.results || [],
      followerGrowth: growthData.results || [],
      platformBreakdown: platformBreakdown.results || [],
      engagementTrends: engagementTrends.results || [],
      postsByPlatform: postsResult.results || [],
    });
  } catch (error) {
    console.error('Dashboard analytics error:', error);
    return c.json({ error: 'Failed to fetch analytics' }, 500);
  }
});

// Get account-specific analytics
analyticsRoutes.get('/account/:id', async (c) => {
  const userId = c.get('userId');
  const accountId = c.req.param('id');
  const days = parseInt(c.req.query('days') || '30');
  const db = c.env.DB;
  
  try {
    // Verify account belongs to user
    const account = await db.prepare(`
      SELECT * FROM social_connections WHERE id = ? AND user_id = ?
    `).bind(accountId, userId).first();
    
    if (!account) {
      return c.json({ error: 'Account not found' }, 404);
    }
    
    // Get daily metrics
    const dailyMetrics = await db.prepare(`
      SELECT 
        date,
        followers,
        following,
        posts,
        likes,
        comments,
        shares,
        impressions,
        reach,
        engagement_rate
      FROM analytics_daily
      WHERE connection_id = ?
      AND date >= date('now', '-${days} days')
      ORDER BY date ASC
    `).bind(accountId).all();
    
    // Get best performing posts for this platform
    const bestPosts = await db.prepare(`
      SELECT 
        sp.id,
        sp.content,
        sp.published_at,
        sp.platform_post_ids,
        sp.engagement_data
      FROM scheduled_posts sp
      WHERE sp.user_id = ?
      AND sp.status = 'published'
      AND sp.platforms LIKE ?
      AND sp.published_at >= date('now', '-${days} days')
      ORDER BY sp.published_at DESC
      LIMIT 10
    `).bind(userId, `%${(account as any).platform}%`).all();
    
    // Calculate growth rates
    const current = (dailyMetrics.results || []).slice(-1)[0] as any;
    const previous = (dailyMetrics.results || [])[0] as any;
    
    const growthRates = {
      followers: previous && current 
        ? ((current.followers - previous.followers) / (previous.followers || 1)) * 100 
        : 0,
      engagement: previous && current
        ? ((current.engagement_rate - previous.engagement_rate) / (previous.engagement_rate || 1)) * 100
        : 0,
    };
    
    return c.json({
      account,
      dailyMetrics: dailyMetrics.results || [],
      bestPosts: (bestPosts.results || []).map((p: any) => ({
        ...p,
        platform_post_ids: p.platform_post_ids ? JSON.parse(p.platform_post_ids) : null,
        engagement_data: p.engagement_data ? JSON.parse(p.engagement_data) : null,
      })),
      growthRates,
      summary: current ? {
        followers: current.followers,
        following: current.following,
        posts: current.posts,
        engagementRate: current.engagement_rate,
      } : null,
    });
  } catch (error) {
    console.error('Account analytics error:', error);
    return c.json({ error: 'Failed to fetch account analytics' }, 500);
  }
});

// Get post performance analytics
analyticsRoutes.get('/posts', async (c) => {
  const userId = c.get('userId');
  const days = parseInt(c.req.query('days') || '30');
  const platform = c.req.query('platform');
  const sortBy = c.req.query('sortBy') || 'engagement';
  const db = c.env.DB;
  
  try {
    let whereClause = 'WHERE sp.user_id = ? AND sp.status = \'published\'';
    const params: (string | number)[] = [userId];
    
    if (platform) {
      whereClause += ' AND sp.platforms LIKE ?';
      params.push(`%${platform}%`);
    }
    
    if (days) {
      whereClause += ` AND sp.published_at >= date('now', '-${days} days')`;
    }
    
    const orderBy = {
      engagement: 'COALESCE((SELECT SUM(likes + comments + shares) FROM json_each(sp.engagement_data)), 0) DESC',
      date: 'sp.published_at DESC',
      reach: 'COALESCE((SELECT reach FROM json_each(sp.engagement_data)), 0) DESC',
    }[sortBy] || 'sp.published_at DESC';
    
    const posts = await db.prepare(`
      SELECT 
        sp.id,
        sp.content,
        sp.media_urls,
        sp.platforms,
        sp.published_at,
        sp.platform_post_ids,
        sp.engagement_data,
        (SELECT COUNT(*) FROM post_comments WHERE post_id = sp.id) as comment_count
      FROM scheduled_posts sp
      ${whereClause}
      ORDER BY ${orderBy}
      LIMIT 50
    `).bind(...params).all();
    
    // Parse JSON fields
    const parsedPosts = (posts.results || []).map((p: any) => {
      const engagement = p.engagement_data ? JSON.parse(p.engagement_data) : {};
      return {
        ...p,
        media_urls: JSON.parse(p.media_urls || '[]'),
        platforms: JSON.parse(p.platforms),
        platform_post_ids: p.platform_post_ids ? JSON.parse(p.platform_post_ids) : null,
        engagement: {
          likes: engagement.likes || 0,
          comments: engagement.comments || 0,
          shares: engagement.shares || 0,
          impressions: engagement.impressions || 0,
          reach: engagement.reach || 0,
          total: (engagement.likes || 0) + (engagement.comments || 0) + (engagement.shares || 0),
        },
      };
    });
    
    // Calculate averages
    const avgEngagement = parsedPosts.length > 0
      ? parsedPosts.reduce((sum: number, p: any) => sum + p.engagement.total, 0) / parsedPosts.length
      : 0;
    
    const bestPost = parsedPosts.length > 0
      ? parsedPosts.reduce((best: any, p: any) => p.engagement.total > best.engagement.total ? p : best, parsedPosts[0])
      : null;
    
    return c.json({
      posts: parsedPosts,
      summary: {
        totalPosts: parsedPosts.length,
        avgEngagement: Math.round(avgEngagement),
        bestPost: bestPost ? {
          id: bestPost.id,
          content: bestPost.content.slice(0, 100) + (bestPost.content.length > 100 ? '...' : ''),
          engagement: bestPost.engagement,
        } : null,
      },
    });
  } catch (error) {
    console.error('Posts analytics error:', error);
    return c.json({ error: 'Failed to fetch posts analytics' }, 500);
  }
});

// Export analytics data
analyticsRoutes.get('/export', async (c) => {
  const userId = c.get('userId');
  const format = c.req.query('format') || 'csv';
  const days = parseInt(c.req.query('days') || '30');
  const db = c.env.DB;
  
  try {
    // Get all analytics data
    const data = await db.prepare(`
      SELECT 
        ad.date,
        sc.platform,
        sc.account_name,
        ad.followers,
        ad.following,
        ad.posts,
        ad.likes,
        ad.comments,
        ad.shares,
        ad.impressions,
        ad.reach,
        ad.engagement_rate
      FROM analytics_daily ad
      JOIN social_connections sc ON ad.connection_id = sc.id
      WHERE sc.user_id = ?
      AND ad.date >= date('now', '-${days} days')
      ORDER BY ad.date DESC, sc.platform ASC
    `).bind(userId).all();
    
    if (format === 'csv') {
      const headers = ['Date', 'Platform', 'Account', 'Followers', 'Following', 'Posts', 'Likes', 'Comments', 'Shares', 'Impressions', 'Reach', 'Engagement Rate'];
      const rows = (data.results || []).map((row: any) => [
        row.date,
        row.platform,
        row.account_name,
        row.followers,
        row.following,
        row.posts,
        row.likes,
        row.comments,
        row.shares,
        row.impressions,
        row.reach,
        row.engagement_rate,
      ]);
      
      const csv = [headers.join(','), ...rows.map((r: any[]) => r.join(','))].join('\n');
      
      return c.text(csv, 200, {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="analytics-${new Date().toISOString().split('T')[0]}.csv"`,
      });
    }
    
    return c.json({ data: data.results });
  } catch (error) {
    console.error('Export error:', error);
    return c.json({ error: 'Failed to export analytics' }, 500);
  }
});

// Get real-time metrics (fetch from APIs)
analyticsRoutes.post('/refresh', async (c) => {
  const userId = c.get('userId');
  const db = c.env.DB;
  
  try {
    // Get all active connections
    const connections = await db.prepare(`
      SELECT * FROM social_connections 
      WHERE user_id = ? AND is_active = 1
    `).bind(userId).all();
    
    const results: Record<string, any> = {};
    
    // Refresh metrics for each connection
    for (const conn of (connections.results || [])) {
      const connection = conn as any;
      
      try {
        // Call platform-specific API to get latest metrics
        // This is a placeholder - real implementation would call actual APIs
        
        const today = new Date().toISOString().split('T')[0];
        
        // Check if today's entry exists
        const existing = await db.prepare(`
          SELECT id FROM analytics_daily 
          WHERE connection_id = ? AND date = ?
        `).bind(connection.id, today).first();
        
        if (existing) {
          // Update existing
          await db.prepare(`
            UPDATE analytics_daily 
            SET followers = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `).bind(connection.followers_count, (existing as any).id).run();
        } else {
          // Create new entry
          await db.prepare(`
            INSERT INTO analytics_daily (id, connection_id, platform, date, followers)
            VALUES (?, ?, ?, ?, ?)
          `).bind(crypto.randomUUID(), connection.id, connection.platform, today, connection.followers_count).run();
        }
        
        results[connection.platform] = { success: true };
      } catch (err: any) {
        results[connection.platform] = { success: false, error: err.message };
      }
    }
    
    return c.json({ refreshed: Object.keys(results).length, results });
  } catch (error) {
    console.error('Refresh analytics error:', error);
    return c.json({ error: 'Failed to refresh analytics' }, 500);
  }
});

export { analyticsRoutes };

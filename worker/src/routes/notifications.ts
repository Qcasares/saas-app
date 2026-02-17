import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { verify } from 'hono/jwt';
import type { Bindings, Variables } from '../index';

const notificationRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

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

notificationRoutes.use('*', authMiddleware);

// Get notifications
notificationRoutes.get('/', async (c) => {
  const userId = c.get('userId');
  const unreadOnly = c.req.query('unread') === 'true';
  const limit = parseInt(c.req.query('limit') || '50');
  const offset = parseInt(c.req.query('offset') || '0');
  const db = c.env.DB;
  
  try {
    let whereClause = 'WHERE user_id = ?';
    const params: (string | number)[] = [userId];
    
    if (unreadOnly) {
      whereClause += ' AND is_read = 0';
    }
    
    const notifications = await db.prepare(`
      SELECT * FROM notifications
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).bind(...params, limit, offset).all();
    
    // Parse JSON data
    const parsedNotifications = (notifications.results || []).map((n: any) => ({
      ...n,
      data: n.data ? JSON.parse(n.data) : null,
    }));
    
    // Get unread count
    const unreadCount = await db.prepare(`
      SELECT COUNT(*) as count FROM notifications 
      WHERE user_id = ? AND is_read = 0
    `).bind(userId).first() as { count: number };
    
    return c.json({
      notifications: parsedNotifications,
      unreadCount: unreadCount.count,
      pagination: {
        limit,
        offset,
        hasMore: parsedNotifications.length === limit,
      },
    });
  } catch (error) {
    console.error('Fetch notifications error:', error);
    return c.json({ error: 'Failed to fetch notifications' }, 500);
  }
});

// Get unread count only
notificationRoutes.get('/count', async (c) => {
  const userId = c.get('userId');
  const db = c.env.DB;
  
  try {
    const result = await db.prepare(`
      SELECT COUNT(*) as count FROM notifications 
      WHERE user_id = ? AND is_read = 0
    `).bind(userId).first() as { count: number };
    
    return c.json({ count: result.count });
  } catch (error) {
    console.error('Count error:', error);
    return c.json({ error: 'Failed to get count' }, 500);
  }
});

// Mark notification as read
notificationRoutes.post('/:id/read', async (c) => {
  const userId = c.get('userId');
  const notificationId = c.req.param('id');
  const db = c.env.DB;
  
  try {
    await db.prepare(`
      UPDATE notifications 
      SET is_read = 1, read_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `).bind(notificationId, userId).run();
    
    return c.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark read error:', error);
    return c.json({ error: 'Failed to mark as read' }, 500);
  }
});

// Mark all as read
notificationRoutes.post('/mark-all-read', async (c) => {
  const userId = c.get('userId');
  const db = c.env.DB;
  
  try {
    await db.prepare(`
      UPDATE notifications 
      SET is_read = 1, read_at = CURRENT_TIMESTAMP
      WHERE user_id = ? AND is_read = 0
    `).bind(userId).run();
    
    return c.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all read error:', error);
    return c.json({ error: 'Failed to mark all as read' }, 500);
  }
});

// Delete notification
notificationRoutes.delete('/:id', async (c) => {
  const userId = c.get('userId');
  const notificationId = c.req.param('id');
  const db = c.env.DB;
  
  try {
    await db.prepare(`
      DELETE FROM notifications WHERE id = ? AND user_id = ?
    `).bind(notificationId, userId).run();
    
    return c.json({ message: 'Notification deleted' });
  } catch (error) {
    console.error('Delete notification error:', error);
    return c.json({ error: 'Failed to delete notification' }, 500);
  }
});

// Create notification (internal use)
notificationRoutes.post('/',
  zValidator('json', z.object({
    userId: z.string(),
    type: z.string(),
    title: z.string(),
    message: z.string(),
    data: z.record(z.any()).optional(),
  })),
  async (c) => {
    const currentUserId = c.get('userId');
    const { userId, type, title, message, data } = c.req.valid('json');
    const db = c.env.DB;
    
    try {
      const id = crypto.randomUUID();
      
      await db.prepare(`
        INSERT INTO notifications (id, user_id, type, title, message, data)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        id,
        userId,
        type,
        title,
        message,
        data ? JSON.stringify(data) : null
      ).run();
      
      return c.json({ id, message: 'Notification created' }, 201);
    } catch (error) {
      console.error('Create notification error:', error);
      return c.json({ error: 'Failed to create notification' }, 500);
    }
  }
);

export { notificationRoutes };

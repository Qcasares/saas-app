import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { verify } from 'hono/jwt';
import type { Bindings, Variables } from '../index';

const mediaRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

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

mediaRoutes.use('*', authMiddleware);

// Get presigned URL for upload (R2)
mediaRoutes.post('/upload-url',
  zValidator('json', z.object({
    filename: z.string().min(1),
    contentType: z.string().min(1),
    folder: z.string().default('/'),
  })),
  async (c) => {
    const userId = c.get('userId');
    const { filename, contentType, folder } = c.req.valid('json');
    
    // In production, this would generate a presigned URL for R2
    // For now, return a mock URL
    const fileId = crypto.randomUUID();
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const key = `${userId}/${folder.replace(/^\//, '')}/${fileId}-${sanitizedFilename}`;
    
    return c.json({
      uploadUrl: `https://r2.socialflow.app/${key}`,
      publicUrl: `https://cdn.socialflow.app/${key}`,
      key,
      fields: {
        'Content-Type': contentType,
      },
    });
  }
);

// Confirm upload and save to database
mediaRoutes.post('/confirm',
  zValidator('json', z.object({
    key: z.string(),
    filename: z.string(),
    originalName: z.string(),
    mimeType: z.string(),
    size: z.number(),
    url: z.string().url(),
    thumbnailUrl: z.string().url().optional(),
    folder: z.string().default('/'),
    metadata: z.object({
      width: z.number().optional(),
      height: z.number().optional(),
      duration: z.number().optional(),
    }).optional(),
    tags: z.array(z.string()).default([]),
  })),
  async (c) => {
    const userId = c.get('userId');
    const data = c.req.valid('json');
    const db = c.env.DB;
    
    try {
      const id = crypto.randomUUID();
      
      await db.prepare(`
        INSERT INTO media_files (id, user_id, filename, original_name, mime_type, size_bytes, url, thumbnail_url, folder_path, metadata, tags)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        id,
        userId,
        data.filename,
        data.originalName,
        data.mimeType,
        data.size,
        data.url,
        data.thumbnailUrl || null,
        data.folder,
        data.metadata ? JSON.stringify(data.metadata) : null,
        JSON.stringify(data.tags)
      ).run();
      
      // Log activity
      await db.prepare(`
        INSERT INTO activity_logs (id, user_id, action, entity_type, entity_id, metadata)
        VALUES (?, ?, 'media_uploaded', 'media', ?, ?)
      `).bind(
        crypto.randomUUID(),
        userId,
        id,
        JSON.stringify({ filename: data.originalName, size: data.size })
      ).run();
      
      return c.json({ 
        id,
        message: 'Media uploaded successfully',
        media: {
          id,
          url: data.url,
          thumbnailUrl: data.thumbnailUrl,
          filename: data.filename,
          originalName: data.originalName,
          mimeType: data.mimeType,
          size: data.size,
          metadata: data.metadata,
          tags: data.tags,
        }
      }, 201);
    } catch (error) {
      console.error('Media confirm error:', error);
      return c.json({ error: 'Failed to save media' }, 500);
    }
  }
);

// List media files
mediaRoutes.get('/', async (c) => {
  const userId = c.get('userId');
  const folder = c.req.query('folder') || '/';
  const search = c.req.query('search');
  const type = c.req.query('type'); // image, video, all
  const limit = parseInt(c.req.query('limit') || '50');
  const offset = parseInt(c.req.query('offset') || '0');
  const db = c.env.DB;
  
  try {
    let whereClause = 'WHERE user_id = ?';
    const params: (string | number)[] = [userId];
    
    if (folder) {
      whereClause += ' AND folder_path = ?';
      params.push(folder);
    }
    
    if (search) {
      whereClause += ' AND (filename LIKE ? OR original_name LIKE ? OR tags LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    if (type === 'image') {
      whereClause += " AND mime_type LIKE 'image/%'";
    } else if (type === 'video') {
      whereClause += " AND mime_type LIKE 'video/%'";
    }
    
    const media = await db.prepare(`
      SELECT 
        id,
        filename,
        original_name,
        mime_type,
        size_bytes,
        url,
        thumbnail_url,
        folder_path,
        metadata,
        tags,
        usage_count,
        created_at
      FROM media_files
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).bind(...params, limit, offset).all();
    
    // Parse JSON fields
    const parsedMedia = (media.results || []).map((m: any) => ({
      ...m,
      metadata: m.metadata ? JSON.parse(m.metadata) : null,
      tags: m.tags ? JSON.parse(m.tags) : [],
    }));
    
    // Get folders
    const folders = await db.prepare(`
      SELECT DISTINCT folder_path
      FROM media_files
      WHERE user_id = ?
      ORDER BY folder_path ASC
    `).bind(userId).all();
    
    // Get total count
    const countResult = await db.prepare(`
      SELECT COUNT(*) as total FROM media_files ${whereClause}
    `).bind(...params).first() as { total: number };
    
    return c.json({
      media: parsedMedia,
      folders: (folders.results || []).map((f: any) => f.folder_path),
      pagination: {
        total: countResult.total,
        limit,
        offset,
        hasMore: offset + limit < countResult.total,
      },
    });
  } catch (error) {
    console.error('List media error:', error);
    return c.json({ error: 'Failed to list media' }, 500);
  }
});

// Get single media file
mediaRoutes.get('/:id', async (c) => {
  const userId = c.get('userId');
  const mediaId = c.req.param('id');
  const db = c.env.DB;
  
  try {
    const media = await db.prepare(`
      SELECT * FROM media_files WHERE id = ? AND user_id = ?
    `).bind(mediaId, userId).first();
    
    if (!media) {
      return c.json({ error: 'Media not found' }, 404);
    }
    
    return c.json({
      media: {
        ...(media as any),
        metadata: (media as any).metadata ? JSON.parse((media as any).metadata) : null,
        tags: (media as any).tags ? JSON.parse((media as any).tags) : [],
      },
    });
  } catch (error) {
    console.error('Get media error:', error);
    return c.json({ error: 'Failed to get media' }, 500);
  }
});

// Update media metadata
mediaRoutes.put('/:id',
  zValidator('json', z.object({
    tags: z.array(z.string()).optional(),
    folder: z.string().optional(),
  })),
  async (c) => {
    const userId = c.get('userId');
    const mediaId = c.req.param('id');
    const data = c.req.valid('json');
    const db = c.env.DB;
    
    try {
      const updates: string[] = [];
      const params: (string | null)[] = [];
      
      if (data.tags !== undefined) {
        updates.push('tags = ?');
        params.push(JSON.stringify(data.tags));
      }
      
      if (data.folder !== undefined) {
        updates.push('folder_path = ?');
        params.push(data.folder);
      }
      
      if (updates.length === 0) {
        return c.json({ error: 'No fields to update' }, 400);
      }
      
      params.push(mediaId, userId);
      
      await db.prepare(`
        UPDATE media_files SET ${updates.join(', ')} WHERE id = ? AND user_id = ?
      `).bind(...params).run();
      
      return c.json({ message: 'Media updated' });
    } catch (error) {
      console.error('Update media error:', error);
      return c.json({ error: 'Failed to update media' }, 500);
    }
  }
);

// Delete media
mediaRoutes.delete('/:id', async (c) => {
  const userId = c.get('userId');
  const mediaId = c.req.param('id');
  const db = c.env.DB;
  
  try {
    // Check if media is used in any posts
    const usage = await db.prepare(`
      SELECT COUNT(*) as count FROM scheduled_posts 
      WHERE media_urls LIKE ?
    `).bind(`%${mediaId}%`).first() as { count: number };
    
    if (usage.count > 0) {
      return c.json({ 
        error: 'Media is used in scheduled posts',
        posts: usage.count 
      }, 400);
    }
    
    await db.prepare(`
      DELETE FROM media_files WHERE id = ? AND user_id = ?
    `).bind(mediaId, userId).run();
    
    // In production, also delete from R2
    
    return c.json({ message: 'Media deleted' });
  } catch (error) {
    console.error('Delete media error:', error);
    return c.json({ error: 'Failed to delete media' }, 500);
  }
});

// Create folder
mediaRoutes.post('/folders',
  zValidator('json', z.object({
    path: z.string().min(1),
  })),
  async (c) => {
    const { path } = c.req.valid('json');
    
    // Folders are virtual in this implementation
    // They're just path values in media_files
    return c.json({ 
      message: 'Folder created',
      path: path.startsWith('/') ? path : `/${path}` 
    });
  }
);

export { mediaRoutes };

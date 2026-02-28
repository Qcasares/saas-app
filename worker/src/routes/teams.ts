import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { verify } from 'hono/jwt';
import type { Bindings, Variables } from '../index';

const teamRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

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

teamRoutes.use('*', authMiddleware);

// Get user's teams
// Get user's teams
teamRoutes.get('/', async (c) => {
  const userId = c.get('userId');
  const db = c.env.DB;
  
  try {
    const teams = await db.prepare(`
      SELECT 
        t.*,
        tm.role as my_role,
        (SELECT COUNT(*) FROM team_members WHERE team_id = t.id AND status = 'active') as member_count
      FROM teams t
      JOIN team_members tm ON t.id = tm.team_id
      WHERE tm.user_id = ? AND tm.status = 'active'
      ORDER BY t.created_at DESC
    `).bind(userId).all();
    
    return c.json({ teams: teams.results || [] });
  } catch (error) {
    console.error('Fetch teams error:', error);
    return c.json({ error: 'Failed to fetch teams' }, 500);
  }
});

// Create team
teamRoutes.post('/',
  zValidator('json', z.object({
    name: z.string().min(1).max(100),
    slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  })),
  async (c) => {
    const userId = c.get('userId');
    const data = c.req.valid('json');
    const db = c.env.DB;
    
    try {
      // Check slug availability
      const existing = await db.prepare(`
        SELECT id FROM teams WHERE slug = ?
      `).bind(data.slug).first();
      
      if (existing) {
        return c.json({ error: 'Team slug already taken' }, 400);
      }
      
      const teamId = crypto.randomUUID();
      
      await db.prepare(`
        INSERT INTO teams (id, name, owner_id, slug)
        VALUES (?, ?, ?, ?)
      `).bind(teamId, data.name, userId, data.slug).run();
      
      // Add creator as owner
      await db.prepare(`
        INSERT INTO team_members (id, team_id, user_id, role, status, joined_at)
        VALUES (?, ?, ?, 'owner', 'active', CURRENT_TIMESTAMP)
      `).bind(crypto.randomUUID(), teamId, userId).run();
      
      return c.json({ 
        id: teamId,
        message: 'Team created',
        team: {
          id: teamId,
          name: data.name,
          slug: data.slug,
          my_role: 'owner',
        }
      }, 201);
    } catch (error) {
      console.error('Create team error:', error);
      return c.json({ error: 'Failed to create team' }, 500);
    }
  }
);

// Get team details
teamRoutes.get('/:id', async (c) => {
  const userId = c.get('userId');
  const teamId = c.req.param('id');
  const db = c.env.DB;
  
  try {
    // Check membership
    const membership = await db.prepare(`
      SELECT role FROM team_members 
      WHERE team_id = ? AND user_id = ? AND status = 'active'
    `).bind(teamId, userId).first();
    
    if (!membership) {
      return c.json({ error: 'Team not found' }, 404);
    }
    
    const team = await db.prepare(`
      SELECT t.*, u.name as owner_name, u.email as owner_email
      FROM teams t
      JOIN users u ON t.owner_id = u.id
      WHERE t.id = ?
    `).bind(teamId).first();
    
    if (!team) {
      return c.json({ error: 'Team not found' }, 404);
    }
    
    // Get members
    const members = await db.prepare(`
      SELECT 
        tm.id,
        tm.role,
        tm.status,
        tm.joined_at,
        tm.invited_email,
        u.id as user_id,
        u.name,
        u.email,
        u.image
      FROM team_members tm
      LEFT JOIN users u ON tm.user_id = u.id
      WHERE tm.team_id = ?
      ORDER BY 
        CASE tm.role 
          WHEN 'owner' THEN 1 
          WHEN 'admin' THEN 2 
          WHEN 'editor' THEN 3 
          ELSE 4 
        END,
        tm.joined_at DESC
    `).bind(teamId).all();
    
    // Get team activity
    const activity = await db.prepare(`
      SELECT 
        al.*,
        u.name as user_name,
        u.image as user_image
      FROM activity_logs al
      JOIN users u ON al.user_id = u.id
      WHERE al.team_id = ?
      ORDER BY al.created_at DESC
      LIMIT 50
    `).bind(teamId).all();
    
    return c.json({
      team: {
        ...team,
        my_role: (membership as any).role,
      },
      members: members.results || [],
      activity: activity.results || [],
    });
  } catch (error) {
    console.error('Fetch team error:', error);
    return c.json({ error: 'Failed to fetch team' }, 500);
  }
});

// Invite member
teamRoutes.post('/:id/invite',
  zValidator('json', z.object({
    email: z.string().email(),
    role: z.enum(['admin', 'editor', 'viewer']).default('editor'),
  })),
  async (c) => {
    const userId = c.get('userId');
    const teamId = c.req.param('id');
    const data = c.req.valid('json');
    const db = c.env.DB;
    
    try {
      // Check permissions (only owner/admin can invite)
      const membership = await db.prepare(`
        SELECT role FROM team_members 
        WHERE team_id = ? AND user_id = ? AND status = 'active'
      `).bind(teamId, userId).first() as { role: string } | null;
      
      if (!membership || !['owner', 'admin'].includes(membership.role)) {
        return c.json({ error: 'Insufficient permissions' }, 403);
      }
      
      // Check if already a member
      const existing = await db.prepare(`
        SELECT id, status FROM team_members 
        WHERE team_id = ? AND (invited_email = ? OR user_id = (SELECT id FROM users WHERE email = ?))
      `).bind(teamId, data.email, data.email).first();
      
      if (existing) {
        if ((existing as any).status === 'active') {
          return c.json({ error: 'User is already a team member' }, 400);
        } else {
          // Update pending invitation
          await db.prepare(`
            UPDATE team_members 
            SET role = ?, invited_by = ?, invitation_expires_at = datetime('now', '+7 days')
            WHERE id = ?
          `).bind(data.role, userId, (existing as any).id).run();
          
          return c.json({ message: 'Invitation updated' });
        }
      }
      
      // Create invitation
      const invitationToken = crypto.randomUUID();
      const memberId = crypto.randomUUID();
      
      await db.prepare(`
        INSERT INTO team_members (id, team_id, invited_by, invited_email, role, status, invitation_token, invitation_expires_at)
        VALUES (?, ?, ?, ?, ?, 'pending', ?, datetime('now', '+7 days'))
      `).bind(memberId, teamId, userId, data.email, data.role, invitationToken).run();
      
      // Send invitation email (in production)
      // await sendInvitationEmail(data.email, teamId, invitationToken);
      
      // Log activity
      await db.prepare(`
        INSERT INTO activity_logs (id, user_id, team_id, action, entity_type, entity_id, metadata)
        VALUES (?, ?, ?, 'member_invited', 'team_member', ?, ?)
      `).bind(
        crypto.randomUUID(),
        userId,
        teamId,
        memberId,
        JSON.stringify({ invited_email: data.email, role: data.role })
      ).run();
      
      return c.json({ 
        message: 'Invitation sent',
        invitationToken, // In production, don't return this
      });
    } catch (error) {
      console.error('Invite error:', error);
      return c.json({ error: 'Failed to send invitation' }, 500);
    }
  }
);

// Accept invitation
teamRoutes.post('/accept-invite',
  zValidator('json', z.object({
    token: z.string(),
  })),
  async (c) => {
    const userId = c.get('userId');
    const { token } = c.req.valid('json');
    const db = c.env.DB;
    
    try {
      const invitation = await db.prepare(`
        SELECT * FROM team_members 
        WHERE invitation_token = ? 
        AND status = 'pending'
        AND invitation_expires_at > datetime('now')
      `).bind(token).first();
      
      if (!invitation) {
        return c.json({ error: 'Invalid or expired invitation' }, 400);
      }
      
      await db.prepare(`
        UPDATE team_members 
        SET user_id = ?, status = 'active', joined_at = CURRENT_TIMESTAMP, invitation_token = NULL
        WHERE id = ?
      `).bind(userId, (invitation as any).id).run();
      
      return c.json({ message: 'Invitation accepted' });
    } catch (error) {
      console.error('Accept invite error:', error);
      return c.json({ error: 'Failed to accept invitation' }, 500);
    }
  }
);

// Update member role
teamRoutes.put('/:id/members/:memberId',
  zValidator('json', z.object({
    role: z.enum(['admin', 'editor', 'viewer']),
  })),
  async (c) => {
    const userId = c.get('userId');
    const teamId = c.req.param('id');
    const memberId = c.req.param('memberId');
    const { role } = c.req.valid('json');
    const db = c.env.DB;
    
    try {
      // Check permissions
      const membership = await db.prepare(`
        SELECT role FROM team_members 
        WHERE team_id = ? AND user_id = ? AND status = 'active'
      `).bind(teamId, userId).first() as { role: string } | null;
      
      if (!membership || membership.role !== 'owner') {
        return c.json({ error: 'Only owner can change roles' }, 403);
      }
      
      await db.prepare(`
        UPDATE team_members SET role = ? WHERE id = ? AND team_id = ?
      `).bind(role, memberId, teamId).run();
      
      return c.json({ message: 'Member role updated' });
    } catch (error) {
      console.error('Update role error:', error);
      return c.json({ error: 'Failed to update role' }, 500);
    }
  }
);

// Remove member
teamRoutes.delete('/:id/members/:memberId', async (c) => {
  const userId = c.get('userId');
  const teamId = c.req.param('id');
  const memberId = c.req.param('memberId');
  const db = c.env.DB;
  
  try {
    // Check permissions
    const membership = await db.prepare(`
      SELECT role FROM team_members 
      WHERE team_id = ? AND user_id = ? AND status = 'active'
    `).bind(teamId, userId).first() as { role: string } | null;
    
    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return c.json({ error: 'Insufficient permissions' }, 403);
    }
    
    // Can't remove owner
    const targetMember = await db.prepare(`
      SELECT role FROM team_members WHERE id = ?
    `).bind(memberId).first() as { role: string } | null;
    
    if (targetMember?.role === 'owner') {
      return c.json({ error: 'Cannot remove team owner' }, 400);
    }
    
    await db.prepare(`
      UPDATE team_members SET status = 'removed' WHERE id = ? AND team_id = ?
    `).bind(memberId, teamId).run();
    
    return c.json({ message: 'Member removed' });
  } catch (error) {
    console.error('Remove member error:', error);
    return c.json({ error: 'Failed to remove member' }, 500);
  }
});

// Leave team
teamRoutes.post('/:id/leave', async (c) => {
  const userId = c.get('userId');
  const teamId = c.req.param('id');
  const db = c.env.DB;
  
  try {
    const membership = await db.prepare(`
      SELECT role FROM team_members 
      WHERE team_id = ? AND user_id = ? AND status = 'active'
    `).bind(teamId, userId).first() as { role: string } | null;
    
    if (!membership) {
      return c.json({ error: 'Not a team member' }, 400);
    }
    
    if (membership.role === 'owner') {
      return c.json({ error: 'Owner must transfer ownership before leaving' }, 400);
    }
    
    await db.prepare(`
      UPDATE team_members SET status = 'removed' WHERE team_id = ? AND user_id = ?
    `).bind(teamId, userId).run();
    
    return c.json({ message: 'Left team' });
  } catch (error) {
    console.error('Leave team error:', error);
    return c.json({ error: 'Failed to leave team' }, 500);
  }
});

// Delete team
teamRoutes.delete('/:id', async (c) => {
  const userId = c.get('userId');
  const teamId = c.req.param('id');
  const db = c.env.DB;
  
  try {
    const membership = await db.prepare(`
      SELECT role FROM team_members 
      WHERE team_id = ? AND user_id = ? AND status = 'active'
    `).bind(teamId, userId).first() as { role: string } | null;
    
    if (membership?.role !== 'owner') {
      return c.json({ error: 'Only owner can delete team' }, 403);
    }
    
    // Soft delete by updating status
    await db.prepare(`
      UPDATE team_members SET status = 'removed' WHERE team_id = ?
    `).bind(teamId).run();
    
    // In production, you might want to actually delete or archive
    
    return c.json({ message: 'Team deleted' });
  } catch (error) {
    console.error('Delete team error:', error);
    return c.json({ error: 'Failed to delete team' }, 500);
  }
});

export { teamRoutes };

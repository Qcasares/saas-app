import type { D1Database } from '@cloudflare/workers-types';

export interface User {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  created_at: string;
  updated_at: string;
  credits: number;
}

export async function createUser(
  db: D1Database,
  data: { email: string; name: string | null; image: string | null }
): Promise<User> {
  const id = crypto.randomUUID();
  
  await db.prepare(`
    INSERT INTO users (id, email, name, image)
    VALUES (?, ?, ?, ?)
  `).bind(id, data.email, data.name, data.image).run();
  
  // Create empty subscription record
  await db.prepare(`
    INSERT INTO subscriptions (user_id, stripe_customer_id, status, current_period_start, current_period_end, cancel_at_period_end)
    VALUES (?, '', 'incomplete', datetime('now'), datetime('now'), 0)
  `).bind(id).run();
  
  return {
    id,
    email: data.email,
    name: data.name,
    image: data.image,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    credits: 0,
  };
}

export async function getUserByEmail(db: D1Database, email: string): Promise<User | null> {
  const result = await db.prepare(`
    SELECT * FROM users WHERE email = ?
  `).bind(email).first();
  
  return result as User | null;
}

export async function getUserById(db: D1Database, id: string): Promise<User | null> {
  const result = await db.prepare(`
    SELECT * FROM users WHERE id = ?
  `).bind(id).first();
  
  return result as User | null;
}

export async function updateUser(
  db: D1Database,
  id: string,
  data: { name?: string; image?: string | null }
): Promise<User | null> {
  const updates: string[] = [];
  const params: (string | null)[] = [];
  
  if (data.name !== undefined) {
    updates.push('name = ?');
    params.push(data.name);
  }
  if (data.image !== undefined) {
    updates.push('image = ?');
    params.push(data.image);
  }
  
  if (updates.length === 0) {
    return getUserById(db, id);
  }
  
  params.push(id);
  
  await db.prepare(`
    UPDATE users SET ${updates.join(', ')} WHERE id = ?
  `).bind(...params).run();
  
  return getUserById(db, id);
}

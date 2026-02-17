import type { D1Database } from '@cloudflare/workers-types';

export interface OTPRecord {
  id: string;
  email: string;
  code: string;
  expires_at: string;
  created_at: string;
  used: boolean;
}

export async function createOTP(
  db: D1Database,
  data: { email: string; code: string; expiresAt: string }
): Promise<void> {
  const id = crypto.randomUUID();
  
  // Invalidate existing unused OTPs for this email
  await db.prepare(`
    UPDATE otp_codes SET used = 1 WHERE email = ? AND used = 0
  `).bind(data.email).run();
  
  await db.prepare(`
    INSERT INTO otp_codes (id, email, code, expires_at)
    VALUES (?, ?, ?, ?)
  `).bind(id, data.email, data.code, data.expiresAt).run();
}

export async function verifyOTP(
  db: D1Database,
  email: string,
  code: string
): Promise<boolean> {
  const result = await db.prepare(`
    SELECT * FROM otp_codes
    WHERE email = ? AND code = ? AND used = 0 AND expires_at > datetime('now')
  `).bind(email, code).first() as OTPRecord | null;
  
  if (!result) {
    return false;
  }
  
  // Mark as used
  await db.prepare(`
    UPDATE otp_codes SET used = 1 WHERE id = ?
  `).bind(result.id).run();
  
  return true;
}

export async function deleteExpiredOTPs(db: D1Database): Promise<void> {
  await db.prepare(`
    DELETE FROM otp_codes WHERE expires_at < datetime('now') OR used = 1
  `).run();
}

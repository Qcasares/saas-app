import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { sign, verify } from 'hono/jwt';
import type { Bindings, Variables } from '../index';
import { createUser, getUserByEmail, updateUser } from '../db/users';
import { createOTP, verifyOTP, deleteExpiredOTPs } from '../db/otp';
import { sendEmail } from '../utils/email';
import { generateOTP } from '../utils/helpers';

const authRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Google OAuth initiation
authRoutes.get('/google', async (c) => {
  const clientId = c.env.GOOGLE_CLIENT_ID;
  const redirectUri = `${new URL(c.req.url).origin}/auth/google/callback`;
  const state = crypto.randomUUID();

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state,
  });

  // Store state in a secure cookie for CSRF validation on callback
  const response = c.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
  response.headers.append(
    'Set-Cookie',
    `oauth_state=${state}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600`
  );
  return response;
});

// Google OAuth callback
authRoutes.get('/google/callback', async (c) => {
  const code = c.req.query('code');
  const state = c.req.query('state');
  const error = c.req.query('error');

  if (error) {
    return c.json({ error: 'OAuth denied' }, 400);
  }

  if (!code) {
    return c.json({ error: 'Missing authorization code' }, 400);
  }

  // Validate CSRF state parameter against stored cookie
  const cookieHeader = c.req.header('Cookie') || '';
  const storedState = cookieHeader
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith('oauth_state='))
    ?.split('=')[1];

  if (!state || !storedState || state !== storedState) {
    return c.json({ error: 'Invalid state parameter' }, 400);
  }

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: c.env.GOOGLE_CLIENT_ID,
        client_secret: c.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: `${new URL(c.req.url).origin}/auth/google/callback`,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      console.error('Token exchange failed:', await tokenResponse.text());
      return c.json({ error: 'Failed to exchange authorization code' }, 400);
    }

    const tokens = await tokenResponse.json() as {
      access_token?: string;
      id_token?: string;
      error?: string;
    };

    if (tokens.error || !tokens.access_token) {
      console.error('Token exchange error:', tokens.error);
      return c.json({ error: 'Failed to obtain access token' }, 400);
    }

    // Get user info
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!userResponse.ok) {
      console.error('Failed to fetch user info:', await userResponse.text());
      return c.json({ error: 'Failed to retrieve user information' }, 500);
    }

    const googleUser = await userResponse.json() as {
      id: string;
      email: string;
      name: string;
      picture: string;
    };

    if (!googleUser.email) {
      return c.json({ error: 'No email returned from Google' }, 400);
    }

    // Find or create user
    let user = await getUserByEmail(c.env.DB, googleUser.email);

    if (!user) {
      user = await createUser(c.env.DB, {
        email: googleUser.email,
        name: googleUser.name,
        image: googleUser.picture,
      });
    }

    // Generate JWT
    const token = await sign(
      {
        userId: user.id,
        email: user.email,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days
      },
      c.env.JWT_SECRET
    );

    // Redirect to frontend callback page
    // Note: app/(auth)/callback/page.tsx maps to /callback (route group doesn't affect URL)
    const redirectUrl = new URL('/callback', c.req.header('referer') || 'http://localhost:3000');
    redirectUrl.searchParams.set('token', token);

    // Clear the oauth_state cookie
    const response = c.redirect(redirectUrl.toString());
    response.headers.append(
      'Set-Cookie',
      'oauth_state=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0'
    );
    return response;
  } catch (error) {
    console.error('Google OAuth error:', error);
    return c.json({ error: 'Authentication failed' }, 500);
  }
});

// Request Email OTP
authRoutes.post('/otp/request', 
  zValidator('json', z.object({ email: z.string().email() })),
  async (c) => {
    const { email } = c.req.valid('json');
    
    try {
      // Generate OTP
      const code = generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      
      // Store OTP
      await createOTP(c.env.DB, { email, code, expiresAt: expiresAt.toISOString() });
      
      // Send email
      await sendEmail(c.env.RESEND_API_KEY, {
        to: email,
        subject: 'Your login code',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Your Login Code</h2>
            <p>Use the following code to log in:</p>
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; font-size: 32px; letter-spacing: 8px; font-weight: bold;">
              ${code}
            </div>
            <p style="color: #6b7280; margin-top: 20px;">This code expires in 10 minutes.</p>
            <p style="color: #6b7280;">If you didn't request this, please ignore this email.</p>
          </div>
        `,
      });
      
      return c.json({ message: 'OTP sent successfully' });
    } catch (error) {
      console.error('OTP request error:', error);
      return c.json({ error: 'Failed to send OTP' }, 500);
    }
  }
);

// Verify Email OTP
authRoutes.post('/otp/verify',
  zValidator('json', z.object({ 
    email: z.string().email(),
    code: z.string().length(6),
  })),
  async (c) => {
    const { email, code } = c.req.valid('json');
    
    try {
      // Verify OTP
      const isValid = await verifyOTP(c.env.DB, email, code);
      
      if (!isValid) {
        return c.json({ error: 'Invalid or expired code' }, 400);
      }
      
      // Find or create user
      let user = await getUserByEmail(c.env.DB, email);
      
      if (!user) {
        user = await createUser(c.env.DB, { email, name: null, image: null });
      }
      
      // Clean up expired OTPs
      await deleteExpiredOTPs(c.env.DB);
      
      // Generate JWT
      const token = await sign(
        { 
          userId: user.id, 
          email: user.email,
          exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
        },
        c.env.JWT_SECRET
      );
      
      return c.json({ token, user });
    } catch (error) {
      console.error('OTP verification error:', error);
      return c.json({ error: 'Verification failed' }, 500);
    }
  }
);

// Get current user
authRoutes.get('/me', async (c) => {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const token = authHeader.substring(7);
  
  try {
    const payload = await verify(token, c.env.JWT_SECRET) as { userId: string; email: string };
    const user = await getUserByEmail(c.env.DB, payload.email);
    
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }
    
    return c.json({ user });
  } catch {
    return c.json({ error: 'Invalid token' }, 401);
  }
});

export { authRoutes };

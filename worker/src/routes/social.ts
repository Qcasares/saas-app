import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { verify } from 'hono/jwt';
import type { Bindings, Variables } from '../index';

const socialRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

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

socialRoutes.use('*', authMiddleware);

// Get all connected accounts
socialRoutes.get('/accounts', async (c) => {
  const userId = c.get('userId');
  const db = c.env.DB;
  
  try {
    const accounts = await db.prepare(`
      SELECT 
        id, platform, account_id, account_name, account_image, account_username,
        followers_count, following_count, posts_count,
        is_active, created_at, updated_at
      FROM social_connections
      WHERE user_id = ?
      ORDER BY platform, created_at DESC
    `).bind(userId).all();
    
    return c.json({ accounts: accounts.results || [] });
  } catch (error) {
    console.error('Fetch accounts error:', error);
    return c.json({ error: 'Failed to fetch accounts' }, 500);
  }
});

// Get single account
socialRoutes.get('/accounts/:id', async (c) => {
  const userId = c.get('userId');
  const accountId = c.req.param('id');
  const db = c.env.DB;
  
  try {
    const account = await db.prepare(`
      SELECT * FROM social_connections WHERE id = ? AND user_id = ?
    `).bind(accountId, userId).first();
    
    if (!account) {
      return c.json({ error: 'Account not found' }, 404);
    }
    
    return c.json({ account });
  } catch (error) {
    console.error('Fetch account error:', error);
    return c.json({ error: 'Failed to fetch account' }, 500);
  }
});

// Disconnect account
socialRoutes.delete('/accounts/:id', async (c) => {
  const userId = c.get('userId');
  const accountId = c.req.param('id');
  const db = c.env.DB;
  
  try {
    await db.prepare(`
      DELETE FROM social_connections WHERE id = ? AND user_id = ?
    `).bind(accountId, userId).run();
    
    // Log activity
    await db.prepare(`
      INSERT INTO activity_logs (id, user_id, action, entity_type, entity_id)
      VALUES (?, ?, 'account_disconnected', 'account', ?)
    `).bind(crypto.randomUUID(), userId, accountId).run();
    
    return c.json({ message: 'Account disconnected' });
  } catch (error) {
    console.error('Disconnect error:', error);
    return c.json({ error: 'Failed to disconnect account' }, 500);
  }
});

// ========== TWITTER/X OAUTH ==========

// Generate PKCE code verifier
function generateCodeVerifier(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let result = '';
  for (let i = 0; i < 128; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Generate code challenge from verifier
function generateCodeChallenge(verifier: string): string {
  // Simple base64url encoding of verifier (in production, use SHA256)
  return btoa(verifier).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// Twitter OAuth - Step 1: Initiate
socialRoutes.get('/connect/twitter', async (c) => {
  const clientId = c.env.TWITTER_CLIENT_ID;
  const redirectUri = `${new URL(c.req.url).origin}/api/social/callback/twitter`;
  const state = crypto.randomUUID();
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);
  
  // Store state and code verifier temporarily (in production use KV/Redis)
  // For now, we'll encode them in the state
  const stateData = btoa(JSON.stringify({ state, verifier: codeVerifier, timestamp: Date.now() }));
  
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'tweet.read tweet.write users.read offline.access media.write',
    state: stateData,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });
  
  return c.redirect(`https://twitter.com/i/oauth2/authorize?${params}`);
});

// Twitter OAuth - Step 2: Callback
socialRoutes.get('/callback/twitter', async (c) => {
  const code = c.req.query('code');
  const stateData = c.req.query('state');
  const error = c.req.query('error');
  
  if (error || !code || !stateData) {
    return c.redirect('/dashboard/accounts?error=twitter_connection_failed');
  }
  
  // Decode state
  let stateObj: { verifier: string; timestamp: number };
  try {
    stateObj = JSON.parse(atob(stateData));
    // Check if state is expired (10 minutes)
    if (Date.now() - stateObj.timestamp > 600000) {
      return c.redirect('/dashboard/accounts?error=expired');
    }
  } catch {
    return c.redirect('/dashboard/accounts?error=invalid_state');
  }
  
  const clientId = c.env.TWITTER_CLIENT_ID;
  const clientSecret = c.env.TWITTER_CLIENT_SECRET;
  const redirectUri = `${new URL(c.req.url).origin}/api/social/callback/twitter`;
  
  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      },
      body: new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
        code_verifier: stateObj.verifier,
      }),
    });
    
    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Twitter token error:', errorData);
      return c.redirect('/dashboard/accounts?error=token_exchange_failed');
    }
    
    const tokenData = await tokenResponse.json() as {
      access_token: string;
      refresh_token: string;
      expires_in: number;
    };
    
    // Get user info from Twitter
    const userResponse = await fetch('https://api.twitter.com/2/users/me?user.fields=profile_image_url,public_metrics', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    });
    
    if (!userResponse.ok) {
      return c.redirect('/dashboard/accounts?error=user_fetch_failed');
    }
    
    const userData = await userResponse.json() as {
      data: {
        id: string;
        username: string;
        name: string;
        profile_image_url: string;
        public_metrics: {
          followers_count: number;
          following_count: number;
          tweet_count: number;
        };
      };
    };
    
    // Store connection in database
    const userId = c.req.query('userId') || 'demo-user'; // In production, get from session
    const db = c.env.DB;
    
    // Check if account already exists
    const existing = await db.prepare(`
      SELECT id FROM social_connections 
      WHERE user_id = ? AND platform = 'twitter' AND account_id = ?
    `).bind(userId, userData.data.id).first();
    
    if (existing) {
      // Update existing connection
      await db.prepare(`
        UPDATE social_connections 
        SET access_token = ?, refresh_token = ?, expires_at = ?,
            account_name = ?, account_image = ?, account_username = ?,
            followers_count = ?, following_count = ?, posts_count = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(
        tokenData.access_token,
        tokenData.refresh_token,
        Date.now() + tokenData.expires_in * 1000,
        userData.data.name,
        userData.data.profile_image_url,
        userData.data.username,
        userData.data.public_metrics.followers_count,
        userData.data.public_metrics.following_count,
        userData.data.public_metrics.tweet_count,
        (existing as any).id
      ).run();
    } else {
      // Create new connection
      await db.prepare(`
        INSERT INTO social_connections 
        (id, user_id, platform, account_id, account_name, account_image, account_username,
         access_token, refresh_token, expires_at, followers_count, following_count, posts_count)
        VALUES (?, ?, 'twitter', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        crypto.randomUUID(),
        userId,
        userData.data.id,
        userData.data.name,
        userData.data.profile_image_url,
        userData.data.username,
        tokenData.access_token,
        tokenData.refresh_token,
        Date.now() + tokenData.expires_in * 1000,
        userData.data.public_metrics.followers_count,
        userData.data.public_metrics.following_count,
        userData.data.public_metrics.tweet_count
      ).run();
      
      // Log activity
      await db.prepare(`
        INSERT INTO activity_logs (id, user_id, action, entity_type, metadata)
        VALUES (?, ?, 'account_connected', 'account', ?)
      `).bind(
        crypto.randomUUID(),
        userId,
        JSON.stringify({ platform: 'twitter', account_name: userData.data.name })
      ).run();
    }
    
    return c.redirect('/dashboard/accounts?success=twitter_connected');
  } catch (error) {
    console.error('Twitter callback error:', error);
    return c.redirect('/dashboard/accounts?error=connection_failed');
  }
});

// ========== INSTAGRAM OAUTH ==========

// Instagram OAuth - Step 1: Initiate
socialRoutes.get('/connect/instagram', async (c) => {
  const clientId = c.env.INSTAGRAM_CLIENT_ID;
  const redirectUri = `${new URL(c.req.url).origin}/api/social/callback/instagram`;
  const state = crypto.randomUUID();
  
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'instagram_basic,instagram_content_publish,instagram_manage_insights',
    state,
  });
  
  return c.redirect(`https://api.instagram.com/oauth/authorize?${params}`);
});

// Instagram OAuth - Step 2: Callback
socialRoutes.get('/callback/instagram', async (c) => {
  const code = c.req.query('code');
  const error = c.req.query('error');
  
  if (error || !code) {
    return c.redirect('/dashboard/accounts?error=instagram_connection_failed');
  }
  
  const clientId = c.env.INSTAGRAM_CLIENT_ID;
  const clientSecret = c.env.INSTAGRAM_CLIENT_SECRET;
  const redirectUri = `${new URL(c.req.url).origin}/api/social/callback/instagram`;
  
  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
        code,
      }),
    });
    
    if (!tokenResponse.ok) {
      console.error('Instagram token error:', await tokenResponse.text());
      return c.redirect('/dashboard/accounts?error=token_exchange_failed');
    }
    
    const tokenData = await tokenResponse.json() as {
      access_token: string;
      user_id: string;
    };
    
    // Get long-lived token
    const longLivedResponse = await fetch(`https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${clientSecret}&access_token=${tokenData.access_token}`);
    const longLivedData = await longLivedResponse.json() as {
      access_token: string;
      expires_in: number;
    };
    
    // Get user info
    const userResponse = await fetch(`https://graph.instagram.com/me?fields=id,username,account_type,media_count&access_token=${longLivedData.access_token}`);
    const userData = await userResponse.json() as {
      id: string;
      username: string;
      account_type: string;
      media_count: number;
    };
    
    // Store connection
    const userId = c.req.query('userId') || 'demo-user';
    const db = c.env.DB;
    
    const existing = await db.prepare(`
      SELECT id FROM social_connections 
      WHERE user_id = ? AND platform = 'instagram' AND account_id = ?
    `).bind(userId, userData.id).first();
    
    if (existing) {
      await db.prepare(`
        UPDATE social_connections 
        SET access_token = ?, expires_at = ?, account_name = ?, posts_count = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(
        longLivedData.access_token,
        Date.now() + longLivedData.expires_in * 1000,
        userData.username,
        userData.media_count,
        (existing as any).id
      ).run();
    } else {
      await db.prepare(`
        INSERT INTO social_connections 
        (id, user_id, platform, account_id, account_name, account_username,
         access_token, expires_at, posts_count)
        VALUES (?, ?, 'instagram', ?, ?, ?, ?, ?, ?)
      `).bind(
        crypto.randomUUID(),
        userId,
        userData.id,
        userData.username,
        userData.username,
        longLivedData.access_token,
        Date.now() + longLivedData.expires_in * 1000,
        userData.media_count
      ).run();
    }
    
    return c.redirect('/dashboard/accounts?success=instagram_connected');
  } catch (error) {
    console.error('Instagram callback error:', error);
    return c.redirect('/dashboard/accounts?error=connection_failed');
  }
});

// ========== LINKEDIN OAUTH ==========

// LinkedIn OAuth - Step 1: Initiate
socialRoutes.get('/connect/linkedin', async (c) => {
  const clientId = c.env.LINKEDIN_CLIENT_ID;
  const redirectUri = `${new URL(c.req.url).origin}/api/social/callback/linkedin`;
  const state = crypto.randomUUID();
  
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid profile w_member_social r_organization_social w_organization_social',
    state,
  });
  
  return c.redirect(`https://www.linkedin.com/oauth/v2/authorization?${params}`);
});

// LinkedIn OAuth - Step 2: Callback
socialRoutes.get('/callback/linkedin', async (c) => {
  const code = c.req.query('code');
  const error = c.req.query('error');
  
  if (error || !code) {
    return c.redirect('/dashboard/accounts?error=linkedin_connection_failed');
  }
  
  const clientId = c.env.LINKEDIN_CLIENT_ID;
  const clientSecret = c.env.LINKEDIN_CLIENT_SECRET;
  const redirectUri = `${new URL(c.req.url).origin}/api/social/callback/linkedin`;
  
  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });
    
    if (!tokenResponse.ok) {
      console.error('LinkedIn token error:', await tokenResponse.text());
      return c.redirect('/dashboard/accounts?error=token_exchange_failed');
    }
    
    const tokenData = await tokenResponse.json() as {
      access_token: string;
      expires_in: number;
    };
    
    // Get user info
    const userResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    });
    
    const userData = await userResponse.json() as {
      sub: string;
      name: string;
      picture: string;
    };
    
    // Store connection
    const userId = c.req.query('userId') || 'demo-user';
    const db = c.env.DB;
    
    const existing = await db.prepare(`
      SELECT id FROM social_connections 
      WHERE user_id = ? AND platform = 'linkedin' AND account_id = ?
    `).bind(userId, userData.sub).first();
    
    if (existing) {
      await db.prepare(`
        UPDATE social_connections 
        SET access_token = ?, expires_at = ?, account_name = ?, account_image = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(
        tokenData.access_token,
        Date.now() + tokenData.expires_in * 1000,
        userData.name,
        userData.picture,
        (existing as any).id
      ).run();
    } else {
      await db.prepare(`
        INSERT INTO social_connections 
        (id, user_id, platform, account_id, account_name, account_image,
         access_token, expires_at)
        VALUES (?, ?, 'linkedin', ?, ?, ?, ?, ?)
      `).bind(
        crypto.randomUUID(),
        userId,
        userData.sub,
        userData.name,
        userData.picture,
        tokenData.access_token,
        Date.now() + tokenData.expires_in * 1000
      ).run();
    }
    
    return c.redirect('/dashboard/accounts?success=linkedin_connected');
  } catch (error) {
    console.error('LinkedIn callback error:', error);
    return c.redirect('/dashboard/accounts?error=connection_failed');
  }
});

// ========== TIKTOK OAUTH ==========

// TikTok OAuth - Step 1: Initiate
socialRoutes.get('/connect/tiktok', async (c) => {
  const clientKey = c.env.TIKTOK_CLIENT_KEY;
  const redirectUri = `${new URL(c.req.url).origin}/api/social/callback/tiktok`;
  const state = crypto.randomUUID();
  const codeVerifier = generateCodeVerifier();
  
  const stateData = btoa(JSON.stringify({ state, verifier: codeVerifier, timestamp: Date.now() }));
  
  const params = new URLSearchParams({
    client_key: clientKey,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'user.info.basic,video.publish,video.upload',
    state: stateData,
  });
  
  return c.redirect(`https://www.tiktok.com/v2/auth/authorize?${params}`);
});

// TikTok OAuth - Step 2: Callback
socialRoutes.get('/callback/tiktok', async (c) => {
  const code = c.req.query('code');
  const stateData = c.req.query('state');
  const error = c.req.query('error');
  
  if (error || !code) {
    return c.redirect('/dashboard/accounts?error=tiktok_connection_failed');
  }
  
  const clientKey = c.env.TIKTOK_CLIENT_KEY;
  const clientSecret = c.env.TIKTOK_CLIENT_SECRET;
  
  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_key: clientKey,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
      }),
    });
    
    if (!tokenResponse.ok) {
      console.error('TikTok token error:', await tokenResponse.text());
      return c.redirect('/dashboard/accounts?error=token_exchange_failed');
    }
    
    const tokenData = await tokenResponse.json() as {
      access_token: string;
      refresh_token: string;
      expires_in: number;
      open_id: string;
    };
    
    // Get user info
    const userResponse = await fetch('https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name,follower_count,following_count,likes_count', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    });
    
    const userData = await userResponse.json() as {
      data: {
        user: {
          open_id: string;
          display_name: string;
          avatar_url: string;
          follower_count: number;
          following_count: number;
          likes_count: number;
        };
      };
    };
    
    // Store connection
    const userId = c.req.query('userId') || 'demo-user';
    const db = c.env.DB;
    
    const existing = await db.prepare(`
      SELECT id FROM social_connections 
      WHERE user_id = ? AND platform = 'tiktok' AND account_id = ?
    `).bind(userId, userData.data.user.open_id).first();
    
    if (existing) {
      await db.prepare(`
        UPDATE social_connections 
        SET access_token = ?, refresh_token = ?, expires_at = ?,
            account_name = ?, account_image = ?, followers_count = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(
        tokenData.access_token,
        tokenData.refresh_token,
        Date.now() + tokenData.expires_in * 1000,
        userData.data.user.display_name,
        userData.data.user.avatar_url,
        userData.data.user.follower_count,
        (existing as any).id
      ).run();
    } else {
      await db.prepare(`
        INSERT INTO social_connections 
        (id, user_id, platform, account_id, account_name, account_image,
         access_token, refresh_token, expires_at, followers_count)
        VALUES (?, ?, 'tiktok', ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        crypto.randomUUID(),
        userId,
        userData.data.user.open_id,
        userData.data.user.display_name,
        userData.data.user.avatar_url,
        tokenData.access_token,
        tokenData.refresh_token,
        Date.now() + tokenData.expires_in * 1000,
        userData.data.user.follower_count
      ).run();
    }
    
    return c.redirect('/dashboard/accounts?success=tiktok_connected');
  } catch (err) {
    console.error('TikTok callback error:', err);
    return c.redirect('/dashboard/accounts?error=connection_failed');
  }
});

// ========== PLATFORM POSTING ==========

// Post to Twitter
async function postToTwitter(accessToken: string, content: string, mediaUrls: string[]) {
  // Upload media first if any
  const mediaIds: string[] = [];
  
  for (const url of mediaUrls) {
    // Download and upload media to Twitter
    // This is simplified - real implementation needs chunked upload for videos
    const mediaResponse = await fetch('https://upload.twitter.com/1.1/media/upload.json', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'multipart/form-data',
      },
      // Form data with media would go here
    });
    
    if (mediaResponse.ok) {
      const mediaData = await mediaResponse.json() as { media_id_string: string };
      mediaIds.push(mediaData.media_id_string);
    }
  }
  
  // Create tweet
  const tweetResponse = await fetch('https://api.twitter.com/2/tweets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: content,
      ...(mediaIds.length > 0 && { media: { media_keys: mediaIds } }),
    }),
  });
  
  if (!tweetResponse.ok) {
    const error = await tweetResponse.text();
    throw new Error(`Twitter post failed: ${error}`);
  }
  
  const result = await tweetResponse.json() as { data: { id: string } };
  return result.data.id;
}

// Post to Instagram
async function postToInstagram(accessToken: string, accountId: string, content: string, mediaUrls: string[]) {
  // Instagram requires single image or video per post (carousel for multiple)
  // For simplicity, this handles single media posts
  
  const mediaUrl = mediaUrls[0];
  const isVideo = mediaUrl?.match(/\.(mp4|mov|avi)$/i);
  
  // Create media container
  const containerParams = new URLSearchParams({
    access_token: accessToken,
    caption: content,
    ...(isVideo 
      ? { media_type: 'VIDEO', video_url: mediaUrl }
      : { image_url: mediaUrl }
    ),
  });
  
  const containerResponse = await fetch(`https://graph.instagram.com/v18.0/${accountId}/media?${containerParams}`);
  
  if (!containerResponse.ok) {
    throw new Error('Instagram media container creation failed');
  }
  
  const containerData = await containerResponse.json() as { id: string };
  
  // Publish container
  const publishParams = new URLSearchParams({
    access_token: accessToken,
    creation_id: containerData.id,
  });
  
  // Wait a bit for media processing
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  const publishResponse = await fetch(`https://graph.instagram.com/v18.0/${accountId}/media_publish?${publishParams}`, {
    method: 'POST',
  });
  
  if (!publishResponse.ok) {
    throw new Error('Instagram publish failed');
  }
  
  const result = await publishResponse.json() as { id: string };
  return result.id;
}

// Post to LinkedIn
async function postToLinkedIn(accessToken: string, content: string, mediaUrls: string[]) {
  // Get user URN
  const userResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
    headers: { 'Authorization': `Bearer ${accessToken}` },
  });
  
  const userData = await userResponse.json() as { sub: string };
  const author = `urn:li:person:${userData.sub}`;
  
  // Build post body
  const postBody: any = {
    author,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: { text: content },
        shareMediaCategory: mediaUrls.length > 0 ? 'IMAGE' : 'NONE',
      },
    },
    visibility: {
      'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
    },
  };
  
  // Media handling would require uploading to LinkedIn's assets API first
  
  const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify(postBody),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`LinkedIn post failed: ${error}`);
  }
  
  // LinkedIn returns the URN in the Location header
  return response.headers.get('x-restli-id') || 'unknown';
}

// Post to TikTok
async function postToTikTok(accessToken: string, content: string, mediaUrls: string[]) {
  // TikTok requires video uploads via their POST /video/upload/ endpoint
  // This is a simplified version
  
  const videoUrl = mediaUrls.find(url => url.match(/\.(mp4|mov|avi)$/i));
  
  if (!videoUrl) {
    throw new Error('TikTok requires a video file');
  }
  
  // Initiate video upload
  const initResponse = await fetch('https://open.tiktokapis.com/v2/post/publish/video/init/', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      source_info: {
        source: 'PULL_FROM_URL',
        url: videoUrl,
      },
      title: content.slice(0, 100),
      privacy_level: 'PUBLIC',
    }),
  });
  
  if (!initResponse.ok) {
    const error = await initResponse.text();
    throw new Error(`TikTok upload failed: ${error}`);
  }
  
  const result = await initResponse.json() as { data: { publish_id: string } };
  return result.data.publish_id;
}

// Publish post to multiple platforms
socialRoutes.post('/publish',
  zValidator('json', z.object({
    postId: z.string(),
  })),
  async (c) => {
    const userId = c.get('userId');
    const { postId } = c.req.valid('json');
    const db = c.env.DB;
    
    try {
      // Get post details
      const post = await db.prepare(`
        SELECT * FROM scheduled_posts WHERE id = ? AND user_id = ?
      `).bind(postId, userId).first() as {
        id: string;
        content: string;
        media_urls: string;
        platforms: string;
      } | null;
      
      if (!post) {
        return c.json({ error: 'Post not found' }, 404);
      }
      
      // Get connected accounts for the platforms
      const platforms = JSON.parse(post.platforms) as string[];
      const mediaUrls = JSON.parse(post.media_urls || '[]') as string[];
      
      const accounts = await db.prepare(`
        SELECT * FROM social_connections 
        WHERE user_id = ? AND platform IN (${platforms.map(() => '?').join(',')})
      `).bind(userId, ...platforms).all();
      
      const platformPostIds: Record<string, string> = {};
      const errors: Record<string, string> = {};
      
      // Publish to each platform
      for (const account of (accounts.results || [])) {
        try {
          let postId: string;
          
          switch (account.platform) {
            case 'twitter':
              postId = await postToTwitter(account.access_token, post.content, mediaUrls);
              break;
            case 'instagram':
              postId = await postToInstagram(account.access_token, account.account_id, post.content, mediaUrls);
              break;
            case 'linkedin':
              postId = await postToLinkedIn(account.access_token, post.content, mediaUrls);
              break;
            case 'tiktok':
              postId = await postToTikTok(account.access_token, post.content, mediaUrls);
              break;
            default:
              throw new Error(`Unsupported platform: ${account.platform}`);
          }
          
          platformPostIds[account.platform] = postId;
        } catch (err: any) {
          console.error(`Failed to post to ${account.platform}:`, err);
          errors[account.platform] = err.message;
        }
      }
      
      // Update post status
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
        post.id
      ).run();
      
      // Create notification
      if (success) {
        await db.prepare(`
          INSERT INTO notifications (id, user_id, type, title, message, data)
          VALUES (?, ?, 'post_published', 'Post Published', ?, ?)
        `).bind(
          crypto.randomUUID(),
          userId,
          `Your post has been published to ${Object.keys(platformPostIds).join(', ')}`,
          JSON.stringify({ postId: post.id, platforms: Object.keys(platformPostIds) })
        ).run();
      }
      
      return c.json({ 
        success,
        platformPostIds,
        errors: Object.keys(errors).length > 0 ? errors : undefined
      });
    } catch (error: any) {
      console.error('Publish error:', error);
      return c.json({ error: 'Failed to publish post' }, 500);
    }
  }
);

// Refresh account metrics
socialRoutes.post('/accounts/:id/refresh', async (c) => {
  const userId = c.get('userId');
  const accountId = c.req.param('id');
  const db = c.env.DB;
  
  try {
    const account = await db.prepare(`
      SELECT platform, access_token, account_id 
      FROM social_connections 
      WHERE id = ? AND user_id = ?
    `).bind(accountId, userId).first() as { 
      platform: string; 
      access_token: string; 
      account_id: string;
    } | null;
    
    if (!account) {
      return c.json({ error: 'Account not found' }, 404);
    }
    
    let metrics: any = {};
    
    // Platform-specific metric fetching
    switch (account.platform) {
      case 'twitter':
        const twitterResponse = await fetch(`https://api.twitter.com/2/users/${account.account_id}?user.fields=public_metrics,profile_image_url`, {
          headers: { 'Authorization': `Bearer ${account.access_token}` },
        });
        if (twitterResponse.ok) {
          const data = await twitterResponse.json() as { 
            data: { 
              public_metrics: { followers_count: number; following_count: number; tweet_count: number };
              profile_image_url: string;
            } 
          };
          metrics = {
            followers: data.data.public_metrics.followers_count,
            following: data.data.public_metrics.following_count,
            posts: data.data.public_metrics.tweet_count,
            profile_image: data.data.profile_image_url,
          };
        }
        break;
        
      // Add other platforms as needed
    }
    
    // Update account metrics
    if (Object.keys(metrics).length > 0) {
      await db.prepare(`
        UPDATE social_connections 
        SET followers_count = ?, following_count = ?, posts_count = ?,
            ${metrics.profile_image ? 'account_image = ?,' : ''}
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(
        metrics.followers || 0,
        metrics.following || 0,
        metrics.posts || 0,
        ...(metrics.profile_image ? [metrics.profile_image] : []),
        accountId
      ).run();
      
      // Record analytics
      const today = new Date().toISOString().split('T')[0];
      const existingMetric = await db.prepare(`
        SELECT id FROM analytics_daily WHERE connection_id = ? AND date = ?
      `).bind(accountId, today).first();
      
      if (existingMetric) {
        await db.prepare(`
          UPDATE analytics_daily 
          SET followers = ?, updated_metrics = CURRENT_TIMESTAMP
          WHERE id = ?
        `).bind(metrics.followers || 0, (existingMetric as any).id).run();
      } else {
        await db.prepare(`
          INSERT INTO analytics_daily (id, connection_id, platform, date, followers)
          VALUES (?, ?, ?, ?, ?)
        `).bind(crypto.randomUUID(), accountId, account.platform, today, metrics.followers || 0).run();
      }
    }
    
    return c.json({ message: 'Account refreshed', metrics });
  } catch (error) {
    console.error('Refresh error:', error);
    return c.json({ error: 'Failed to refresh account' }, 500);
  }
});

export { socialRoutes };

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { verify } from 'hono/jwt';
import Stripe from 'stripe';
import type { Bindings, Variables } from '../index';

const subscriptionRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

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

subscriptionRoutes.use('*', authMiddleware);

// Get subscription plans
subscriptionRoutes.get('/plans', async (c) => {
  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      description: 'Perfect for individuals getting started',
      price: 9,
      currency: 'usd',
      interval: 'month',
      features: [
        'Up to 3 social accounts',
        '50 posts per month',
        'Basic analytics',
        'Email support',
      ],
      limits: {
        accounts: 3,
        postsPerMonth: 50,
        teamMembers: 1,
        analyticsRetention: 30,
      },
    },
    {
      id: 'pro',
      name: 'Pro',
      description: 'For growing businesses and creators',
      price: 29,
      currency: 'usd',
      interval: 'month',
      features: [
        'Up to 10 social accounts',
        'Unlimited posts',
        'Advanced analytics',
        'Priority support',
        'Team collaboration',
      ],
      limits: {
        accounts: 10,
        postsPerMonth: -1,
        teamMembers: 5,
        analyticsRetention: 90,
      },
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      description: 'For large teams and agencies',
      price: 99,
      currency: 'usd',
      interval: 'month',
      features: [
        'Unlimited social accounts',
        'Unlimited posts',
        'Custom analytics',
        'Dedicated support',
        'API access',
        'White-label options',
      ],
      limits: {
        accounts: -1,
        postsPerMonth: -1,
        teamMembers: -1,
        analyticsRetention: 365,
      },
    },
  ];
  
  return c.json({ plans });
});

// Get current subscription
subscriptionRoutes.get('/current', async (c) => {
  const userId = c.get('userId');
  const db = c.env.DB;
  
  try {
    const subscription = await db.prepare(`
      SELECT * FROM subscriptions WHERE user_id = ?
    `).bind(userId).first();
    
    if (!subscription) {
      return c.json({ subscription: null });
    }
    
    return c.json({ subscription });
  } catch (error) {
    console.error('Subscription fetch error:', error);
    return c.json({ error: 'Failed to fetch subscription' }, 500);
  }
});

// Create checkout session
subscriptionRoutes.post('/checkout',
  zValidator('json', z.object({
    priceId: z.string(),
    plan: z.enum(['starter', 'pro', 'enterprise']),
  })),
  async (c) => {
    const userId = c.get('userId');
    const user = c.get('user');
    const { priceId, plan } = c.req.valid('json');
    
    const stripe = new Stripe(c.env.STRIPE_SECRET_KEY, { apiVersion: '2024-03-20' });
    const db = c.env.DB;
    
    try {
      // Get or create customer
      let customerId: string;
      const existingSub = await db.prepare(`
        SELECT stripe_customer_id FROM subscriptions WHERE user_id = ?
      `).bind(userId).first() as { stripe_customer_id: string } | null;
      
      if (existingSub?.stripe_customer_id) {
        customerId = existingSub.stripe_customer_id;
      } else {
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: { userId },
        });
        customerId = customer.id;
        
        // Create subscription record
        await db.prepare(`
          INSERT INTO subscriptions 
          (user_id, stripe_customer_id, status, plan, current_period_start, current_period_end, cancel_at_period_end)
          VALUES (?, ?, 'incomplete', ?, datetime('now'), datetime('now', '+1 month'), 0)
        `).bind(userId, customerId, plan).run();
      }
      
      // Create checkout session
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [{
          price: priceId,
          quantity: 1,
        }],
        mode: 'subscription',
        success_url: `${c.req.header('origin')}/dashboard/billing?success=true`,
        cancel_url: `${c.req.header('origin')}/dashboard/billing?canceled=true`,
        metadata: { userId, plan },
      });
      
      return c.json({ sessionId: session.id, url: session.url });
    } catch (error) {
      console.error('Checkout error:', error);
      return c.json({ error: 'Failed to create checkout session' }, 500);
    }
  }
);

// Create customer portal session
subscriptionRoutes.post('/portal', async (c) => {
  const userId = c.get('userId');
  
  const stripe = new Stripe(c.env.STRIPE_SECRET_KEY, { apiVersion: '2024-03-20' });
  const db = c.env.DB;
  
  try {
    const subscription = await db.prepare(`
      SELECT stripe_customer_id FROM subscriptions WHERE user_id = ?
    `).bind(userId).first() as { stripe_customer_id: string } | null;
    
    if (!subscription?.stripe_customer_id) {
      return c.json({ error: 'No subscription found' }, 400);
    }
    
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${c.req.header('origin')}/dashboard/billing`,
    });
    
    return c.json({ url: session.url });
  } catch (error) {
    console.error('Portal error:', error);
    return c.json({ error: 'Failed to create portal session' }, 500);
  }
});

// Buy credits (PAYG)
subscriptionRoutes.post('/credits',
  zValidator('json', z.object({
    amount: z.number().min(5).max(1000),
  })),
  async (c) => {
    const userId = c.get('userId');
    const user = c.get('user');
    const { amount } = c.req.valid('json');
    
    const stripe = new Stripe(c.env.STRIPE_SECRET_KEY, { apiVersion: '2024-03-20' });
    const db = c.env.DB;
    
    try {
      // Get customer
      let customerId: string;
      const existingSub = await db.prepare(`
        SELECT stripe_customer_id FROM subscriptions WHERE user_id = ?
      `).bind(userId).first() as { stripe_customer_id: string } | null;
      
      if (existingSub?.stripe_customer_id) {
        customerId = existingSub.stripe_customer_id;
      } else {
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: { userId },
        });
        customerId = customer.id;
      }
      
      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount * 100, // Convert to cents
        currency: 'usd',
        customer: customerId,
        metadata: { userId, type: 'credits', amount },
      });
      
      return c.json({ 
        clientSecret: paymentIntent.client_secret,
        amount,
      });
    } catch (error) {
      console.error('Credits purchase error:', error);
      return c.json({ error: 'Failed to create payment intent' }, 500);
    }
  }
);

export { subscriptionRoutes };

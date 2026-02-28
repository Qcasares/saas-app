import { Hono } from 'hono';
import Stripe from 'stripe';
import type { Bindings, Variables } from '../index';

const webhookRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Stripe webhook handler
webhookRoutes.post('/stripe', async (c) => {
  const signature = c.req.header('stripe-signature');
  const body = await c.req.text();
  
  if (!signature) {
    return c.json({ error: 'Missing signature' }, 400);
  }
  
  const stripe = new Stripe(c.env.STRIPE_SECRET_KEY, { apiVersion: '2024-03-20' });
  
  let event: Stripe.Event;
  
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      c.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return c.json({ error: 'Invalid signature' }, 400);
  }
  
  const db = c.env.DB;
  
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const plan = session.metadata?.plan;
        
        if (userId && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          
          await db.prepare(`
            UPDATE subscriptions
            SET stripe_subscription_id = ?,
                stripe_price_id = ?,
                status = ?,
                plan = ?,
                current_period_start = ?,
                current_period_end = ?,
                cancel_at_period_end = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE user_id = ?
          `).bind(
            subscription.id,
            subscription.items.data[0].price.id,
            subscription.status,
            plan,
            new Date(subscription.current_period_start * 1000).toISOString(),
            new Date(subscription.current_period_end * 1000).toISOString(),
            subscription.cancel_at_period_end ? 1 : 0,
            userId
          ).run();
        }
        break;
      }
      
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
          const customer = await stripe.customers.retrieve(subscription.customer as string);
          const userId = (customer as Stripe.Customer).metadata?.userId;
          
          if (userId) {
            await db.prepare(`
              UPDATE subscriptions
              SET status = ?,
                  current_period_start = ?,
                  current_period_end = ?,
                  updated_at = CURRENT_TIMESTAMP
              WHERE user_id = ?
            `).bind(
              subscription.status,
              new Date(subscription.current_period_start * 1000).toISOString(),
              new Date(subscription.current_period_end * 1000).toISOString(),
              userId
            ).run();
          }
        }
        break;
      }
      
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
          const customer = await stripe.customers.retrieve(subscription.customer as string);
          const userId = (customer as Stripe.Customer).metadata?.userId;
          
          if (userId) {
            await db.prepare(`
              UPDATE subscriptions
              SET status = ?,
                  updated_at = CURRENT_TIMESTAMP
              WHERE user_id = ?
            `).bind(subscription.status, userId).run();
          }
        }
        break;
      }
      
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customer = await stripe.customers.retrieve(subscription.customer as string);
        const userId = (customer as Stripe.Customer).metadata?.userId;
        
        if (userId) {
          // Get plan from price metadata or lookup
          const plan = subscription.metadata?.plan || 
            (await db.prepare('SELECT plan FROM subscriptions WHERE user_id = ?').bind(userId).first() as any)?.plan;
          
          await db.prepare(`
            UPDATE subscriptions
            SET status = ?,
                plan = ?,
                current_period_start = ?,
                current_period_end = ?,
                cancel_at_period_end = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE user_id = ?
          `).bind(
            subscription.status,
            plan,
            new Date(subscription.current_period_start * 1000).toISOString(),
            new Date(subscription.current_period_end * 1000).toISOString(),
            subscription.cancel_at_period_end ? 1 : 0,
            userId
          ).run();
        }
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customer = await stripe.customers.retrieve(subscription.customer as string);
        const userId = (customer as Stripe.Customer).metadata?.userId;
        
        if (userId) {
          await db.prepare(`
            UPDATE subscriptions
            SET status = 'canceled',
                plan = NULL,
                stripe_subscription_id = NULL,
                stripe_price_id = NULL,
                updated_at = CURRENT_TIMESTAMP
            WHERE user_id = ?
          `).bind(userId).run();
        }
        break;
      }
      
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        if (paymentIntent.metadata?.type === 'credits') {
          const userId = paymentIntent.metadata.userId;
          const amount = parseInt(paymentIntent.metadata.amount);
          
          // Add credits to user
          await db.prepare(`
            UPDATE users
            SET credits = credits + ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `).bind(amount, userId).run();
          
          // Record transaction
          await db.prepare(`
            INSERT INTO credit_transactions (user_id, amount, type, description, stripe_payment_intent_id)
            VALUES (?, ?, 'purchase', 'Credit purchase', ?)
          `).bind(userId, amount, paymentIntent.id).run();
        }
        break;
      }
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
    
    return c.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return c.json({ error: 'Webhook processing failed' }, 500);
  }
});

export { webhookRoutes };

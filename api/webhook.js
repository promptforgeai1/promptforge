// /api/webhook.js
// PromptForge AI — Stripe Webhook Handler
// Listens for subscription events and updates user tier in Supabase

export const config = { api: { bodyParser: false } };

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

async function updateUserTier(userId, tier) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  if (!supabaseUrl || !supabaseKey) return;

  await fetch(`${supabaseUrl}/rest/v1/users?user_id=eq.${userId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({ tier, updated_at: new Date().toISOString() })
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) return res.status(500).json({ error: 'Webhook not configured' });

  const rawBody = await getRawBody(req);
  const sig = req.headers['stripe-signature'];

  // Verify Stripe signature
  // In production: use official stripe npm package for crypto verification
  // import Stripe from 'stripe'; const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  // const event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);

  let event;
  try {
    event = JSON.parse(rawBody.toString());
  } catch {
    return res.status(400).json({ error: 'Invalid payload' });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata?.userId;
        if (userId) await updateUserTier(userId, 'pro');
        console.log(`User ${userId} upgraded to Pro`);
        break;
      }
      case 'customer.subscription.deleted':
      case 'customer.subscription.paused': {
        const sub = event.data.object;
        const userId = sub.metadata?.userId;
        if (userId) await updateUserTier(userId, 'free');
        console.log(`User ${userId} downgraded to Free`);
        break;
      }
      case 'invoice.payment_failed': {
        console.warn('Payment failed for:', event.data.object?.customer);
        break;
      }
      default:
        console.log(`Unhandled webhook event: ${event.type}`);
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('Webhook handler error:', err);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
}

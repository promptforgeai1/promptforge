// /api/create-checkout-session.js
// PromptForge AI — Stripe Checkout Endpoint
// Creates a Stripe checkout session for Pro subscription (£29/month)

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const priceId   = process.env.STRIPE_PRICE_ID;

  if (!stripeKey) return res.status(500).json({ error: 'Payment service not configured' });
  if (!priceId)   return res.status(500).json({ error: 'Price not configured' });

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  const { userId = 'anonymous', email = '' } = body;

  // Base URL — always use the live domain
  const baseUrl = 'https://promptforge-black-rho.vercel.app';

  try {
    const params = new URLSearchParams({
      'payment_method_types[]': 'card',
      'mode': 'subscription',
      'line_items[0][price]': priceId,
      'line_items[0][quantity]': '1',
      'success_url': `${baseUrl}/?session_id={CHECKOUT_SESSION_ID}&upgraded=true`,
      'cancel_url': `${baseUrl}/`,
      'metadata[userId]': userId,
      'allow_promotion_codes': 'true',
      'billing_address_collection': 'auto',
    });

    if (email) params.append('customer_email', email);

    const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    const session = await stripeRes.json();

    if (!stripeRes.ok) {
      console.error('Stripe error:', session);
      return res.status(502).json({ error: session?.error?.message || 'Payment session creation failed' });
    }

    return res.status(200).json({ url: session.url, sessionId: session.id });

  } catch (err) {
    console.error('Checkout session error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

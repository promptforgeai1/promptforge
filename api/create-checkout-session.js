// /api/create-checkout-session.js
// PromptForge AI — Stripe Checkout Endpoint
// Creates a Stripe checkout session for Pro subscription (£19/month)

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return res.status(500).json({ error: 'Payment service not configured' });
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  const { userId = 'anonymous', email = '' } = body;

  // Build Stripe checkout session via API
  try {
    const params = new URLSearchParams({
      'payment_method_types[]': 'card',
      'mode': 'subscription',
      'line_items[0][price]': process.env.STRIPE_PRICE_ID || '',
      'success_url': `${process.env.NEXT_PUBLIC_URL || 'https://promptforge.ai'}/success?session_id={CHECKOUT_SESSION_ID}`,
      'cancel_url': `${process.env.NEXT_PUBLIC_URL || 'https://promptforge.ai'}`,
      'metadata[userId]': userId,
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

    if (!stripeRes.ok) {
      const err = await stripeRes.json().catch(() => ({}));
      console.error('Stripe error:', err);
      return res.status(502).json({ error: 'Payment session creation failed' });
    }

    const session = await stripeRes.json();
    return res.status(200).json({ url: session.url, sessionId: session.id });

  } catch (err) {
    console.error('Checkout session error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

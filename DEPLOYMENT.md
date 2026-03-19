# PromptForge AI — Complete Deployment Guide
# Follow these steps in order. Takes approximately 30–45 minutes total.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WHAT YOU HAVE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

promptforge/
├── public/
│   └── index.html              ← Your frontend (no API keys, fully secure)
├── api/
│   ├── generate.js             ← Main AI generation endpoint
│   ├── create-checkout-session.js  ← Stripe payment endpoint
│   └── webhook.js              ← Stripe subscription updates
├── vercel.json                 ← Vercel routing config
├── supabase-setup.sql          ← Database schema
├── .env.example                ← All environment variables you need
└── DEPLOYMENT.md               ← This file


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 1 — GET YOUR ANTHROPIC API KEY (5 minutes)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Go to https://console.anthropic.com
2. Sign up or log in
3. Click "API Keys" in the left sidebar
4. Click "Create Key"
5. Copy the key (starts with sk-ant-)
6. Save it — you only see it once

This is your ANTHROPIC_API_KEY.
Model used: claude-3-7-sonnet-20250219
Cost: approximately £0.008–0.025 per generation.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 2 — SET UP SUPABASE (10 minutes)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Go to https://supabase.com and create a free account
2. Click "New Project"
   - Name: promptforge
   - Database password: choose a strong password (save it)
   - Region: choose closest to your users (Europe West for UK)
3. Wait for project to start (~2 minutes)
4. Go to SQL Editor (left sidebar)
5. Click "New Query"
6. Open supabase-setup.sql from this folder
7. Paste the entire contents into the editor
8. Click "Run"
   - You should see: "users table | 0" and "generation_logs table | 0"
9. Get your credentials:
   - Go to Settings → API
   - Copy "Project URL" → this is your SUPABASE_URL
   - Copy "service_role" key (under Project API Keys) → this is your SUPABASE_SERVICE_KEY
   
⚠️  Use the SERVICE ROLE key (not the anon key) for the backend.
    The service role key bypasses RLS and is for server-side use only.
    Never put the service role key in your frontend.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 3 — SET UP STRIPE (10 minutes)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Go to https://stripe.com and create an account
2. Complete business verification (required to accept payments)
3. In the Stripe Dashboard:

   CREATE YOUR PRODUCT:
   - Go to Products → Add Product
   - Name: "PromptForge Pro"
   - Description: "Unlimited AI content generation"
   - Pricing model: Recurring
   - Price: £19.00 GBP
   - Billing period: Monthly
   - Click Save
   - Copy the Price ID (starts with price_) → this is your STRIPE_PRICE_ID

   GET YOUR API KEY:
   - Go to Developers → API Keys
   - Copy "Secret key" (starts with sk_live_ for live, sk_test_ for testing)
   - This is your STRIPE_SECRET_KEY
   - For initial testing use sk_test_ key first

   SET UP WEBHOOK:
   - Go to Developers → Webhooks → Add Endpoint
   - Endpoint URL: https://your-domain.com/api/webhook
   - Events to listen to:
     ✓ checkout.session.completed
     ✓ customer.subscription.deleted
     ✓ customer.subscription.paused
     ✓ invoice.payment_failed
   - Click Add Endpoint
   - Copy "Signing secret" → this is your STRIPE_WEBHOOK_SECRET


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 4 — DEPLOY TO VERCEL (10 minutes)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

OPTION A — Deploy via GitHub (recommended, enables auto-deploy):

1. Create a free GitHub account at https://github.com
2. Create a new repository called "promptforge"
3. Upload your project files:
   - Go to your new repo
   - Click "Add file" → "Upload files"
   - Upload ALL files maintaining the folder structure:
     public/index.html
     api/generate.js
     api/create-checkout-session.js
     api/webhook.js
     vercel.json
4. Go to https://vercel.com and sign up (free)
5. Click "Add New Project"
6. Import your GitHub repository
7. Click Deploy (Vercel auto-detects the config)

OPTION B — Deploy directly (faster, no GitHub needed):

1. Go to https://vercel.com and sign up
2. Install Vercel CLI: npm install -g vercel
3. Open terminal in your promptforge folder
4. Run: vercel
5. Follow the prompts


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 5 — ADD ENVIRONMENT VARIABLES TO VERCEL (5 minutes)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Go to your project in Vercel Dashboard
2. Click Settings → Environment Variables
3. Add each variable (copy from .env.example):

   Name                          Value
   ─────────────────────────────────────────────────────
   ANTHROPIC_API_KEY             sk-ant-your-key
   SUPABASE_URL                  https://xxx.supabase.co
   SUPABASE_SERVICE_KEY          eyJ...your-service-key
   STRIPE_SECRET_KEY             sk_live_...
   STRIPE_PRICE_ID               price_...
   STRIPE_WEBHOOK_SECRET         whsec_...
   NEXT_PUBLIC_URL               https://your-domain.com

4. Make sure each variable is set for: Production, Preview, Development
5. Click Save
6. Go to Deployments → click the three dots on latest → Redeploy
   (Vercel needs a redeploy to pick up new environment variables)


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 6 — ADD YOUR CUSTOM DOMAIN (5 minutes)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. In Vercel Dashboard → Settings → Domains
2. Add your domain (e.g. promptforge.ai)
3. Vercel gives you DNS records to add at your domain registrar
4. Update NEXT_PUBLIC_URL in Environment Variables to your domain
5. Redeploy


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 7 — TEST EVERYTHING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TEST 1 — Generation works:
□ Go to your live URL
□ Open Surprise Me
□ Click Generate Full Package
□ Output appears in the right panel
□ Free tier locked section appears at the bottom

TEST 2 — Rate limiting works:
□ Generate 5 times
□ 6th attempt should open the Pro modal

TEST 3 — Stripe checkout works:
□ Click Upgrade to Pro
□ Click the upgrade button in the modal
□ Should redirect to Stripe checkout page
□ Use test card: 4242 4242 4242 4242, any future date, any CVC

TEST 4 — All 7 generators work:
□ Make Money — fill topic + audience + goal
□ Short-Form Video — fill topic + platform
□ Sales & Marketing — fill product + audience
□ Chibi Character — fill character type + format
□ Viral Story — fill story type
□ Smart Image — fill concept

TEST 5 — Security check:
□ Open browser DevTools → Network tab
□ Click Generate
□ Find the /api/generate request
□ Check the Request Payload — it should contain type, inputs, tier, userId
□ It should NOT contain any API keys or system prompts


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MONTHLY COSTS AT SCALE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Service          Free tier            Paid
─────────────────────────────────────────────────────
Vercel           Unlimited deploys    £0 (hobby is free)
Supabase         500MB, 50k rows      £0 (free tier sufficient to start)
Anthropic API    Pay per use          ~£50–100/month at 100 active users (claude-3-7-sonnet)
Stripe           No monthly fee       1.4% + 20p per transaction (UK)

At 100 Pro subscribers (£19/month):
Revenue:  £1,900/month
API cost: ~£60/month  
Stripe:   ~£47/month
Hosting:  £0
──────────────────────
Net:      ~£1,793/month


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TROUBLESHOOTING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

"Generation service temporarily unavailable"
→ Check ANTHROPIC_API_KEY is set correctly in Vercel
→ Check Vercel Function Logs (Dashboard → Functions)

"Payment session creation failed"  
→ Check STRIPE_SECRET_KEY and STRIPE_PRICE_ID are set
→ Ensure your Stripe account is verified

Rate limit not working
→ The in-memory store resets on serverless cold starts
→ For production: connect Supabase to /api/generate for persistent tracking
→ See api/generate.js comments for Supabase integration point

Outputs not rendering correctly
→ Check browser console for JS errors
→ The output parser expects ALL CAPS section headers followed by a colon
→ This is enforced by the system prompts in api/generate.js


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NEXT STEPS AFTER LAUNCH
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Add Supabase to api/generate.js for persistent rate limiting
2. Add email auth (Supabase Auth) so users have real accounts
3. Enable "Save Prompts" feature using generation_logs table
4. Add PostHog analytics to track which generators are used most
5. Set up Stripe customer portal for subscription management

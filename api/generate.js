// /api/generate.js
// PromptForge AI — Secure Backend Generation Endpoint
// All Claude API calls happen here. No keys ever reach the frontend.

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-6';
const FREE_MAX_TOKENS = 1200;
const PRO_MAX_TOKENS = 4000;

// ─── IN-MEMORY RATE LIMITER ──────────────────────────────────────────────────
// For production: replace with Supabase or Redis
const rateLimitStore = new Map();

function checkRateLimit(userId, tier) {
  if (tier === 'pro') return { allowed: true, used: 0, limit: Infinity };
  const key = `${userId}_${new Date().toDateString()}`;
  const used = rateLimitStore.get(key) || 0;
  const limit = 5;
  if (used >= limit) return { allowed: false, used, limit };
  rateLimitStore.set(key, used + 1);
  // Clean old keys periodically
  if (rateLimitStore.size > 10000) {
    const today = new Date().toDateString();
    for (const [k] of rateLimitStore) {
      if (!k.endsWith(today)) rateLimitStore.delete(k);
    }
  }
  return { allowed: true, used: used + 1, limit };
}

// ─── SYSTEM PROMPTS ──────────────────────────────────────────────────────────

const BASE = `You are PromptForge AI — a premium AI Content & Income Engine built for creators, digital entrepreneurs, and serious content professionals. You operate at the level of a £500/hour professional consultant.

CORE RULES — NON-NEGOTIABLE:
- Always generate STRUCTURED outputs with section headers in ALL CAPS followed by a colon on its own line
- Never use filler phrases, generic openings, or lazy transitions
- Every output must be hyper-specific — no vague language, no placeholder thinking
- Write with the authority of someone who has mastered this craft for 10 years
- Every output must dramatically outperform what a user could produce manually in ChatGPT
- Every section must have genuine substance — never a single line unless it is a headline or hook
- Never begin with "In today's world", "Are you tired of", "Imagine if", or any cliché
- Format: section LABEL on its own line, content below, blank line between sections`;

const SYSTEM_PROMPTS = {

  surprise: BASE + `

YOU ARE OPERATING THE SURPRISE ME GENERATOR — THE SIGNATURE FEATURE AND HIGHEST STANDARD IN THE SYSTEM.

This must be extraordinary every single time. The concept must feel like it was conceived by a creative director who has studied what goes viral, what sells, and what moves people. Everything must be unified, thematically coherent, immediately deployable.

The output must make the user think: "I could never have come up with this alone."

UNIQUENESS RULE: Every run produces a completely different concept, theme, emotion, and structure.

FREE TIER: Deliver exactly:

CONCEPT TITLE:
[Compelling name for this content universe]

THE CORE IDEA:
[2–3 sentences: central theme, target emotion, viral mechanism]

STORY HOOK:
[Single most powerful opening line — immediate irresistible open loop]

STORY OPENING:
[First two paragraphs — gripping, specific, ends mid-tension to demonstrate value]

CAPTION PREVIEW:
[Strong ready-to-post caption — punchy, emotional, drives engagement]

PRO TIER: Deliver exactly:

CONCEPT TITLE:
[Compelling name]

THE CONCEPT:
[Core idea, target emotion, viral mechanism, why it will spread — strategic creative direction]

THE STORY — HOOK:
[Single most powerful opening line]

THE STORY — FULL NARRATIVE:
[Complete story: opening, rising tension, the turn, satisfying ending. Platform-adapted. Specific and emotional.]

THE STORY — CAPTION:
[Ready-to-post caption with engagement prompt]

THE CHIBI CHARACTER:
[Ultra-detailed Midjourney-formatted prompt that visually embodies this concept's mood and theme]

THE VIDEO SCRIPT — HOOK:
[Scroll-stopping opening line for the video version]

THE VIDEO SCRIPT — DIRECTOR'S NOTE:
[One sentence on energy, pacing, and tone for the whole piece]

THE VIDEO SCRIPT — FULL SCRIPT:
[Word-for-word script formatted for speaking — pauses marked in brackets]

SCENE BREAKDOWN:
[Each scene: Scene N | Visual description | Voiceover | On-screen text | Camera direction]

VIDEO CAPTION:
[Platform-native caption with hashtag strategy — niche, mid, and broad tiers]

ENGAGEMENT SUITE:
[Long-form caption for Instagram/Facebook + Short punchy version for TikTok/X + Engagement question]`,

  money: BASE + `

YOU ARE OPERATING THE MAKE MONEY GENERATOR.

Every idea must feel like it came from someone who has actually built and monetised this business model. Include market context, psychological buying triggers, realistic revenue projections, and sequenced action steps a real person can follow today.

FREE TIER: Deliver exactly:

IDEA 1 — TITLE:
[Specific compelling title]

THE OPPORTUNITY:
[Why this works right now, market timing, who is already winning with this]

DESCRIPTION:
[Detailed explanation of how this model works in practice]

MONETISATION METHOD:
[Exact pricing structure, platforms, delivery mechanism]

IDEA 2 — TITLE:
[Specific compelling title]

THE OPPORTUNITY:
[Market context and timing]

DESCRIPTION:
[How it works in practice]

MONETISATION METHOD:
[Pricing, platforms, delivery]

PRO TIER: Same structure for Ideas 1 and 2 but also include for each:

WHY IT WILL SELL:
[Psychological and market reasons — buyer motivation, demand signals, competitive gap]

REVENUE POTENTIAL:
[Realistic range with timeframe e.g. £500–£2,000/month within 90 days]

QUICK START STEPS:
[5 numbered specific sequenced actions starting from day one]

ONE THING MOST PEOPLE GET WRONG:
[The single mistake that kills this model and exactly how to avoid it]

Then add a complete third idea with all sections.`,

  video: BASE + `

YOU ARE OPERATING THE SHORT-FORM VIDEO GENERATOR.

Every script must open with a hook that creates genuine pattern interruption. Pacing must be platform-native — TikTok is faster and more raw, Reels is slightly more polished, Shorts rewards educational density. Scene directions must be specific enough that a complete beginner could film this alone.

FREE TIER: Deliver exactly:

HOOK:
[Scroll-stopping opening line — platform-native, creates immediate open loop]

SECONDARY HOOK OPTION:
[Alternative opening for A/B testing]

DIRECTOR'S NOTE:
[One sentence on the energy and pacing of the whole piece]

OPENING SCRIPT — 30 SECONDS:
[Word-for-word script for the first 30 seconds — formatted for speaking, pauses marked in brackets]

CAPTION:
[Platform-native caption with algorithm-aware hook]

PRO TIER: Everything above plus:

FULL SCRIPT:
[Complete word-for-word script — formatted for speaking, pauses and emphasis marked]

SCENE BREAKDOWN:
[Each scene: Scene N | Visual description | Voiceover | On-screen text | Camera direction | Pacing note]

CALL TO ACTION:
[Specific frictionless one clear action — platform-appropriate]

HASHTAG STRATEGY:
[Niche tags (high relevance) | Mid tags (growing) | Broad tags (reach)]

VIRAL POTENTIAL NOTE:
[One sentence on why this specific concept has strong sharing potential]`,

  sales: BASE + `

YOU ARE OPERATING THE SALES & MARKETING GENERATOR.

Every piece of copy must speak directly to the emotional and logical buying triggers of the specific audience at the specific price point. A £9 impulse product needs urgency and simplicity. A £500 high-ticket offer needs trust, authority, and objection handling. Copy must never be interchangeable.

FREE TIER: Deliver exactly:

PRIMARY HEADLINE:
[Benefit-driven, specific, emotionally resonant]

SECONDARY HEADLINE:
[Supports and deepens the primary — answers "so what?"]

OPENING HOOK:
[First sentence that creates immediate identification]

BODY COPY PREVIEW:
[3–4 lines of the persuasion arc — enough to demonstrate quality]

PRO TIER: Everything above plus:

FULL BODY COPY:
[Complete persuasion arc: problem agitation → solution → proof → offer]

KEY BENEFITS:
[3–5 bullet points written as outcomes not features]

OBJECTION HANDLER:
[Preemptive answer to the most common buying hesitation]

SOCIAL PROOF PLACEHOLDER:
[Exact format for a testimonial that would work perfectly here]

CALL TO ACTION:
[Primary CTA — specific, action-oriented, urgency-appropriate]

AD VERSION:
[Condensed to 3–4 lines for paid social]

CAPTION VERSION:
[Organic social adaptation with native hook and engagement element]`,

  chibi: BASE + `

YOU ARE OPERATING THE CHIBI CHARACTER GENERATOR.

Every prompt must read like it was written by a professional AI artist with deep knowledge of the chosen platform's rendering engine. Every element must work together as a unified visual direction.

FREE TIER: Deliver exactly:

CHIBI PROMPT:
[Character type, mood, outfit, and primary style — structured and specific]

PRO TIER: Deliver exactly:

FULL CHARACTER PROMPT:
[Complete tool-formatted prompt: character description (face, hair, eyes, skin), outfit (fabric, colour, detail, accessories), facial expression (micro-expression level), pose and body language, lighting setup (source, direction, colour temperature), environment/background, rendering style, quality modifier stack. Formatted with correct syntax for the chosen tool.]

VARIATION PROMPT:
[Alternative version — different mood, setting, or outfit — equally detailed]`,

  story: BASE + `

YOU ARE OPERATING THE VIRAL STORY GENERATOR.

Every story must open with a hook that creates an immediate open loop. Pacing must match the platform. The ending must deliver — emotionally, with a twist, or with a revelation that recontextualises everything. Never resolve too early. Never explain the emotion — make the reader feel it.

FREE TIER: Deliver exactly:

HOOK:
[Single most powerful opening line — immediate irresistible open loop]

STORY OPENING:
[First two paragraphs — setup and rising tension. Ends deliberately mid-tension.]

PRO TIER: Everything above plus:

RISING TENSION:
[The complication that makes the reader lean in and commit]

THE TURN:
[The moment everything changes — specific, surprising, earned]

THE ENDING:
[The payoff — matched to the chosen ending style, emotionally satisfying]

PLATFORM DELIVERY NOTE:
[One sentence on how to deliver this on the chosen platform]

CAPTION:
[Ready-to-post caption with engagement prompt]

RE-HOOK:
[Second version of the opening line for A/B testing]`,

  image: BASE + `

YOU ARE OPERATING THE SMART IMAGE GENERATOR.

Every prompt must function as a complete creative brief. Style selection must be intentional. Technical parameters must be specific enough to produce consistent high-quality results.

Style intelligence — apply if no style given:
Children/playful → Pixar 3D | Luxury → cinematic realism | Fantasy → detailed digital art | Emotion → soft painterly | Urban → editorial photography | Surreal → digital surrealism

FREE TIER: Deliver exactly:

IMAGE PROMPT:
[Subject, mood, basic style, and primary lighting — specific enough to produce a good result]

PRO TIER: Deliver exactly:

FULL IMAGE PROMPT:
[Complete prompt: subject, environment, lighting (source, direction, colour temperature), camera perspective (lens, angle, depth of field), artistic style, colour palette, rendering details, quality modifier stack. Formatted for the intended use.]

MOOD & ATMOSPHERE:
[One sentence capturing the precise feeling of the finished image]

STYLE RATIONALE:
[One sentence explaining why this style was chosen]`
};

// ─── INPUT VALIDATION ────────────────────────────────────────────────────────

function validateInput(type, inputs) {
  const required = {
    surprise: [],
    money: ['topic', 'audience'],
    video: ['topic', 'platform'],
    sales: ['product', 'audience'],
    chibi: ['characterType', 'format'],
    story: ['storyType'],
    image: ['concept']
  };
  const fields = required[type] || [];
  for (const field of fields) {
    if (!inputs[field] || !inputs[field].trim()) {
      return { valid: false, error: `Missing required field: ${field}` };
    }
  }
  return { valid: true };
}

// ─── USER MESSAGE BUILDER ─────────────────────────────────────────────────────

function buildUserMessage(type, inputs, tier) {
  const T = tier === 'pro' ? 'PRO' : 'FREE';
  const suffix = `\n\nGenerate the ${T === 'PRO' ? 'complete Pro' : 'Free preview'} output now.`;

  const builders = {
    surprise: () =>
      `TIER: ${T}\nVIBE OR THEME: ${inputs.vibe || 'AI-selected — choose a trending high-emotion concept'}${suffix}`,

    money: () =>
      `TIER: ${T}\nTOPIC/NICHE: ${inputs.topic}\nTARGET AUDIENCE: ${inputs.audience}\nGOAL: ${inputs.goal || 'Most impactful goal for this niche'}\nBUDGET/RESOURCES: ${inputs.budget || 'Minimal resources, assume bootstrapped'}${suffix}`,

    video: () =>
      `TIER: ${T}\nTOPIC: ${inputs.topic}\nPLATFORM: ${inputs.platform}\nSTYLE: ${inputs.style || 'AI-selected best style'}\nGOAL: ${inputs.goal || 'Maximum viral potential'}${suffix}`,

    sales: () =>
      `TIER: ${T}\nPRODUCT/SERVICE: ${inputs.product}\nTARGET AUDIENCE: ${inputs.audience}\nTONE: ${inputs.tone || 'AI-selected optimal tone'}\nPRICE POINT: ${inputs.price || 'Mid-range'}${suffix}`,

    chibi: () =>
      `TIER: ${T}\nCHARACTER TYPE: ${inputs.characterType}\nMOOD: ${inputs.mood || 'Cute / Happy'}\nOUTFIT: ${inputs.outfit || 'AI-selected best outfit'}\nSTYLE INTENSITY: ${inputs.intensity || 'Ultra-detailed / Cinematic'}\nOUTPUT FORMAT: ${inputs.format}${suffix}`,

    story: () =>
      `TIER: ${T}\nSTORY TYPE: ${inputs.storyType}\nMOOD: ${inputs.mood || 'AI-selected best mood'}\nENDING STYLE: ${inputs.ending || 'Shocking twist'}\nTARGET PLATFORM: ${inputs.platform || 'Instagram'}${suffix}`,

    image: () =>
      `TIER: ${T}\nCONCEPT: ${inputs.concept}\nSTYLE: ${inputs.style || 'AI-selected — apply style intelligence rules'}\nMOOD: ${inputs.mood || 'AI-selected best mood'}\nINTENDED USE: ${inputs.use || 'AI image generation'}${suffix}`
  };

  return builders[type] ? builders[type]() : null;
}

// ─── MAIN HANDLER ─────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY not set');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  const { type, inputs = {}, tier = 'free', userId = 'anonymous' } = body;

  // Validate generator type
  const validTypes = ['surprise', 'money', 'video', 'sales', 'chibi', 'story', 'image'];
  if (!validTypes.includes(type)) {
    return res.status(400).json({ error: 'Invalid generator type' });
  }

  // Validate inputs
  const validation = validateInput(type, inputs);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.error });
  }

  // Rate limiting
  const rateCheck = checkRateLimit(userId, tier);
  if (!rateCheck.allowed) {
    return res.status(429).json({
      error: 'Daily generation limit reached',
      used: rateCheck.used,
      limit: rateCheck.limit,
      upgradeRequired: true
    });
  }

  // Build message
  const userMessage = buildUserMessage(type, inputs, tier);
  if (!userMessage) {
    return res.status(400).json({ error: 'Could not build message for this generator' });
  }

  const systemPrompt = SYSTEM_PROMPTS[type];
  const maxTokens = tier === 'pro' ? PRO_MAX_TOKENS : FREE_MAX_TOKENS;

  // Call Claude API
  try {
    const response = await fetch(ANTHROPIC_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }]
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      console.error('Claude API error:', response.status, errData);
      return res.status(502).json({ error: 'Generation service temporarily unavailable' });
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || '';

    if (!text) {
      return res.status(502).json({ error: 'Empty response from generation service' });
    }

    return res.status(200).json({
      output: text,
      tier,
      used: rateCheck.used,
      limit: rateCheck.limit
    });

  } catch (err) {
    console.error('Generate handler error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

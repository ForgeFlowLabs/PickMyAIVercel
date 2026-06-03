// Rate limiting store (in-memory, resets per serverless instance)
const rateLimit = new Map();

function checkRateLimit(ip) {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute window
  const maxRequests = 10; // max 10 requests per minute per IP

  if (!rateLimit.has(ip)) {
    rateLimit.set(ip, { count: 1, start: now });
    return true;
  }

  const record = rateLimit.get(ip);
  if (now - record.start > windowMs) {
    rateLimit.set(ip, { count: 1, start: now });
    return true;
  }

  if (record.count >= maxRequests) return false;
  record.count++;
  return true;
}

function sanitize(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/[<>"'`]/g, '').trim().slice(0, 100);
}

const VALID = {
  goal: ['writing','code','images','automation','research','video','marketing','customer','data','productivity','hr','finance'],
  budget: ['free','under20','20to100','100to500','500plus'],
  skill: ['beginner','intermediate','advanced'],
  industry: ['entertainment','ecommerce','tech','agency','smallbiz','creative','healthcare','education','finance','realestate','nonprofit','other'],
  integration: ['yes','no','unsure']
};

const MODELS = [
  { id: 'gemini-2.5-flash-lite', search: false },
  { id: 'gemini-2.5-flash',      search: true  },
  { id: 'gemini-2.0-flash',      search: false },
  { id: 'gemini-1.5-flash',      search: false },
];

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || 'https://pick-my-ai-vercel.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Rate limiting
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: 'Too many requests. Please wait a minute.' });
  }

  // API key check
  const GEMINI_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_KEY) return res.status(500).json({ error: 'Service configuration error' });

  // Parse + validate body
  let body;
  try { body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body; }
  catch { return res.status(400).json({ error: 'Invalid request body' }); }

  const { goal, budget, skill, industry, integration } = body;

  // Strict whitelist validation — reject anything unexpected
  const fields = { goal, budget, skill, industry, integration };
  for (const [key, val] of Object.entries(fields)) {
    const clean = sanitize(val);
    if (!VALID[key] || !VALID[key].includes(clean)) {
      return res.status(400).json({ error: `Invalid value for ${key}` });
    }
    fields[key] = clean;
  }

  const prompt = `You are PickMyAI. Recommend exactly 3 real AI tools for this user.

Profile: goal=${fields.goal}, budget=${fields.budget}, skill=${fields.skill}, industry=${fields.industry}, integration=${fields.integration}

RULES:
- Only recommend tools that directly address the goal: "${fields.goal}"
- Tools must match the budget tier: "${fields.budget}"
- Tool 1 = best overall match, Tool 2 = best budget/simpler option, Tool 3 = most powerful option
- Each "why" must be one specific sentence for this exact profile
- Realistic pricing only
- If budget is "free", tools 1 and 2 must have a genuinely useful free tier

Return ONLY valid JSON array, no markdown, no explanation:
[{"name":"...","tagline":"max 7 words","why":"one sentence","price":"...","badge":"best match","url":"https://..."},{"name":"...","tagline":"...","why":"...","price":"...","badge":"budget pick","url":"https://..."},{"name":"...","tagline":"...","why":"...","price":"...","badge":"power user","url":"https://..."}]`;

  const errors = [];

  for (const model of MODELS) {
    try {
      const body = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.6, maxOutputTokens: 600 }
      };
      if (model.search) body.tools = [{ googleSearch: {} }];

      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model.id}:generateContent?key=${GEMINI_KEY}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
      );

      const data = await r.json();

      if (!r.ok) {
        errors.push(`${model.id}: ${data.error?.message || r.status}`);
        continue;
      }

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      if (!text) { errors.push(`${model.id}: empty`); continue; }

      const clean = text.replace(/```json|```/g, '').trim();
      const tools = JSON.parse(clean);

      if (!Array.isArray(tools) || tools.length !== 3) {
        errors.push(`${model.id}: invalid shape`);
        continue;
      }

      // Validate each tool has required fields
      const required = ['name', 'tagline', 'why', 'price', 'badge', 'url'];
      const valid = tools.every(t => required.every(k => typeof t[k] === 'string' && t[k].length > 0));
      if (!valid) { errors.push(`${model.id}: missing fields`); continue; }

      // Sanitize output before sending to client
      const safe = tools.map(t => ({
        name: sanitize(t.name).slice(0, 60),
        tagline: sanitize(t.tagline).slice(0, 80),
        why: sanitize(t.why).slice(0, 300),
        price: sanitize(t.price).slice(0, 40),
        badge: ['best match','budget pick','power user'].includes(t.badge) ? t.badge : 'best match',
        url: t.url.startsWith('https://') ? t.url.slice(0, 200) : 'https://pickmyai.vercel.app'
      }));

      res.setHeader('X-Model-Used', model.id);
      return res.status(200).json(safe);

    } catch (err) {
      errors.push(`${model.id}: ${err.message}`);
      continue;
    }
  }

  return res.status(503).json({ error: 'Service temporarily unavailable', details: errors });
}

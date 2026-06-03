export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { goal, budget, skill, industry, integration } = req.body;

  if (!goal || !budget || !skill || !industry || !integration) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const GEMINI_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_KEY) {
    return res.status(500).json({ error: 'GEMINI_API_KEY not set in environment variables' });
  }

  const prompt = `You are PickMyAI, an expert AI tool recommender. Recommend exactly 3 real, well-known AI tools for this user.

User profile:
- Goal: ${goal}
- Budget: ${budget}
- Skill level: ${skill}
- Industry: ${industry}
- Integration preference: ${integration}

Rules:
- Only recommend real, existing, popular AI tools
- Tool 1 = absolute best match for this profile
- Tool 2 = best budget-conscious or simpler alternative
- Tool 3 = most powerful/advanced option for power users
- "why" = one specific sentence explaining why it fits THIS exact user profile
- Price should be realistic (e.g. "Free", "Free / $20/mo", "$49/mo")

Respond ONLY with a valid JSON array. No markdown, no explanation, no code fences:
[{"name":"...","tagline":"max 7 words","why":"one specific sentence","price":"...","badge":"best match","url":"https://..."},{"name":"...","tagline":"...","why":"...","price":"...","badge":"budget pick","url":"https://..."},{"name":"...","tagline":"...","why":"...","price":"...","badge":"power user","url":"https://..."}]`;

  // Models in priority order based on your actual rate limits
  // RPM / RPD limits from your Google AI Studio account
  const models = [
    'gemini-3.1-flash-lite-preview',  // 15 RPM, 500 RPD — highest limits
    'gemini-2.5-flash-lite',           // 10 RPM, 20 RPD
    'gemini-2.5-flash',                // 5 RPM, 20 RPD — with search grounding
    'gemini-3.5-flash',                // 5 RPM, 20 RPD
    'gemini-3-flash',                  // 5 RPM, 20 RPD
    'gemini-2.0-flash',                // fallback
    'gemini-1.5-flash',                // classic reliable fallback
  ];

  const errors = [];

  for (const model of models) {
    try {
      const body = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 800 }
      };

      // Add Google Search grounding for models that support it
      const supportsSearch = model.startsWith('gemini-2.5') || model.startsWith('gemini-2');
      if (supportsSearch) {
        body.tools = [{ googleSearch: {} }];
      }

      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        }
      );

      const data = await r.json();

      // Check for rate limit or quota errors — try next model
      if (!r.ok) {
        const errMsg = data.error?.message || `HTTP ${r.status}`;
        errors.push(`${model}: ${errMsg}`);
        continue;
      }

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      if (!text) {
        errors.push(`${model}: empty response`);
        continue;
      }

      const clean = text.replace(/```json|```/g, '').trim();
      const tools = JSON.parse(clean);

      if (Array.isArray(tools) && tools.length === 3) {
        res.setHeader('X-Model-Used', model);
        return res.status(200).json(tools);
      }

      errors.push(`${model}: invalid shape`);
    } catch (err) {
      errors.push(`${model}: ${err.message}`);
      continue;
    }
  }

  // All Gemini models failed
  return res.status(503).json({ error: 'All models failed', details: errors });
}

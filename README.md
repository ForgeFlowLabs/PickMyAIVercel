# PickMyAI 🎯

**Find your perfect AI tool in under 2 minutes.**

Answer 5 questions. Get 3 hand-picked AI tools matched to your goal, budget, skill level, and industry — powered by Google Gemini AI.

---

## 🚀 Deploy to Vercel

1. Push this folder to GitHub
2. Go to vercel.com → New Project → Import from GitHub
3. Add environment variable: `GEMINI_API_KEY` = your key from aistudio.google.com
4. Deploy

---

## 📁 File Structure

```
pickmyai/
├── index.html          ← Main app
├── about.html          ← About page
├── privacy.html        ← Privacy policy
├── terms.html          ← Terms of use
├── 404.html            ← Error page
├── robots.txt          ← SEO
├── sitemap.xml         ← SEO
├── vercel.json         ← Vercel config
├── css/
│   └── style.css       ← Shared design system
├── js/
│   └── main.js         ← Shared JavaScript
└── api/
    └── recommend.js    ← Gemini API proxy (serverless)
```

---

## 🔑 Environment Variables

| Variable | Description |
|---|---|
| `GEMINI_API_KEY` | Google AI Studio API key (required) |

---

Built with ♥ by PickMyAI

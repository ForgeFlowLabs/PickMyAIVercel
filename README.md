# PickMyAI 🎯

**Find your perfect AI tool in under 2 minutes.**

Answer 5 questions. Get 3 hand-picked AI tools matched to your needs, budget, and skill level — powered by Gemini AI.

---

## 🚀 Deploy to Vercel in 3 steps

1. Push this folder to a GitHub repo
2. Go to vercel.com → Add New Project → Import from GitHub → select PickMyAI
3. Add environment variable: `GEMINI_API_KEY` = your key
4. Click Deploy — live in 30 seconds

---

## 🔑 Get your Gemini API Key

1. Go to https://aistudio.google.com/apikey
2. Click "Create API Key"
3. Copy it (starts with AIza...)
4. Paste into Vercel environment variables as `GEMINI_API_KEY`

---

## 📁 File Structure

```
pickmyai/
├── index.html          ← Main site
├── brand.html          ← Internal brand guide (do not deploy publicly)
├── vercel.json         ← Vercel config
├── api/
│   └── recommend.js    ← Serverless function (Gemini API proxy)
└── README.md
```

---

## 💰 Monetisation Roadmap

- **Affiliate links** — earn commission when users sign up via your links
- **Email list** — weekly AI digest newsletter (connect Resend or Mailchimp)
- **Premium tier** — saved results, comparison tool, personalised alerts
- **API access** — let other developers use your recommendation engine

---

Built with ♥ by PickMyAI

// Apply saved themes immediately to avoid flash
(function() {
  try {
    var ct = localStorage.getItem('pickmyai_color') || 'violet';
    var dt = localStorage.getItem('pickmyai_theme') ||
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme-color', ct);
    document.documentElement.setAttribute('data-theme', dt);
  } catch(e) {}
})();

/* ============================================================
   PickMyAI — Shared JavaScript v1
   ============================================================ */

// ── THEME TOGGLE ──────────────────────────────────────────────
function initTheme() {
  const btn = document.getElementById('theme-btn');
  if (!btn) return;
  const update = () => {
    const dark = document.documentElement.getAttribute('data-theme') === 'dark';
    btn.textContent = dark ? '☀️' : '🌙';
  };
  update();
  btn.addEventListener('click', () => {
    const dark = document.documentElement.getAttribute('data-theme') === 'dark';
    const next = dark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('pickmyai_theme', next); } catch(e) {}
    update();
  });
}

// ── FAQ ACCORDION ─────────────────────────────────────────────
function initFAQ() {
  document.querySelectorAll('.faq-item').forEach(item => {
    const q = item.querySelector('.faq-q');
    if (!q) return;
    q.addEventListener('click', () => {
      const open = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));
      if (!open) item.classList.add('open');
    });
  });
}

// ── EMAIL CAPTURE ─────────────────────────────────────────────
function initEmail() {
  const btn = document.getElementById('email-btn');
  const input = document.getElementById('email-in');
  const ok = document.getElementById('email-ok');
  if (!btn || !input) return;
  btn.addEventListener('click', () => {
    if (!input.value.includes('@')) { input.focus(); return; }
    if (ok) { ok.style.display = 'block'; ok.textContent = '✓ You\'re on the list!'; }
    input.value = '';
    // TODO: connect to Resend/Mailchimp
  });
  input.addEventListener('keydown', e => { if (e.key === 'Enter') btn.click(); });
}

// ── SHARE RESULTS ─────────────────────────────────────────────
function shareResults() {
  const url = window.location.href;
  if (navigator.share) {
    navigator.share({ title: 'My AI tool matches from PickMyAI', url });
  } else {
    navigator.clipboard.writeText(url).then(() => {
      const btn = document.querySelector('.btn-share');
      if (btn) { btn.textContent = '✓ Copied!'; setTimeout(() => btn.textContent = 'Share results →', 2000); }
    });
  }
}

// ── URL SYNC (shareable results) ──────────────────────────────
function syncURL(answers) {
  try {
    const params = new URLSearchParams(answers);
    const newURL = window.location.pathname + '?' + params.toString();
    window.history.replaceState({}, '', newURL);
  } catch(e) {}
}

function getURLAnswers() {
  try {
    const params = new URLSearchParams(window.location.search);
    const a = {};
    ['goal','budget','skill','industry','integration'].forEach(k => {
      if (params.get(k)) a[k] = params.get(k);
    });
    return Object.keys(a).length === 5 ? a : null;
  } catch(e) { return null; }
}

// ── FALLBACK TOOL DATABASE ────────────────────────────────────
const FALLBACKS = {
  writing:[
    {name:'Claude',tagline:'Best AI for thoughtful writing',why:'Excels at long-form, nuanced content across any format or tone.',price:'Free / $20/mo',badge:'best match',url:'https://claude.ai'},
    {name:'Jasper',tagline:'Marketing copy at scale',why:'Built for marketing teams with brand voice training and ready-made templates.',price:'$39/mo',badge:'budget pick',url:'https://jasper.ai'},
    {name:'Notion AI',tagline:'Write inside your workspace',why:'Combines AI writing, notes, and project management in one place.',price:'$8/mo add-on',badge:'power user',url:'https://notion.so'}
  ],
  code:[
    {name:'Cursor',tagline:'AI-native code editor',why:'Understands your entire codebase for smarter context-aware completions.',price:'Free / $20/mo',badge:'best match',url:'https://cursor.sh'},
    {name:'GitHub Copilot',tagline:'Code completion everywhere',why:'Works inside VS Code and integrates seamlessly with your git workflow.',price:'$10/mo',badge:'budget pick',url:'https://github.com/features/copilot'},
    {name:'v0 by Vercel',tagline:'Generate UI with prompts',why:'Turn text descriptions into production-ready React components instantly.',price:'Free / $20/mo',badge:'power user',url:'https://v0.dev'}
  ],
  images:[
    {name:'Midjourney',tagline:'Highest quality AI imagery',why:'Produces the most stunning professional images of any AI tool available.',price:'$10/mo',badge:'best match',url:'https://midjourney.com'},
    {name:'Adobe Firefly',tagline:'Safe for commercial use',why:'Trained on licensed content so output is legally safe for business.',price:'Free / $5/mo',badge:'budget pick',url:'https://firefly.adobe.com'},
    {name:'DALL-E 3',tagline:'Best prompt understanding',why:'Follows complex creative instructions more accurately than competitors.',price:'In ChatGPT Plus',badge:'power user',url:'https://openai.com/dall-e-3'}
  ],
  automation:[
    {name:'Zapier',tagline:'Connect 6,000+ apps instantly',why:'No-code automation with thousands of pre-built templates for any workflow.',price:'Free / $20/mo',badge:'best match',url:'https://zapier.com'},
    {name:'Make',tagline:'Visual workflow builder',why:'More powerful than Zapier with better pricing for complex automations.',price:'Free / $9/mo',badge:'budget pick',url:'https://make.com'},
    {name:'n8n',tagline:'Self-hosted automation',why:'Unlimited workflows and full control — perfect for technical teams.',price:'Free (self-host)',badge:'power user',url:'https://n8n.io'}
  ],
  research:[
    {name:'Perplexity AI',tagline:'AI search with live citations',why:'Answers research questions with real verifiable sources you can check.',price:'Free / $20/mo',badge:'best match',url:'https://perplexity.ai'},
    {name:'NotebookLM',tagline:'AI over your own documents',why:'Upload your sources and ask questions directly — ideal for deep research.',price:'Free',badge:'budget pick',url:'https://notebooklm.google.com'},
    {name:'Elicit',tagline:'Academic research assistant',why:'Designed for systematic research with intelligent paper summaries.',price:'Free / $12/mo',badge:'power user',url:'https://elicit.com'}
  ],
  video:[
    {name:'Descript',tagline:'Edit video by editing text',why:'Remove filler words and cut scenes just by editing a transcript.',price:'Free / $24/mo',badge:'best match',url:'https://descript.com'},
    {name:'CapCut AI',tagline:'Easy AI video editing',why:'Free and beginner-friendly with powerful auto-captions and effects.',price:'Free / $8/mo',badge:'budget pick',url:'https://capcut.com'},
    {name:'Runway',tagline:'Next-gen AI video generation',why:'Generate and edit video from text prompts — the most capable AI video tool.',price:'$15/mo',badge:'power user',url:'https://runwayml.com'}
  ],
  marketing:[
    {name:'Surfer SEO',tagline:'AI content optimisation',why:'Ranks your content higher by analysing top-performing pages in your niche.',price:'$89/mo',badge:'best match',url:'https://surferseo.com'},
    {name:'Copy.ai',tagline:'Marketing copy in seconds',why:'Generates ads, emails, and landing pages with minimal prompting.',price:'Free / $36/mo',badge:'budget pick',url:'https://copy.ai'},
    {name:'Semrush AI',tagline:'Full-stack marketing intelligence',why:'Combines SEO, ads, social, and content tools in one powerful platform.',price:'$129/mo',badge:'power user',url:'https://semrush.com'}
  ],
  customer:[
    {name:'Intercom Fin',tagline:'AI customer support agent',why:'Resolves up to 50% of support tickets automatically with high accuracy.',price:'$39/mo',badge:'best match',url:'https://intercom.com'},
    {name:'Tidio',tagline:'Affordable AI chat for SMBs',why:'Easy-to-set-up live chat and AI bot combo built for small businesses.',price:'Free / $19/mo',badge:'budget pick',url:'https://tidio.com'},
    {name:'Zendesk AI',tagline:'Enterprise support automation',why:'Deep CRM integration with intelligent ticket routing and agent assist.',price:'$55/mo',badge:'power user',url:'https://zendesk.com'}
  ],
  data:[
    {name:'Julius AI',tagline:'Chat with your data',why:'Upload any spreadsheet and ask questions in plain English instantly.',price:'Free / $20/mo',badge:'best match',url:'https://julius.ai'},
    {name:'ChatCSV',tagline:'Instant CSV analysis',why:'The fastest way to extract insights from a CSV without writing code.',price:'Free / $10/mo',badge:'budget pick',url:'https://chatcsv.co'},
    {name:'Hex',tagline:'Collaborative data notebooks',why:'Combines SQL, Python, and AI in one notebook for serious data teams.',price:'Free / $24/mo',badge:'power user',url:'https://hex.tech'}
  ],
  productivity:[
    {name:'Notion AI',tagline:'Think, write, plan in one app',why:'Integrates AI directly into your notes, docs, and project management.',price:'$8/mo add-on',badge:'best match',url:'https://notion.so'},
    {name:'Otter.ai',tagline:'AI meeting notes',why:'Transcribes and summarises meetings automatically so you stay focused.',price:'Free / $10/mo',badge:'budget pick',url:'https://otter.ai'},
    {name:'Mem',tagline:'Self-organising AI workspace',why:'Automatically connects your notes and surfaces context when you need it.',price:'$14/mo',badge:'power user',url:'https://mem.ai'}
  ],
  hr:[
    {name:'Manatal',tagline:'AI recruitment platform',why:'Scores candidates automatically and integrates with all major job boards.',price:'$15/mo',badge:'best match',url:'https://manatal.com'},
    {name:'Kickresume',tagline:'AI CV and screening tools',why:'Helps both candidates and HR teams create and screen CVs with AI.',price:'Free / $10/mo',badge:'budget pick',url:'https://kickresume.com'},
    {name:'Leena AI',tagline:'Enterprise HR automation',why:'Automates onboarding, policies, and employee queries at enterprise scale.',price:'Custom',badge:'power user',url:'https://leena.ai'}
  ],
  finance:[
    {name:'Vic.ai',tagline:'AI accounts payable',why:'Automates invoice processing and approvals with industry-leading accuracy.',price:'Custom',badge:'best match',url:'https://vic.ai'},
    {name:'Dext',tagline:'Receipt and expense capture',why:'Snap receipts and auto-sync to your accounting software in seconds.',price:'$20/mo',badge:'budget pick',url:'https://dext.com'},
    {name:'Kira Systems',tagline:'AI contract analysis',why:'Reviews contracts and extracts key clauses in seconds for legal teams.',price:'Custom',badge:'power user',url:'https://kirasystems.com'}
  ]
};

// ── MATCHER ENGINE ────────────────────────────────────────────
const A = {};
let currentStep = 1;

function pick(btn, key, val) {
  btn.closest('.opts, .opts-2').querySelectorAll('.opt').forEach(b => b.classList.remove('sel'));
  btn.classList.add('sel');
  A[key] = val;
  const nb = document.getElementById('next' + currentStep);
  if (nb) nb.disabled = false;
}

function showStep(n) {
  document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
  document.getElementById('loading').classList.remove('on');
  document.getElementById('results').classList.remove('on');
  const el = document.getElementById('q' + n);
  if (el) el.classList.add('active');
  document.getElementById('prog-fill').style.width = (n / 5 * 100) + '%';
  currentStep = n;
  document.getElementById('matcher-card').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function nextStep(from) {
  const keys = ['goal','budget','skill','industry','integration'];
  if (!A[keys[from-1]]) return;
  showStep(from + 1);
}
function backStep(from) { showStep(from - 1); }

async function getResults() {
  if (!A.integration) return;
  syncURL(A);
  document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
  document.getElementById('results').classList.remove('on');
  document.getElementById('loading').classList.add('on');
  document.getElementById('prog-fill').style.width = '100%';

  let tools = null;
  try {
    const r = await fetch('/api/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(A)
    });
    const data = await r.json();
    if (Array.isArray(data) && data.length === 3) tools = data;
  } catch(e) { tools = null; }

  renderResults(tools || FALLBACKS[A.goal] || FALLBACKS.writing);
}

function renderResults(tools) {
  document.getElementById('loading').classList.remove('on');
  document.getElementById('results').classList.add('on');
  const goalLabels = {
    writing:'writing', code:'coding', images:'images', automation:'automation',
    research:'research', video:'video', marketing:'marketing', customer:'customer support',
    data:'data', productivity:'productivity', hr:'HR', finance:'finance'
  };
  const sub = document.getElementById('results-sub');
  if (sub) sub.textContent = `${goalLabels[A.goal]||A.goal} · ${A.budget} · ${A.skill}`;

  const badgeClass = { 'best match':'badge-best', 'budget pick':'badge-alt', 'power user':'badge-power' };
  document.getElementById('tool-list').innerHTML = tools.map((t, i) => `
    <div class="tool-item ${i===0?'top':''}">
      <div class="tool-head">
        <div>
          <div class="tool-name">${t.name}</div>
          <div class="tool-tag">${t.tagline}</div>
        </div>
        <span class="badge ${i===0?'badge-best':(badgeClass[t.badge]||'badge-power')}">${t.badge}</span>
      </div>
      <div class="tool-why">${t.why}</div>
      <div class="tool-foot">
        <span class="tool-price">${t.price}</span>
        <a href="${t.url}" target="_blank" rel="noopener noreferrer" class="tool-link">
          Visit site <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 10L10 2M10 2H5M10 2v5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </a>
      </div>
    </div>`).join('');

  document.getElementById('matcher-card').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function restartMatcher() {
  Object.keys(A).forEach(k => delete A[k]);
  document.querySelectorAll('.opt').forEach(o => o.classList.remove('sel'));
  document.querySelectorAll('[id^="next"]').forEach(b => { if(b.tagName==='BUTTON') b.disabled = true; });
  document.getElementById('results').classList.remove('on');
  document.getElementById('loading').classList.remove('on');
  try { window.history.replaceState({}, '', window.location.pathname); } catch(e) {}
  showStep(1);
}

// ── INIT ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initFAQ();
  initEmail();

  // Auto-run results if URL has all answers
  const urlAnswers = getURLAnswers();
  if (urlAnswers && document.getElementById('matcher-card')) {
    Object.assign(A, urlAnswers);
    // Pre-select options
    Object.entries(urlAnswers).forEach(([key, val]) => {
      const btn = document.querySelector(`[onclick*="'${key}','${val}'"]`);
      if (btn) btn.classList.add('sel');
    });
    getResults();
  }
});

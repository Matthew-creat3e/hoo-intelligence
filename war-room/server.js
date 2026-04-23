import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';

const app = express();
app.use(cors());
app.use(express.json());

// ============================================================
// PATH CONFIG — Matthew's actual file locations
// ============================================================
const PATHS = {
  vault: 'C:/Users/Matth/Documents/HOO-Vault',
  hoo: 'C:/Users/Matth/hoo-workspace',
  workspace: 'C:/Users/Matth/hoo-workspace',
};

const VAULT = {
  leads: path.join(PATHS.vault, '02-Leads'),
  builds: path.join(PATHS.vault, '04-Builds'),
  sessions: path.join(PATHS.vault, '01-Sessions'),
  learning: path.join(PATHS.vault, '07-Learning'),
  ideas: path.join(PATHS.vault, '05-Ideas'),
  strategy: path.join(PATHS.vault, '06-Strategy'),
};

const ENGINE = {
  data: path.join(PATHS.hoo, 'engine/data'),
  hunts: path.join(PATHS.hoo, 'engine/hunts'),
  outreach: path.join(PATHS.hoo, 'engine/outreach/templates'),
};

// ============================================================
// HELPERS
// ============================================================

function readFileSync(filepath) {
  try {
    return fs.readFileSync(filepath, 'utf-8');
  } catch {
    return null;
  }
}

function readDir(dir) {
  try {
    return fs.readdirSync(dir).filter(f => f.endsWith('.md') || f.endsWith('.json') || f.endsWith('.html'));
  } catch {
    return [];
  }
}

function parseLeadMd(content, filename) {
  const lines = content.split('\n');
  const lead = { filename, raw: content };

  // Parse name from H1
  const h1 = lines.find(l => l.startsWith('# '));
  if (h1) lead.name = h1.replace('# ', '').trim();

  // Parse fields
  const fieldMap = {
    'Phone': 'phone',
    'Email': 'email',
    'Address': 'address',
    'Website': 'website',
    'Google Rating': 'rating',
    'Score': 'score',
  };

  for (const line of lines) {
    for (const [key, prop] of Object.entries(fieldMap)) {
      if (line.includes(`**${key}:**`)) {
        const val = line.split(`**${key}:**`)[1]?.trim();
        if (val && val !== '—' && val !== 'Unknown' && val !== 'N/A' && !val.toLowerCase().includes('none found')) {
          lead[prop] = val;
        }
      }
    }
  }

  // Parse pipeline stage
  const stageLine = lines.find(l => l.includes('`') && l.includes('DISCOVERED'));
  if (stageLine) {
    const match = stageLine.match(/`(\w+)`/);
    if (match) lead.stage = match[1];
  }

  // Parse tags
  const tagLine = lines.find(l => l.startsWith('#') && !l.startsWith('# ') && !l.startsWith('## '));
  if (tagLine) {
    lead.tags = tagLine.match(/#[\w-]+/g) || [];
  }

  return lead;
}

function parseBuildMd(content, filename) {
  const lines = content.split('\n');
  const build = { filename, raw: content };

  const h1 = lines.find(l => l.startsWith('# '));
  if (h1) build.name = h1.replace('# ', '').trim();

  // Parse status
  const statusLine = lines.find(l => l.includes('## Status:'));
  if (statusLine) build.status = statusLine.replace('## Status:', '').trim();

  // Parse file path
  const fileLine = lines.find(l => l.startsWith('`') && l.includes('outputs/'));
  if (fileLine) build.file = fileLine.replace(/`/g, '').trim();

  // Parse tags
  const tagLine = lines.find(l => l.startsWith('#') && !l.startsWith('# ') && !l.startsWith('## '));
  if (tagLine) build.tags = tagLine.match(/#[\w-]+/g) || [];

  return build;
}

// ============================================================
// API ROUTES
// ============================================================

// --- LEADS (from Obsidian vault) ---
app.get('/api/leads', (req, res) => {
  const files = readDir(VAULT.leads);
  const leads = files
    .filter(f => f.endsWith('.md'))
    .map(f => {
      const content = readFileSync(path.join(VAULT.leads, f));
      return content ? parseLeadMd(content, f) : null;
    })
    .filter(Boolean);

  res.json({ leads, count: leads.length, source: VAULT.leads });
});

// --- BUILDS (from Obsidian vault + actual demo files) ---
app.get('/api/builds', (req, res) => {
  // Vault build notes
  const vaultFiles = readDir(VAULT.builds);
  const vaultBuilds = vaultFiles
    .filter(f => f.endsWith('.md'))
    .map(f => {
      const content = readFileSync(path.join(VAULT.builds, f));
      return content ? parseBuildMd(content, f) : null;
    })
    .filter(Boolean);

  // Actual demo HTML files
  const demoDir = path.join(PATHS.hoo, 'outputs/demos');
  const demoFiles = readDir(demoDir).filter(f => f.endsWith('.html'));
  const demos = demoFiles.map(f => {
    const stat = fs.statSync(path.join(demoDir, f));
    const version = f.match(/v(\d+)/)?.[1] || '?';
    return {
      filename: f,
      version: `v${version}`,
      size: Math.round(stat.size / 1024) + 'KB',
      modified: stat.mtime.toISOString(),
    };
  });

  // HOO interactive demo
  const hooDemo = path.join(PATHS.hoo, 'hoo-demo/index.html');
  const hooDemoExists = fs.existsSync(hooDemo);

  res.json({
    vaultBuilds,
    demos,
    hooDemoLive: hooDemoExists,
    totalDemos: demoFiles.length,
    v7Count: demoFiles.filter(f => f.includes('v7')).length,
    v6Count: demoFiles.filter(f => f.includes('v6')).length,
    v5Count: demoFiles.filter(f => f.includes('v5')).length,
    v4Count: demoFiles.filter(f => f.includes('v4')).length,
  });
});

// --- PIPELINE STATS (from engine/data/learning.json) ---
app.get('/api/pipeline', (req, res) => {
  const learning = readFileSync(path.join(ENGINE.data, 'learning.json'));
  const signals = readFileSync(path.join(ENGINE.data, 'signal-weights.json'));

  let pipelineStats = null;
  let industryStats = null;
  let signalWeights = null;

  if (learning) {
    const data = JSON.parse(learning);
    pipelineStats = data.pipeline_stats;
    industryStats = data.by_industry;
  }

  if (signals) {
    signalWeights = JSON.parse(signals);
  }

  res.json({ pipelineStats, industryStats, signalWeights });
});

// --- STATE (live from STATE.md) ---
app.get('/api/state', (req, res) => {
  const state = readFileSync(path.join(PATHS.hoo, 'STATE.md'));
  if (!state) return res.json({ error: 'STATE.md not found' });

  // Parse key fields
  const lines = state.split('\n');

  // Last updated
  const updatedLine = lines.find(l => l.match(/^\d{4}-\d{2}-\d{2}/));
  const lastUpdated = updatedLine?.trim() || 'unknown';

  // Current focus
  const focusIdx = lines.findIndex(l => l.includes('## Current Focus'));
  const focus = focusIdx >= 0 ? lines[focusIdx + 1]?.trim() : '';

  // What's next
  const nextIdx = lines.findIndex(l => l.includes("## What's Next"));
  const nextItems = [];
  if (nextIdx >= 0) {
    for (let i = nextIdx + 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('##')) break;
      if (line.startsWith('-') || line.match(/^\d+\./)) {
        nextItems.push(line.replace(/^[\d.\-*]+\s*/, '').replace(/\*\*/g, ''));
      }
    }
  }

  // Blockers
  const blockerIdx = lines.findIndex(l => l.includes('## Blockers'));
  const blockers = [];
  if (blockerIdx >= 0) {
    for (let i = blockerIdx + 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('##')) break;
      if (line.startsWith('-')) {
        blockers.push(line.replace(/^-\s*/, ''));
      }
    }
  }

  // Pipeline metrics
  const metrics = {};
  const metricLines = lines.filter(l => l.includes('|') && l.includes('|'));
  for (const ml of metricLines) {
    const parts = ml.split('|').map(p => p.trim()).filter(Boolean);
    if (parts.length === 2 && !parts[0].includes('---')) {
      metrics[parts[0]] = parts[1];
    }
  }

  res.json({
    raw: state,
    lastUpdated,
    focus,
    nextItems,
    blockers,
    metrics,
  });
});

// --- SESSIONS (recent from Obsidian vault) ---
app.get('/api/sessions', (req, res) => {
  const files = readDir(VAULT.sessions)
    .filter(f => f.endsWith('.md'))
    .sort()
    .reverse()
    .slice(0, 10);

  const sessions = files.map(f => {
    const content = readFileSync(path.join(VAULT.sessions, f));
    const lines = content?.split('\n') || [];
    const h1 = lines.find(l => l.startsWith('# '));
    const whatHappened = lines.find(l => l.includes('## What Happened'));
    const nextLine = whatHappened ? lines[lines.indexOf(whatHappened) + 1]?.trim() : '';

    return {
      filename: f,
      date: f.replace('.md', ''),
      title: h1?.replace('# ', '').trim() || f,
      summary: nextLine || '',
    };
  });

  res.json({ sessions, count: sessions.length });
});

// --- OUTREACH TEMPLATES ---
app.get('/api/outreach', (req, res) => {
  const files = readDir(ENGINE.outreach);
  const templates = files.map(f => {
    const content = readFileSync(path.join(ENGINE.outreach, f));
    const lines = content?.split('\n') || [];
    const h1 = lines.find(l => l.startsWith('# '));
    return {
      filename: f,
      name: h1?.replace('# ', '').trim() || f,
    };
  });

  res.json({ templates, count: templates.length });
});

// --- FULL DASHBOARD STATE (everything combined for AI context) ---
app.get('/api/dashboard', async (req, res) => {
  // Aggregate all endpoints into one state object
  const [leads, builds, pipeline, state, sessions] = await Promise.all([
    fetch('http://localhost:3001/api/leads').then(r => r.json()).catch(() => null),
    fetch('http://localhost:3001/api/builds').then(r => r.json()).catch(() => null),
    fetch('http://localhost:3001/api/pipeline').then(r => r.json()).catch(() => null),
    fetch('http://localhost:3001/api/state').then(r => r.json()).catch(() => null),
    fetch('http://localhost:3001/api/sessions').then(r => r.json()).catch(() => null),
  ]);

  res.json({
    operator: 'Matthew Herrman',
    system: 'THE LION\'S DEN V8',
    timestamp: new Date().toISOString(),
    leads,
    builds,
    pipeline,
    state,
    sessions,
  });
});

// ============================================================
// ACTION ENDPOINTS — the dashboard DOES things
// ============================================================

// --- UPDATE LEAD PIPELINE STAGE ---
// Rewrites the stage marker in a lead's .md file in the vault
app.post('/api/lead/:filename/stage', (req, res) => {
  const { filename } = req.params;
  const { stage } = req.body;
  const validStages = ['DISCOVERED', 'ENRICHED', 'SCORED', 'DEMO_BUILT', 'OUTREACH_SENT', 'RESPONDED', 'CLOSED'];

  if (!validStages.includes(stage)) {
    return res.status(400).json({ error: `Invalid stage. Must be one of: ${validStages.join(', ')}` });
  }

  const filepath = path.join(VAULT.leads, filename);
  const content = readFileSync(filepath);
  if (!content) return res.status(404).json({ error: 'Lead not found' });

  // Rewrite the entire pipeline line — canonical stage order, backticks only on active stage
  const allStages = ['DISCOVERED', 'ENRICHED', 'SCORED', 'DEMO_BUILT', 'OUTREACH_SENT', 'RESPONDED', 'CLOSED'];
  const newPipelineLine = allStages
    .map(s => s === stage ? `\`${s}\`` : s)
    .join(' → ');

  // Find the pipeline line and replace it in full (matches any line containing DISCOVERED...CLOSED)
  const lines = content.split('\n');
  let replaced = false;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('DISCOVERED') && lines[i].includes('CLOSED')) {
      lines[i] = newPipelineLine;
      replaced = true;
      break;
    }
  }

  if (!replaced) return res.status(400).json({ error: 'No pipeline line found in lead' });

  try {
    fs.writeFileSync(filepath, lines.join('\n'), 'utf-8');
    res.json({ success: true, filename, stage, message: `${filename} → ${stage}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- LOG OUTREACH TO LEAD ---
// Appends a row to the Outreach History table in the lead's .md
app.post('/api/lead/:filename/outreach', (req, res) => {
  const { filename } = req.params;
  const { template, response, date } = req.body;

  const filepath = path.join(VAULT.leads, filename);
  const content = readFileSync(filepath);
  if (!content) return res.status(404).json({ error: 'Lead not found' });

  const today = date || new Date().toISOString().split('T')[0];
  const newRow = `| ${today} | ${template || '—'} | ${response || 'Awaiting'} |`;

  // Find the Outreach History table and append a row
  const lines = content.split('\n');
  const headerIdx = lines.findIndex(l => l.includes('## Outreach History'));
  if (headerIdx === -1) return res.status(400).json({ error: 'No Outreach History section found' });

  // Find the placeholder row (| — | Not yet contacted | — |) and replace, OR insert after the separator row
  let inserted = false;
  for (let i = headerIdx; i < lines.length; i++) {
    if (lines[i].includes('Not yet contacted')) {
      lines[i] = newRow;
      inserted = true;
      break;
    }
    // Stop at next heading
    if (i > headerIdx && lines[i].startsWith('## ')) {
      lines.splice(i, 0, newRow);
      inserted = true;
      break;
    }
  }

  if (!inserted) {
    // Just append after the separator row
    for (let i = headerIdx; i < lines.length; i++) {
      if (lines[i].startsWith('|---')) {
        lines.splice(i + 1, 0, newRow);
        inserted = true;
        break;
      }
    }
  }

  try {
    fs.writeFileSync(filepath, lines.join('\n'), 'utf-8');
    res.json({ success: true, filename, row: newRow });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- DRAFT OUTREACH EMAIL (via Ollama) ---
// Uses lead data + template to draft a personalized email
app.post('/api/outreach/draft', async (req, res) => {
  const { filename, template, model } = req.body;

  const leadPath = path.join(VAULT.leads, filename);
  const leadContent = readFileSync(leadPath);
  if (!leadContent) return res.status(404).json({ error: 'Lead not found' });

  const lead = parseLeadMd(leadContent, filename);

  // Load template if specified
  let templateContent = '';
  if (template) {
    const templatePath = path.join(ENGINE.outreach, template);
    templateContent = readFileSync(templatePath) || '';
  }

  const systemPrompt = `You are drafting a cold outreach email for HOO (herrmanonlineoutlook.com) — Matthew Herrman's web agency. The pitch is "Build the site free. Pay only if you love it."

RULES:
- Plain text only (no HTML, no markdown)
- Short — under 120 words
- No fake reviews, no free shipping claims
- Reference their business by name
- Mention the "pay only if you love it" angle
- End with: a simple question they can answer with yes/no
- No "I hope this finds you well" fluff
- Sign off: Matthew | HOO | (804) 957-1003 | herrmanonlineoutlook@gmail.com

Output ONLY the email body. No subject line header, no "Here's the draft:" preamble.`;

  const userPrompt = `LEAD:
Business: ${lead.name}
Location: ${lead.address || 'unknown'}
Phone: ${lead.phone || 'unknown'}
Website: ${lead.website || 'None'}
Signal: ${lead.website ? 'Has website but likely weak' : 'No website detected'}

${templateContent ? `TEMPLATE (use as loose guide):\n${templateContent}` : ''}

Draft the email.`;

  try {
    const ollamaRes = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model || 'qwen3:8b',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        stream: false,
      }),
    });

    if (!ollamaRes.ok) {
      return res.status(500).json({ error: `Ollama returned ${ollamaRes.status}` });
    }

    const data = await ollamaRes.json();
    const draft = data.message?.content || '';

    res.json({
      success: true,
      lead: lead.name,
      email: lead.email || null,
      draft,
      subject: `Quick question about ${lead.name}`,
    });
  } catch (err) {
    res.status(500).json({ error: `AI draft failed: ${err.message}` });
  }
});

// --- SEND OUTREACH (stub — requires Gmail/n8n webhook config) ---
// Returns what WOULD be sent. Real sending needs n8n webhook URL.
app.post('/api/outreach/send', async (req, res) => {
  const { filename, to, subject, body, dryRun = true } = req.body;

  // DRY RUN by default per CLAUDE.md rule #2
  if (dryRun) {
    return res.json({
      dryRun: true,
      preview: { to, subject, body },
      message: 'DRY RUN — set dryRun:false + configure n8n webhook to send live',
    });
  }

  // TODO: wire to n8n webhook for Gmail send
  // const webhookUrl = process.env.N8N_GMAIL_WEBHOOK;
  // if (!webhookUrl) return res.status(500).json({ error: 'N8N_GMAIL_WEBHOOK not configured' });
  // const n8nRes = await fetch(webhookUrl, {method: 'POST', body: JSON.stringify({to, subject, body})});

  res.status(501).json({
    error: 'LIVE SEND NOT YET CONFIGURED',
    help: 'Configure n8n Gmail webhook URL in backend .env, then re-enable this endpoint',
  });
});

// --- RUN AEO AUDIT ON A URL ---
// Fetches URL, analyzes for AEO readiness signals, returns score + findings
app.post('/api/audit/run', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'url required' });

  try {
    const pageRes = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (HOO-Audit/1.0)' } });
    if (!pageRes.ok) {
      return res.json({ url, reachable: false, status: pageRes.status, score: 0 });
    }
    const html = await pageRes.text();

    // Quick AEO signal checks
    const signals = {
      hasH1: /<h1[^>]*>/i.test(html),
      hasH2: (html.match(/<h2[^>]*>/gi) || []).length,
      hasQuestionHeadings: /<h[1-3][^>]*>[^<]*\?[^<]*<\/h[1-3]>/i.test(html),
      hasSchema: /application\/ld\+json/i.test(html),
      hasFAQSchema: /"@type"\s*:\s*"FAQPage"/i.test(html),
      hasAltText: (html.match(/<img[^>]+alt="[^"]+"/gi) || []).length,
      hasMetaDesc: /<meta[^>]+name="description"/i.test(html),
      hasViewport: /<meta[^>]+name="viewport"/i.test(html),
      hasPhone: /tel:[+0-9()\-\s]+/i.test(html),
      hasAddress: /itemprop="address"|class="[^"]*address[^"]*"/i.test(html),
      byteSize: html.length,
    };

    // Score: 10 points per positive signal, max 100
    let score = 0;
    if (signals.hasH1) score += 10;
    if (signals.hasH2 >= 3) score += 10;
    if (signals.hasQuestionHeadings) score += 15;
    if (signals.hasSchema) score += 10;
    if (signals.hasFAQSchema) score += 15;
    if (signals.hasAltText >= 3) score += 10;
    if (signals.hasMetaDesc) score += 10;
    if (signals.hasViewport) score += 5;
    if (signals.hasPhone) score += 10;
    if (signals.hasAddress) score += 5;

    const findings = [];
    if (!signals.hasH1) findings.push('MISSING H1 tag');
    if (signals.hasH2 < 3) findings.push(`Only ${signals.hasH2} H2 tags (need 3+ for AEO)`);
    if (!signals.hasQuestionHeadings) findings.push('NO question-format headings (AEO-critical)');
    if (!signals.hasSchema) findings.push('NO JSON-LD schema');
    if (!signals.hasFAQSchema) findings.push('NO FAQPage schema (major AEO miss)');
    if (signals.hasAltText < 3) findings.push(`Only ${signals.hasAltText} images with alt text`);
    if (!signals.hasMetaDesc) findings.push('MISSING meta description');
    if (!signals.hasPhone) findings.push('NO click-to-call phone link');

    res.json({
      url,
      reachable: true,
      score,
      tier: score >= 80 ? 'STRONG' : score >= 60 ? 'OK' : score >= 40 ? 'WEAK' : 'CRITICAL',
      signals,
      findings,
    });
  } catch (err) {
    res.status(500).json({ error: err.message, url });
  }
});

// --- RUN HUNT (stub — calls Python hunt skill) ---
// Queues a hunt. Real hunting happens via hunt-google.py in engine/hunts/
app.post('/api/hunt/run', async (req, res) => {
  const { industry, city } = req.body;
  if (!industry || !city) return res.status(400).json({ error: 'industry and city required' });

  // Check if hunt-google.py exists
  const huntScript = path.join(PATHS.hoo, 'engine/hunts/hunt-google.py');
  // Actually check the skills folder for hunt workers
  const huntWorker = path.join(PATHS.hoo, '.claude/skills/hunt/workers/hunt-google.py');
  const script = fs.existsSync(huntScript) ? huntScript : fs.existsSync(huntWorker) ? huntWorker : null;

  if (!script) {
    return res.status(501).json({
      error: 'Hunt script not found',
      searched: [huntScript, huntWorker],
      help: 'Run hunt manually via /hunt skill, or configure script path',
    });
  }

  // Spawn the hunt as a child process
  const { spawn } = await import('child_process');
  const proc = spawn('python', [script, '--industry', industry, '--city', city], {
    cwd: PATHS.hoo,
  });

  let stdout = '';
  let stderr = '';
  proc.stdout.on('data', d => stdout += d.toString());
  proc.stderr.on('data', d => stderr += d.toString());

  proc.on('close', (code) => {
    res.json({
      success: code === 0,
      exitCode: code,
      industry,
      city,
      stdout: stdout.slice(-2000),
      stderr: stderr.slice(-2000),
    });
  });

  proc.on('error', (err) => {
    res.status(500).json({ error: err.message });
  });
});

// --- CREATE LEAD (manual entry from dashboard) ---
// Writes a new lead .md to the vault
app.post('/api/lead/create', (req, res) => {
  const { name, phone, email, address, website, score, industry, tags } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });

  const safeName = name.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '');
  const filename = `${safeName}.md`;
  const filepath = path.join(VAULT.leads, filename);

  if (fs.existsSync(filepath)) {
    return res.status(409).json({ error: 'Lead already exists', filename });
  }

  const tagLine = (tags || ['#lead', `#${industry || 'unknown'}`]).join(' ');
  const today = new Date().toISOString().split('T')[0];

  const content = `# ${name}
${tagLine}

---

## Business Info
- **Phone:** ${phone || '—'}
- **Email:** ${email || '—'}
- **Address:** ${address || '—'}
- **Website:** ${website || 'None found'}
- **Google Rating:** Unknown
- **Score:** ${score || 0} ${score >= 50 ? 'HOT' : score >= 30 ? 'WARM' : 'COLD'}

## Pipeline Stage
DISCOVERED → ENRICHED → \`SCORED\` → DEMO_BUILT → OUTREACH_SENT → RESPONDED → CLOSED

## Intel
- **Has website:** ${website ? 'Yes' : 'No'}
- **Mobile friendly:** Unknown
- **Social presence:** Unknown

## Outreach History
| Date | Template | Response |
|---|---|---|
| — | Not yet contacted | — |

## Notes
- Created via Lion's Den on ${today}

## Links
- Session created: [[01-Sessions/${today}]]
`;

  try {
    fs.writeFileSync(filepath, content, 'utf-8');
    res.json({ success: true, filename, filepath });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- UNIVERSAL COMMAND ROUTER ---
// Parses dashboard commands and routes to the right action endpoint
app.post('/api/command', async (req, res) => {
  const { cmd } = req.body;
  if (!cmd) return res.status(400).json({ error: 'cmd required' });

  const parts = cmd.trim().split(/\s+/);
  const command = parts[0].toLowerCase();
  const args = parts.slice(1);

  switch (command) {
    case '/hunt': {
      if (args.length < 2) return res.json({ error: 'Usage: /hunt <industry> <city>' });
      const [industry, ...cityParts] = args;
      const city = cityParts.join(' ');
      // Forward to hunt endpoint
      return res.json({ routed: '/api/hunt/run', body: { industry, city } });
    }
    case '/audit': {
      if (args.length < 1) return res.json({ error: 'Usage: /audit <url>' });
      return res.json({ routed: '/api/audit/run', body: { url: args[0] } });
    }
    case '/draft': {
      if (args.length < 1) return res.json({ error: 'Usage: /draft <lead-filename>' });
      return res.json({ routed: '/api/outreach/draft', body: { filename: args[0] } });
    }
    case '/stage': {
      if (args.length < 2) return res.json({ error: 'Usage: /stage <lead-filename> <STAGE>' });
      return res.json({ routed: '/api/lead/:filename/stage', body: { filename: args[0], stage: args[1] } });
    }
    default:
      return res.json({ error: `Unknown command: ${command}` });
  }
});

// --- HEALTH CHECK ---
app.get('/api/health', (req, res) => {
  const checks = {
    server: 'ONLINE',
    vault: fs.existsSync(PATHS.vault) ? 'CONNECTED' : 'MISSING',
    hoo: fs.existsSync(PATHS.hoo) ? 'CONNECTED' : 'MISSING',
    state: fs.existsSync(path.join(PATHS.hoo, 'STATE.md')) ? 'FOUND' : 'MISSING',
    leads: readDir(VAULT.leads).length,
    demos: readDir(path.join(PATHS.hoo, 'outputs/demos')).filter(f => f.endsWith('.html')).length,
  };

  res.json(checks);
});

// ============================================================
// FILE WATCHER — push updates when files change
// ============================================================
const WATCH_PATHS = [
  path.join(PATHS.hoo, 'STATE.md'),
  VAULT.leads,
  VAULT.builds,
  path.join(ENGINE.data, 'learning.json'),
];

// Simple last-modified tracking for polling
let lastModified = {};
function checkForChanges() {
  let changed = false;
  for (const p of WATCH_PATHS) {
    try {
      const stat = fs.statSync(p);
      const mtime = stat.mtime.getTime();
      if (lastModified[p] && lastModified[p] !== mtime) {
        changed = true;
      }
      lastModified[p] = mtime;
    } catch {
      // path doesn't exist
    }
  }
  return changed;
}

// Poll endpoint — dashboard calls this every 30s
app.get('/api/poll', (req, res) => {
  const changed = checkForChanges();
  res.json({ changed, timestamp: Date.now() });
});

// ============================================================
// START
// ============================================================
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`\n  LION'S DEN BACKEND — ONLINE`);
  console.log(`  http://localhost:${PORT}`);
  console.log(`\n  CONNECTED SOURCES:`);
  console.log(`    Vault:  ${PATHS.vault}`);
  console.log(`    HOO:    ${PATHS.hoo}`);
  console.log(`    Leads:  ${readDir(VAULT.leads).length} files`);
  console.log(`    Demos:  ${readDir(path.join(PATHS.hoo, 'outputs/demos')).filter(f => f.endsWith('.html')).length} files`);
  console.log(`    State:  ${fs.existsSync(path.join(PATHS.hoo, 'STATE.md')) ? 'FOUND' : 'MISSING'}`);
  console.log(`\n  ENDPOINTS:`);
  console.log(`    GET /api/leads      — Live leads from Obsidian`);
  console.log(`    GET /api/builds     — Build status + demo files`);
  console.log(`    GET /api/pipeline   — Pipeline stats from engine`);
  console.log(`    GET /api/state      — STATE.md parsed live`);
  console.log(`    GET /api/sessions   — Recent session logs`);
  console.log(`    GET /api/outreach   — Outreach templates`);
  console.log(`    GET /api/dashboard  — Full state for AI context`);
  console.log(`    GET /api/health     — System health check`);
  console.log(`    GET /api/poll       — Change detection\n`);

  // Init file watcher baselines
  checkForChanges();
});

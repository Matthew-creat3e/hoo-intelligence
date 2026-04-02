const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { execSync, spawn } = require('child_process');

const ROOT = path.join(__dirname, '..');
const APPROVALS_DIR = path.join(ROOT, 'engine', 'approvals');
const LEADS_DIR = path.join(ROOT, 'engine', 'leads');
const ENGINE_TOOLS = path.join(ROOT, 'engine', 'tools');

// Load .env from engine/tools
try { require(path.join(ENGINE_TOOLS, 'node_modules', 'dotenv')).config({ path: path.join(ENGINE_TOOLS, '.env') }); } catch {}

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    backgroundColor: '#050505',
    titleBarStyle: 'hiddenInset',
    webSecurity: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    },
    icon: path.join(__dirname, 'icon.png'),
    title: 'HOO Command Center'
  });
  win.loadFile(path.join(__dirname, 'index.html'));
}

// ── CORE FILE OPS ────────────────────────────────────────────────────────────
ipcMain.handle('read-file', (_, relPath) => {
  try { return fs.readFileSync(path.join(ROOT, relPath), 'utf8'); } catch { return null; }
});

ipcMain.handle('read-json', (_, relPath) => {
  try { return JSON.parse(fs.readFileSync(path.join(ROOT, relPath), 'utf8')); } catch { return null; }
});

ipcMain.handle('path-exists', (_, relPath) => fs.existsSync(path.join(ROOT, relPath)));

ipcMain.handle('list-files', (_, relPath) => {
  try { return fs.readdirSync(path.join(ROOT, relPath)); } catch { return []; }
});

ipcMain.handle('open-external', (_, url) => {
  require('electron').shell.openExternal(url);
});

// ── READ ALL APPROVALS ───────────────────────────────────────────────────────
ipcMain.handle('read-approvals', () => {
  try {
    if (!fs.existsSync(APPROVALS_DIR)) return [];
    return fs.readdirSync(APPROVALS_DIR)
      .filter(f => f.startsWith('APPROVAL-') && f.endsWith('.json'))
      .map(f => {
        try {
          const data = JSON.parse(fs.readFileSync(path.join(APPROVALS_DIR, f), 'utf8'));
          data._filename = f;
          return data;
        } catch { return null; }
      })
      .filter(Boolean);
  } catch { return []; }
});

// ── READ ALL LEADS ───────────────────────────────────────────────────────────
ipcMain.handle('read-leads', () => {
  try {
    if (!fs.existsSync(LEADS_DIR)) return [];
    return fs.readdirSync(LEADS_DIR)
      .filter(f => f.startsWith('LEAD-') && f.endsWith('.json'))
      .map(f => {
        try { return JSON.parse(fs.readFileSync(path.join(LEADS_DIR, f), 'utf8')); }
        catch { return null; }
      })
      .filter(Boolean);
  } catch { return []; }
});

// ── LOG A CALL ───────────────────────────────────────────────────────────────
// data: { outcome, objection, warmth, notes, email }
// outcome: reached, voicemail, no-answer, not-interested, send-demo
ipcMain.handle('log-call', (_, approvalFilename, data) => {
  try {
    const approvalPath = path.join(APPROVALS_DIR, approvalFilename);
    if (!fs.existsSync(approvalPath)) return { success: false, error: 'Not found' };

    const approval = JSON.parse(fs.readFileSync(approvalPath, 'utf8'));
    if (!approval.call_log) approval.call_log = [];

    const now = new Date();
    const entry = {
      date: now.toISOString(),
      display_date: now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }),
      outcome: data.outcome,
      objection: data.objection || 'none',
      warmth: data.warmth || 'unknown',
      notes: data.notes || ''
    };
    approval.call_log.push(entry);

    // Update email if provided
    if (data.email && data.email.includes('@')) {
      if (!approval.lead) approval.lead = {};
      approval.lead.email = data.email;
      // Also update lead file
      try {
        const leadFiles = fs.readdirSync(LEADS_DIR).filter(f => f.startsWith(approval.id + '-'));
        for (const lf of leadFiles) {
          const leadData = JSON.parse(fs.readFileSync(path.join(LEADS_DIR, lf), 'utf8'));
          leadData.email = data.email;
          fs.writeFileSync(path.join(LEADS_DIR, lf), JSON.stringify(leadData, null, 2), 'utf8');
        }
      } catch {}
    }

    // Update status based on outcome
    switch (data.outcome) {
      case 'reached':
        approval.status = 'reached';
        break;
      case 'voicemail':
        approval.status = 'callback';
        approval.callback_date = new Date(now.getTime() + 2 * 86400000).toISOString().split('T')[0];
        break;
      case 'no-answer':
        approval.status = 'callback';
        approval.callback_date = new Date(now.getTime() + 86400000).toISOString().split('T')[0];
        break;
      case 'not-interested':
        approval.status = 'dead';
        approval.dead_date = now.toISOString().split('T')[0];
        approval.dead_reason = data.objection || '';
        break;
      case 'send-demo':
        approval.status = 'reached';
        entry.outcome = 'reached-send-demo';
        break;
    }

    fs.writeFileSync(approvalPath, JSON.stringify(approval, null, 2), 'utf8');

    // Save call data to learning.json for stats
    try {
      const learnFile = path.join(ROOT, 'engine', 'data', 'learning.json');
      let learn = {};
      try { learn = JSON.parse(fs.readFileSync(learnFile, 'utf8')); } catch {}
      if (!learn.calls) learn.calls = [];
      learn.calls.push({
        date: now.toISOString(),
        industry: approval.lead?.industry || '',
        city: approval.lead?.city || '',
        outcome: data.outcome,
        objection: data.objection || 'none',
        warmth: data.warmth || 'unknown',
        hour: now.getHours(),
        day: now.toLocaleDateString('en-US', { weekday: 'long' })
      });
      fs.writeFileSync(learnFile, JSON.stringify(learn, null, 2), 'utf8');
    } catch {}

    return { success: true, approval };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// ── SEND DEMO EMAIL (post-call) ──────────────────────────────────────────────
ipcMain.handle('send-demo-email', async (_, approvalFilename, email) => {
  try {
    const approvalPath = path.join(APPROVALS_DIR, approvalFilename);
    const approval = JSON.parse(fs.readFileSync(approvalPath, 'utf8'));
    const lead = approval.lead || {};
    const biz = lead.business || 'your business';
    const ownerFirst = (lead.owner || '').split(' ')[0] || 'there';

    // Use provided email or lead's email
    const toEmail = email || (lead.email || '').trim();
    if (!toEmail || !toEmail.includes('@')) {
      return { success: false, error: 'No valid email address' };
    }

    // Update lead email if new one provided
    if (email && email !== lead.email) {
      approval.lead.email = email;
      try {
        const leadFiles = fs.readdirSync(LEADS_DIR).filter(f => f.startsWith(approval.id + '-'));
        for (const lf of leadFiles) {
          const ld = JSON.parse(fs.readFileSync(path.join(LEADS_DIR, lf), 'utf8'));
          ld.email = email;
          fs.writeFileSync(path.join(LEADS_DIR, lf), JSON.stringify(ld, null, 2), 'utf8');
        }
      } catch {}
    }

    // Build demo URL
    const cleanName = biz.replace(/[^a-zA-Z0-9\s]/g, '').split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
    const liveUrl = `https://matthew-creat3e.github.io/hoo-intelligence/demos/${cleanName}.html`;

    const subject = `Here's the website I built for ${biz}`;
    const bodyText = `Hey ${ownerFirst},

Great talking to you! As promised, here's the website I built for ${biz}:

${liveUrl}

Take a look on your phone too — it's fully mobile-ready.

If you love it, I'll get it live on your own domain for a flat fee. No monthly charges, no contracts. If it's not for you, no worries at all.

Let me know what you think!

- Matthew Herrman
HOO — Kansas City, MO
(804) 957-1003
herrmanonlineoutlook.com`;

    const nodemailer = require(path.join(ENGINE_TOOLS, 'node_modules', 'nodemailer'));
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD }
    });

    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      return { success: false, error: 'Missing GMAIL_USER or GMAIL_APP_PASSWORD in .env' };
    }

    const info = await transporter.sendMail({
      from: `"Matthew Herrman | HOO" <${process.env.GMAIL_USER}>`,
      to: toEmail,
      subject,
      text: bodyText,
    });

    // Update approval
    approval.email_sent = true;
    approval.email_sent_date = new Date().toISOString().split('T')[0];
    approval.status = 'demo-sent';
    const now = new Date();
    approval.follow_up_dates = [
      new Date(now.getTime() + 3 * 86400000).toISOString().split('T')[0],
      new Date(now.getTime() + 7 * 86400000).toISOString().split('T')[0],
      new Date(now.getTime() + 14 * 86400000).toISOString().split('T')[0],
    ];
    fs.writeFileSync(approvalPath, JSON.stringify(approval, null, 2), 'utf8');

    // Log to email-log.json
    const logFile = path.join(ROOT, 'engine', 'data', 'email-log.json');
    let log = [];
    try { log = JSON.parse(fs.readFileSync(logFile, 'utf8')); } catch {}
    log.push({
      date: new Date().toISOString(), lead: biz, id: approval.id, to: toEmail,
      subject, messageId: info.messageId, status: 'sent', demo_url: liveUrl,
    });
    fs.writeFileSync(logFile, JSON.stringify(log, null, 2), 'utf8');

    // Auto-push demo to GitHub Pages
    try {
      const demosDir = path.join(ROOT, 'demos');
      const demoSrc = path.join(ROOT, approval.demo_path || '');
      if (fs.existsSync(demoSrc)) {
        fs.copyFileSync(demoSrc, path.join(demosDir, `${cleanName}.html`));
        execSync('git add demos/', { cwd: ROOT });
        const gitStatus = execSync('git status --porcelain demos/', { cwd: ROOT, encoding: 'utf8' });
        if (gitStatus.trim()) {
          execSync(`git commit -m "deploy: ${cleanName} demo"`, { cwd: ROOT });
          execSync('git push origin master', { cwd: ROOT, timeout: 30000 });
        }
      }
    } catch {}

    return { success: true, business: biz, email: toEmail, messageId: info.messageId };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// ── LOG FOLLOW-UP ────────────────────────────────────────────────────────────
ipcMain.handle('log-followup', (_, approvalFilename, outcome, notes) => {
  try {
    const approvalPath = path.join(APPROVALS_DIR, approvalFilename);
    const approval = JSON.parse(fs.readFileSync(approvalPath, 'utf8'));

    if (!approval.followup_log) approval.followup_log = [];
    const now = new Date();
    approval.followup_log.push({
      date: now.toISOString(),
      display_date: now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      outcome, notes: notes || ''
    });

    if (outcome === 'interested') {
      approval.status = 'interested';
    } else if (outcome === 'not-interested') {
      approval.status = 'dead';
      approval.dead_date = now.toISOString().split('T')[0];
    } else if (outcome === 'no-response') {
      // Push next follow-up out 7 more days
      const nextDate = new Date(now.getTime() + 7 * 86400000).toISOString().split('T')[0];
      if (!approval.follow_up_dates) approval.follow_up_dates = [];
      approval.follow_up_dates.push(nextDate);
    }

    fs.writeFileSync(approvalPath, JSON.stringify(approval, null, 2), 'utf8');
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// ── RUN HUNT (spawns orchestrator as child process) ──────────────────────────
ipcMain.handle('run-hunt', (event, count, industry, city) => {
  return new Promise((resolve) => {
    const args = [path.join(ENGINE_TOOLS, 'pipeline-orchestrator.js'), 'run', `--count=${count || 4}`];

    const child = spawn('node', args, {
      cwd: ROOT,
      env: { ...process.env },
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let output = '';

    child.stdout.on('data', (data) => {
      const line = data.toString();
      output += line;
      // Send live updates to renderer
      BrowserWindow.getAllWindows().forEach(w => {
        w.webContents.send('hunt-log', line);
      });
    });

    child.stderr.on('data', (data) => {
      output += data.toString();
    });

    child.on('close', (code) => {
      resolve({ success: code === 0, output });
    });

    child.on('error', (err) => {
      resolve({ success: false, error: err.message, output });
    });
  });
});

// ── READ STATS (aggregated from call logs + approvals) ───────────────────────
ipcMain.handle('read-stats', () => {
  try {
    // Read learning.json for call data
    const learnFile = path.join(ROOT, 'engine', 'data', 'learning.json');
    let learn = {};
    try { learn = JSON.parse(fs.readFileSync(learnFile, 'utf8')); } catch {}
    const calls = learn.calls || [];

    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];

    // Read all approvals for pipeline stats
    let approvals = [];
    try {
      approvals = fs.readdirSync(APPROVALS_DIR)
        .filter(f => f.endsWith('.json'))
        .map(f => JSON.parse(fs.readFileSync(path.join(APPROVALS_DIR, f), 'utf8')));
    } catch {}

    const totalCalls = calls.length;
    const todayCalls = calls.filter(c => c.date && c.date.startsWith(today)).length;
    const weekCalls = calls.filter(c => c.date && c.date >= weekAgo).length;

    const reached = calls.filter(c => c.outcome === 'reached' || c.outcome === 'send-demo' || c.outcome === 'reached-send-demo').length;
    const voicemails = calls.filter(c => c.outcome === 'voicemail').length;
    const noAnswer = calls.filter(c => c.outcome === 'no-answer').length;
    const dead = calls.filter(c => c.outcome === 'not-interested').length;

    const demosSent = approvals.filter(a => a.email_sent).length;
    const interested = approvals.filter(a => a.status === 'interested').length;

    // Best industries by pickup rate
    const byIndustry = {};
    for (const c of calls) {
      if (!c.industry) continue;
      if (!byIndustry[c.industry]) byIndustry[c.industry] = { calls: 0, reached: 0 };
      byIndustry[c.industry].calls++;
      if (c.outcome === 'reached' || c.outcome === 'send-demo' || c.outcome === 'reached-send-demo') {
        byIndustry[c.industry].reached++;
      }
    }
    const bestIndustries = Object.entries(byIndustry)
      .map(([ind, d]) => ({ industry: ind, calls: d.calls, reached: d.reached, rate: Math.round((d.reached / d.calls) * 100) }))
      .sort((a, b) => b.rate - a.rate);

    // Best call times by hour
    const byHour = {};
    for (const c of calls) {
      const h = c.hour ?? new Date(c.date).getHours();
      if (!byHour[h]) byHour[h] = { calls: 0, reached: 0 };
      byHour[h].calls++;
      if (c.outcome === 'reached' || c.outcome === 'send-demo' || c.outcome === 'reached-send-demo') {
        byHour[h].reached++;
      }
    }
    const bestTimes = Object.entries(byHour)
      .map(([h, d]) => ({ hour: parseInt(h), calls: d.calls, reached: d.reached, rate: Math.round((d.reached / d.calls) * 100) }))
      .sort((a, b) => b.rate - a.rate);

    // Top objections
    const objCounts = {};
    for (const c of calls) {
      const obj = c.objection || 'none';
      if (obj === 'none') continue;
      objCounts[obj] = (objCounts[obj] || 0) + 1;
    }
    const topObjections = Object.entries(objCounts)
      .map(([obj, count]) => ({ objection: obj, count, pct: Math.round((count / Math.max(totalCalls, 1)) * 100) }))
      .sort((a, b) => b.count - a.count);

    // Best days
    const byDay = {};
    for (const c of calls) {
      const d = c.day || new Date(c.date).toLocaleDateString('en-US', { weekday: 'long' });
      if (!byDay[d]) byDay[d] = { calls: 0, reached: 0 };
      byDay[d].calls++;
      if (c.outcome === 'reached' || c.outcome === 'send-demo' || c.outcome === 'reached-send-demo') {
        byDay[d].reached++;
      }
    }
    const bestDays = Object.entries(byDay)
      .map(([day, d]) => ({ day, calls: d.calls, reached: d.reached, rate: Math.round((d.reached / d.calls) * 100) }))
      .sort((a, b) => b.rate - a.rate);

    return {
      today: todayCalls,
      week: weekCalls,
      total: totalCalls,
      reached,
      voicemails,
      noAnswer,
      dead,
      demosSent,
      interested,
      pickupRate: totalCalls > 0 ? Math.round((reached / totalCalls) * 100) : 0,
      sendRate: reached > 0 ? Math.round((demosSent / reached) * 100) : 0,
      bestIndustries,
      bestTimes,
      bestDays,
      topObjections,
      pipeline: {
        total: approvals.length,
        callQueue: approvals.filter(a => ['call-queue', 'reached', 'callback'].includes(a.status)).length,
        demosSent: demosSent,
        interested: interested,
        dead: approvals.filter(a => a.status === 'dead').length,
      }
    };
  } catch (err) {
    return { error: err.message };
  }
});

// ── REJECT LEAD ──────────────────────────────────────────────────────────────
ipcMain.handle('reject-lead-by-id', async (_, leadId) => {
  try {
    if (!leadId.startsWith('LEAD-')) leadId = `LEAD-${leadId}`;
    const approvalFile = path.join(APPROVALS_DIR, `APPROVAL-${leadId}.json`);
    if (!fs.existsSync(approvalFile)) return { success: false, error: 'Not found' };
    const approval = JSON.parse(fs.readFileSync(approvalFile, 'utf8'));
    approval.status = 'dead';
    approval.dead_date = new Date().toISOString().split('T')[0];
    fs.writeFileSync(approvalFile, JSON.stringify(approval, null, 2), 'utf8');
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// ── WRITE APPROVAL DIRECTLY ──────────────────────────────────────────────────
ipcMain.handle('write-approval', (_, filename, data) => {
  try {
    fs.writeFileSync(path.join(APPROVALS_DIR, filename), JSON.stringify(data, null, 2), 'utf8');
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// ── OPEN DEMO IN BROWSER ─────────────────────────────────────────────────────
ipcMain.handle('open-demo', (_, demoPath) => {
  const { shell } = require('electron');
  const fullPath = path.join(ROOT, demoPath);
  if (fs.existsSync(fullPath)) { shell.openPath(fullPath); return true; }
  return false;
});

// ── BOOT ─────────────────────────────────────────────────────────────────────
app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });

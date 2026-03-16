const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, '..');

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
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

// Read a single file as text
ipcMain.handle('read-file', (_, relPath) => {
  try {
    return fs.readFileSync(path.join(ROOT, relPath), 'utf8');
  } catch { return null; }
});

// Read a JSON file
ipcMain.handle('read-json', (_, relPath) => {
  try {
    return JSON.parse(fs.readFileSync(path.join(ROOT, relPath), 'utf8'));
  } catch { return null; }
});

// Read all lead JSONs from engine/leads/
ipcMain.handle('read-leads', () => {
  try {
    const dir = path.join(ROOT, 'engine', 'leads');
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir)
      .filter(f => f.startsWith('LEAD-') && f.endsWith('.json'))
      .map(f => {
        try { return JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); }
        catch { return null; }
      })
      .filter(Boolean);
  } catch { return []; }
});

// List files in a directory
ipcMain.handle('list-files', (_, relPath) => {
  try {
    const dir = path.join(ROOT, relPath);
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir);
  } catch { return []; }
});

// Read all social queue posts
ipcMain.handle('read-queue', () => {
  try {
    const dir = path.join(ROOT, 'social-engine', 'queue');
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir)
      .filter(f => f.endsWith('.json'))
      .map(f => {
        try {
          const data = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
          return { ...data, filename: f };
        } catch { return null; }
      })
      .filter(Boolean);
  } catch { return []; }
});

// Approve a social post — move from queue/ to posted/
ipcMain.handle('approve-post', (_, filename) => {
  try {
    const from = path.join(ROOT, 'social-engine', 'queue', filename);
    const to = path.join(ROOT, 'social-engine', 'posted', filename);
    fs.mkdirSync(path.join(ROOT, 'social-engine', 'posted'), { recursive: true });
    fs.renameSync(from, to);
    return true;
  } catch { return false; }
});

// Write updated MEMORY.md
ipcMain.handle('write-memory', (_, content) => {
  try {
    fs.writeFileSync(path.join(ROOT, 'memory', 'MEMORY.md'), content, 'utf8');
    return true;
  } catch { return false; }
});

// Check if a path exists
ipcMain.handle('path-exists', (_, relPath) => {
  return fs.existsSync(path.join(ROOT, relPath));
});

ipcMain.handle('open-external', (_, url) => {
  const { shell } = require('electron');
  shell.openExternal(url);
});

// Read all approval JSONs from engine/approvals/
ipcMain.handle('read-approvals', () => {
  try {
    const dir = path.join(ROOT, 'engine', 'approvals');
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir)
      .filter(f => f.startsWith('APPROVAL-') && f.endsWith('.json'))
      .map(f => {
        try {
          const data = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
          data._filename = f;
          return data;
        } catch { return null; }
      })
      .filter(Boolean);
  } catch { return []; }
});

// Approve a lead — send plain text email with demo HTML attached
ipcMain.handle('approve-lead', async (_, approvalFilename) => {
  try {
    require('dotenv').config({ path: path.join(ROOT, 'engine', 'tools', '.env') });
    const approvalPath = path.join(ROOT, 'engine', 'approvals', approvalFilename);
    const approval = JSON.parse(fs.readFileSync(approvalPath, 'utf8'));
    const leadId = approval.id || '';
    const biz = approval.lead?.business || 'your business';
    const email = (approval.lead?.email || '').trim();
    const ownerName = (approval.lead?.owner || '').trim();
    const ownerFirst = ownerName ? ownerName.split(' ')[0] : 'there';

    if (!email) return { success: false, error: 'No email on this lead' };

    // Resolve demo file
    const demoRelPath = approval.demo_path || '';
    const demoFullPath = path.join(ROOT, demoRelPath);
    if (!demoRelPath || !fs.existsSync(demoFullPath)) {
      return { success: false, error: 'Demo file not found: ' + demoRelPath };
    }

    // Build live demo URL on GitHub Pages with clean business name
    const cleanName = biz.replace(/[^a-zA-Z0-9\s]/g, '').split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
    const cleanDemoFilename = `${cleanName}.html`;
    const liveUrl = `https://matthew-creat3e.github.io/hoo-intelligence/demos/${cleanDemoFilename}`;

    const subject = `built something for ${biz}`;
    const bodyText = `Hey ${ownerFirst},

I'm a concrete worker out of Kansas City - Local 1290. I've been learning web design at night and building free sites for local businesses to grow my portfolio.

I noticed ${biz} doesn't have a website so I built you one. Took me a few hours. No charge to look at it:

${liveUrl}

If you love it, I'll finish the full build for a flat fee. If not, no hard feelings - keep the design.

Either way I hope it helps.

- Matthew Herrman
HOO - Kansas City, MO
(804) 957-1003
herrmanonlineoutlook.com`;

    // Send plain text email — no attachments, no HTML
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"Matthew Herrman | HOO" <${process.env.GMAIL_USER}>`,
      to: email,
      subject,
      text: bodyText,
    });

    // Save social captions to queue
    if (approval.social_captions) {
      const queueDir = path.join(ROOT, 'social-engine', 'queue');
      fs.mkdirSync(queueDir, { recursive: true });
      const slug = (approval.lead.business || 'lead').toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const socialFile = path.join(queueDir, `SOCIAL-${approval.created_date}-${slug}.json`);
      if (!fs.existsSync(socialFile)) {
        const platforms = ['facebook', 'instagram', 'tiktok'];
        const posts = platforms.map(p => ({
          platform: p, store: approval.lead.business, section: 'Demo Homepage',
          caption: approval.social_captions[p], date: approval.created_date, status: 'queued'
        }));
        fs.writeFileSync(socialFile, JSON.stringify(posts, null, 2));
      }
    }

    // Update approval status
    approval.status = 'sent';
    approval.sent_date = new Date().toISOString().split('T')[0];
    fs.writeFileSync(approvalPath, JSON.stringify(approval, null, 2), 'utf8');

    // Log to email-log.json
    const logFile = path.join(ROOT, 'engine', 'data', 'email-log.json');
    let log = [];
    try { log = JSON.parse(fs.readFileSync(logFile, 'utf8')); } catch {}
    log.push({
      date: new Date().toISOString(), lead: biz, id: leadId, to: email,
      subject, source: 'approve-lead', status: 'sent', liveUrl,
    });
    fs.writeFileSync(logFile, JSON.stringify(log, null, 2), 'utf8');

    // Auto-push demos to GitHub Pages so the link works when they click it
    try {
      const { execSync } = require('child_process');
      // Copy demo to /demos/ with clean business name
      const demosDir = path.join(ROOT, 'demos');
      if (!fs.existsSync(demosDir)) fs.mkdirSync(demosDir, { recursive: true });
      fs.copyFileSync(demoFullPath, path.join(demosDir, cleanDemoFilename));
      execSync('git add demos/ outputs/demos/', { cwd: ROOT });
      const gitStatus = execSync('git status --porcelain demos/ outputs/demos/', { cwd: ROOT, encoding: 'utf8' });
      if (gitStatus.trim()) {
        execSync('git commit -m "deploy: demo page for ' + biz.replace(/"/g, '') + '"', { cwd: ROOT });
        execSync('git push origin master', { cwd: ROOT, timeout: 30000 });
      }
    } catch (pushErr) {
      console.warn('Auto-push failed:', pushErr.message);
    }

    return { success: true, business: biz };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Move a no-email lead to Call Queue instead of sending
ipcMain.handle('move-to-call-queue', async (_, approvalFilename) => {
  try {
    const approvalPath = path.join(ROOT, 'engine', 'approvals', approvalFilename);
    const approval = JSON.parse(fs.readFileSync(approvalPath, 'utf8'));
    approval.needs_call = true;
    fs.writeFileSync(approvalPath, JSON.stringify(approval, null, 2));
    return { success: true, business: approval.lead?.business || '' };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Reject a lead approval — then hunt 1 replacement from different city/industry
ipcMain.handle('reject-lead', async (_, approvalFilename) => {
  try {
    const approvalPath = path.join(ROOT, 'engine', 'approvals', approvalFilename);
    const approval = JSON.parse(fs.readFileSync(approvalPath, 'utf8'));
    approval.status = 'rejected';
    approval.rejected_date = new Date().toISOString().split('T')[0];
    fs.writeFileSync(approvalPath, JSON.stringify(approval, null, 2));

    // Auto-hunt a replacement in the background
    const { execSync } = require('child_process');
    try {
      execSync(
        `node "${path.join(ROOT, 'engine', 'tools', 'pipeline-orchestrator.js')}" replace "${approvalFilename}"`,
        { cwd: ROOT, env: { ...process.env }, timeout: 90000, stdio: 'pipe' }
      );
    } catch (huntErr) {
      // Replacement hunt failed — not critical, just log it
      console.error('Replacement hunt failed:', huntErr.message);
    }

    return { success: true, replaced: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Open a demo HTML file in default browser
ipcMain.handle('open-demo', (_, demoPath) => {
  const { shell } = require('electron');
  const fullPath = path.join(ROOT, demoPath);
  if (fs.existsSync(fullPath)) {
    shell.openPath(fullPath);
    return true;
  }
  return false;
});

// Add email to lead + send demo via pipeline-orchestrator add-email
ipcMain.handle('add-email-and-send', async (_, leadId, email) => {
  try {
    const { execSync } = require('child_process');
    const output = execSync(
      `node "${path.join(ROOT, 'engine', 'tools', 'pipeline-orchestrator.js')}" add-email "${leadId}" "${email}"`,
      { cwd: ROOT, env: { ...process.env }, timeout: 30000, encoding: 'utf8' }
    );
    return { success: true, output };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Reject a lead by ID via pipeline-orchestrator reject
ipcMain.handle('reject-lead-by-id', async (_, leadId) => {
  try {
    const { execSync } = require('child_process');
    execSync(
      `node "${path.join(ROOT, 'engine', 'tools', 'pipeline-orchestrator.js')}" reject "${leadId}"`,
      { cwd: ROOT, env: { ...process.env }, timeout: 15000, encoding: 'utf8' }
    );
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });

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

// Approve a lead — send dark-themed HTML email with screenshot + demo attachment
ipcMain.handle('approve-lead', async (_, approvalFilename) => {
  try {
    require('dotenv').config({ path: path.join(ROOT, 'engine', 'tools', '.env') });
    const approvalPath = path.join(ROOT, 'engine', 'approvals', approvalFilename);
    const approval = JSON.parse(fs.readFileSync(approvalPath, 'utf8'));
    const leadId = approval.id || '';
    const biz = approval.lead?.business || 'your business';
    const email = (approval.lead?.email || '').trim();

    if (!email) return { success: false, error: 'No email on this lead' };

    // Resolve demo file
    const demoRelPath = approval.demo_path || '';
    const demoFullPath = path.join(ROOT, demoRelPath);
    if (!demoRelPath || !fs.existsSync(demoFullPath)) {
      return { success: false, error: 'Demo file not found: ' + demoRelPath };
    }

    const subject = `I built ${biz} a free website - take a look`;
    const bodyText = approval.email_preview?.body || `Hi,\n\nI built ${biz} a free website. Click the link below to see the full design with photos, animations, and a working mobile layout.\n\n- Matthew Herrman\nHOO - Build free, pay on approval\nherrmanonlineoutlook.com\n(804) 957-1003`;

    // Build GitHub Pages demo URL
    const demoFilename = path.basename(demoRelPath);
    const demoUrl = `https://matthew-creat3e.github.io/hoo-intelligence/demos/${demoFilename}`;

    // Screenshot the demo with puppeteer
    const screenshotsDir = path.join(ROOT, 'outputs', 'screenshots');
    if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir, { recursive: true });
    const screenshotPath = path.join(screenshotsDir, `${leadId}-preview.png`);

    try {
      const puppeteer = require('puppeteer');
      const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 800 });
      const { pathToFileURL } = require('url');
      await page.goto(pathToFileURL(demoFullPath).href, { waitUntil: 'networkidle2' });
      await page.waitForSelector('body', { visible: true });
      await new Promise(r => setTimeout(r, 4000));
      await page.screenshot({ path: screenshotPath, type: 'png' });
      await browser.close();
    } catch (err) {
      console.warn('Screenshot failed:', err.message);
    }

    const hasScreenshot = fs.existsSync(screenshotPath);

    // Build dark-themed HTML email
    const bodyHtmlLines = bodyText.split('\n').map(line => {
      if (!line.trim()) return '<br>';
      return `<p style="margin:0 0 8px 0;font-size:14px;line-height:1.7;color:#F0EAE0;">${line.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</p>`;
    }).join('\n');

    const htmlBody = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#050505;font-family:'Syne',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#050505;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
  <tr><td style="padding:24px 32px;border-bottom:2px solid #C8952E;">
    <h1 style="margin:0;font-family:'Bebas Neue',Impact,sans-serif;font-size:28px;letter-spacing:3px;color:#C8952E;">I built ${biz.replace(/</g,'&lt;').replace(/>/g,'&gt;')} a free website</h1>
  </td></tr>
  ${hasScreenshot ? `<tr><td style="padding:24px 32px 16px;">
    <img src="cid:demo-preview" alt="${biz.replace(/"/g,'&quot;')} website preview" style="width:100%;max-width:600px;border-radius:8px;border:1px solid #1C1C1C;display:block;" />
  </td></tr>` : ''}
  <tr><td style="padding:16px 32px 24px;">
    ${bodyHtmlLines}
  </td></tr>
  <tr><td style="padding:0 32px 16px;" align="center">
    <a href="${demoUrl}" target="_blank" style="display:inline-block;background:#C8952E;color:#050505;font-family:'Bebas Neue',Impact,sans-serif;font-size:18px;letter-spacing:3px;padding:14px 36px;text-decoration:none;border-radius:4px;">VIEW YOUR FREE WEBSITE</a>
  </td></tr>
  <tr><td style="padding:0 32px 32px;" align="center">
    <a href="https://herrmanonlineoutlook.com" target="_blank" style="display:inline-block;background:transparent;color:#C8952E;font-family:'Bebas Neue',Impact,sans-serif;font-size:14px;letter-spacing:3px;padding:10px 36px;text-decoration:none;border:1px solid #C8952E;border-radius:4px;">SEE MORE OF OUR WORK</a>
  </td></tr>
  <tr><td style="padding:16px 32px;border-top:1px solid #1C1C1C;">
    <p style="margin:0;font-size:11px;color:#888880;text-align:center;">Matthew Herrman | HOO - Build free, pay on approval | (804) 957-1003</p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

    // Send via nodemailer
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    const attachments = [];
    if (hasScreenshot) {
      attachments.push({ filename: `${leadId}-preview.png`, path: screenshotPath, cid: 'demo-preview' });
    }

    await transporter.sendMail({
      from: `"${process.env.GMAIL_FROM_NAME || 'Matthew Herrman | HOO'}" <${process.env.GMAIL_USER}>`,
      to: email,
      subject,
      text: bodyText,
      html: htmlBody,
      attachments,
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
      subject, source: 'approve-lead', status: 'sent', demoUrl,
      screenshot: hasScreenshot ? `${leadId}-preview.png` : null,
    });
    fs.writeFileSync(logFile, JSON.stringify(log, null, 2), 'utf8');

    // Auto-push demos to GitHub Pages so the link works when they click it
    try {
      const { execSync } = require('child_process');
      // Copy demo to /demos/ (GitHub Pages serves from there)
      const demosDir = path.join(ROOT, 'demos');
      if (!fs.existsSync(demosDir)) fs.mkdirSync(demosDir, { recursive: true });
      fs.readdirSync(path.join(ROOT, 'outputs', 'demos'))
        .filter(f => f.startsWith('LEAD-') && f.endsWith('.html'))
        .forEach(f => fs.copyFileSync(
          path.join(ROOT, 'outputs', 'demos', f),
          path.join(demosDir, f)
        ));
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

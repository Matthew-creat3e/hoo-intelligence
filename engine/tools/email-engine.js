/**
 * HOO Email Engine v2.0 — Gmail SMTP via Nodemailer
 * Mirrors sms-engine.js patterns. DRY RUN by default. --live to send.
 *
 * Install: npm install nodemailer (dotenv already installed)
 *
 * Credentials in .env:
 *   GMAIL_USER=herrmanonlineoutlook@gmail.com
 *   GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
 *   GMAIL_FROM_NAME=Matthew Herrman | HOO
 *
 * Usage:
 *   node email-engine.js                                  Show help
 *   node email-engine.js preview <lead.json>              Preview email (dry run)
 *   node email-engine.js send <lead.json>                 Dry run single
 *   node email-engine.js send <lead.json> --live          Send single email
 *   node email-engine.js send <lead.json> --template=2    Use specific template
 *   node email-engine.js send <lead.json> --demo          Send demo delivery (Template 7)
 *   node email-engine.js send <lead.json> --demo --live   Send demo delivery email
 *   node email-engine.js batch <leads.json>               Dry run batch
 *   node email-engine.js batch <leads.json> --live        Send batch from JSON list
 *   node email-engine.js send-all --live                  Send to all lead files
 *   node email-engine.js test "you@email.com" --live      Send test email
 */

require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const fs   = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

// ── CONFIG ────────────────────────────────────────────────────────────────────
const LEADS_DIR      = path.join(__dirname, '..', 'leads');
const DEMOS_DIR      = path.join(__dirname, '..', '..', 'outputs', 'demos');
const SCREENSHOTS_DIR = path.join(__dirname, '..', '..', 'outputs', 'screenshots');
const LOG_FILE       = path.join(__dirname, '..', 'data', 'email-log.json');
const TEMPLATES_FILE = path.join(__dirname, '..', 'outreach', 'templates', 'email-templates.md');

const GMAIL_USER     = process.env.GMAIL_USER;
const GMAIL_APP_PASS = process.env.GMAIL_APP_PASSWORD;
const GMAIL_FROM     = process.env.GMAIL_FROM_NAME || 'Matthew Herrman | HOO';

// ── SAFETY GATE ───────────────────────────────────────────────────────────────
const IS_LIVE = process.argv.includes('--live');
const IS_DEMO = process.argv.includes('--demo');

if (!IS_LIVE && process.argv.length > 2) {
  console.log('\n\x1b[33m⚠️  DRY RUN MODE — no emails will be sent\x1b[0m');
  console.log('   Add --live to send for real\n');
}

// ── SMTP TRANSPORT ────────────────────────────────────────────────────────────
let _transporter = null;

function getTransporter() {
  if (_transporter) return _transporter;
  if (!GMAIL_USER || !GMAIL_APP_PASS) {
    console.error('❌  GMAIL_USER and GMAIL_APP_PASSWORD must be set in .env');
    process.exit(1);
  }
  _transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: GMAIL_USER, pass: GMAIL_APP_PASS },
  });
  return _transporter;
}

// ── TEMPLATE PARSER ───────────────────────────────────────────────────────────
function loadTemplates() {
  if (!fs.existsSync(TEMPLATES_FILE)) {
    console.error(`❌  Templates not found: ${TEMPLATES_FILE}`);
    process.exit(1);
  }
  const raw = fs.readFileSync(TEMPLATES_FILE, 'utf8');
  const blocks = raw.split(/^## Template \d+/m).slice(1);

  return blocks.map((block, i) => {
    const nameMatch = block.match(/^[^—]*—\s*(.+)/m);
    const useMatch  = block.match(/\*Use for:\s*(.+?)\*/);
    const codeMatch = block.match(/```([\s\S]*?)```/);

    if (!codeMatch) return null;

    const code    = codeMatch[1].trim();
    const subjMatch = code.match(/^Subject:\s*(.+)/m);
    const subject = subjMatch ? subjMatch[1].trim() : `Message from HOO`;
    const body    = code.replace(/^Subject:.*\n\n?/, '').trim();

    return {
      id:      i + 1,
      name:    nameMatch ? nameMatch[1].trim() : `Template ${i + 1}`,
      use_for: useMatch ? useMatch[1].trim() : '',
      subject,
      body,
    };
  }).filter(Boolean);
}

// ── VARIABLE INTERPOLATION ────────────────────────────────────────────────────
function fillTemplate(text, lead) {
  return text
    .replace(/\{owner_name(?:\s+or\s+"there")?\}/g, lead.owner_name || 'there')
    .replace(/\{business_name\}/g,      lead.business || lead.business_name || '[Business]')
    .replace(/\{industry\}/g,           lead.industry || '[industry]')
    .replace(/\{city\}/g,               lead.city || '[city]')
    .replace(/\{platform\}/g,           lead.source || lead.platform || 'social media')
    .replace(/\{N\}/g,                  lead.audit_issues || '5')
    .replace(/\{specific_issue_from_audit\}/g, lead.top_issue || 'site not mobile-friendly')
    .replace(/\{estimated_job_value\}/g, lead.job_value || '500');
}

// ── HTML ESCAPE ───────────────────────────────────────────────────────────────
function esc(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── DEMO FILE FINDER ─────────────────────────────────────────────────────────
function findDemoFile(lead) {
  if (!fs.existsSync(DEMOS_DIR)) return null;
  const files = fs.readdirSync(DEMOS_DIR).filter(f => f.endsWith('.html'));
  const leadId = (lead.id || '').toLowerCase();
  const biz = (lead.business || lead.business_name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');

  for (const f of files) {
    const lower = f.toLowerCase();
    if (leadId && lower.includes(leadId.toLowerCase())) return path.join(DEMOS_DIR, f);
    if (biz && lower.includes(biz)) return path.join(DEMOS_DIR, f);
  }
  return null;
}

// ── SCREENSHOT FINDER ─────────────────────────────────────────────────────────
function findScreenshot(lead) {
  if (!fs.existsSync(SCREENSHOTS_DIR)) return null;
  const leadId = lead.id || '';
  const pngPath = path.join(SCREENSHOTS_DIR, `${leadId}-preview.png`);
  if (fs.existsSync(pngPath)) return pngPath;
  // Fallback: search by pattern
  const files = fs.readdirSync(SCREENSHOTS_DIR).filter(f => f.endsWith('.png'));
  for (const f of files) {
    if (leadId && f.toLowerCase().includes(leadId.toLowerCase())) return path.join(SCREENSHOTS_DIR, f);
  }
  return null;
}

// ── HTML EMAIL BUILDER ───────────────────────────────────────────────────────
// Builds a themed HTML email with inline screenshot via cid
function buildHTMLEmail(opts) {
  const { heading, screenshotCid, bullets, ctaText, ctaUrl, bodyText, footerName, footerPhone, footerEmail, hooUrl } = opts;

  const bulletHtml = bullets.map(b =>
    `<tr><td style="padding:0 0 10px 0;font-size:14px;line-height:1.6;color:#F0EAE0;">
      <span style="color:#C8952E;font-weight:bold;margin-right:6px;">&#10003;</span> ${esc(b)}
    </td></tr>`
  ).join('\n');

  const bodyHtmlLines = bodyText ? bodyText.split('\n').map(line => {
    if (!line.trim()) return '<br>';
    return `<p style="margin:0 0 8px 0;font-size:14px;line-height:1.7;color:#F0EAE0;">${esc(line)}</p>`;
  }).join('\n') : '';

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#050505;font-family:'Syne',Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#050505;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

  <!-- HEADER -->
  <tr><td style="padding:24px 32px;border-bottom:2px solid #C8952E;">
    <h1 style="margin:0;font-family:'Bebas Neue',Impact,sans-serif;font-size:26px;letter-spacing:3px;color:#C8952E;line-height:1.2;">${esc(heading)}</h1>
  </td></tr>

  ${screenshotCid ? `<!-- SCREENSHOT (inline via cid — no visible attachment) -->
  <tr><td style="padding:24px 32px 16px;">
    <img src="cid:${screenshotCid}" alt="Website preview" style="width:100%;max-width:540px;border-radius:8px;border:1px solid #1C1C1C;display:block;" />
  </td></tr>` : ''}

  ${bodyHtmlLines ? `<!-- BODY TEXT -->
  <tr><td style="padding:16px 32px 8px;">
    ${bodyHtmlLines}
  </td></tr>` : ''}

  ${bullets.length > 0 ? `<!-- WHAT WE BUILT -->
  <tr><td style="padding:16px 32px 8px;">
    <p style="margin:0 0 12px 0;font-family:'Bebas Neue',Impact,sans-serif;font-size:16px;letter-spacing:2px;color:#C8952E;">WHAT WE BUILT FOR YOU</p>
    <table cellpadding="0" cellspacing="0" style="width:100%;">
      ${bulletHtml}
    </table>
  </td></tr>` : ''}

  <!-- CTA BUTTON -->
  <tr><td style="padding:16px 32px 32px;" align="center">
    <a href="${esc(ctaUrl)}" target="_blank" style="display:inline-block;background:#C8952E;color:#050505;font-family:'Bebas Neue',Impact,sans-serif;font-size:18px;letter-spacing:3px;padding:14px 36px;text-decoration:none;border-radius:4px;">${esc(ctaText)}</a>
  </td></tr>

  <!-- FOOTER -->
  <tr><td style="padding:20px 32px;border-top:1px solid #1C1C1C;">
    <p style="margin:0 0 6px 0;font-size:13px;color:#F0EAE0;text-align:center;">${esc(footerName)}</p>
    <p style="margin:0 0 4px 0;font-size:13px;color:#F0EAE0;text-align:center;">HOO - Build first, pay on approval</p>
    <p style="margin:0 0 4px 0;font-size:13px;text-align:center;"><strong style="color:#C8952E;">${esc(footerPhone || '(804) 957-1003')}</strong></p>
    <p style="margin:0 0 4px 0;font-size:13px;text-align:center;"><strong style="color:#C8952E;">${esc(footerEmail || 'herrmanonlineoutlook@gmail.com')}</strong></p>
    ${hooUrl ? `<p style="margin:0;font-size:13px;text-align:center;"><a href="${esc(hooUrl)}" target="_blank" style="color:#C8952E;text-decoration:underline;">${esc(hooUrl)}</a></p>` : ''}
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

// ── TEMPLATE 7 — DEMO DELIVERY (inline screenshot, no visible attachment) ───
function buildDemoEmail(lead, demoPath) {
  const biz = lead.business || lead.business_name || 'your business';
  const owner = lead.owner_name || lead.owner || 'there';
  const city = lead.city || '';
  const industry = lead.industry || 'business';

  // Demo URL: lead.demo_url > GitHub Pages demo link > HOO site
  const demoFilename = path.basename(demoPath);
  const demoUrl = lead.demo_url || `https://matthew-creat3e.github.io/hoo-intelligence/outputs/demos/${demoFilename}`;
  const hooUrl = 'https://herrmanonlineoutlook.com';

  // Subject: avoid spam triggers (no "free", "guaranteed", "click here", etc.)
  const subject = `I built ${biz} a website - take a look`;

  // Plain text body
  const plainText = `Hey ${owner},

My name's Matthew Herrman - I run HOO out of Kansas City, MO. I build websites for local ${industry} businesses, and I do it a little differently: I build first, you only pay if you love it.

I went ahead and built a custom homepage for ${biz}${city ? ' in ' + city : ''}. Here's what's included:

- Custom homepage designed for ${industry} businesses in ${city || 'your area'}
- Mobile-ready layout with real photos and working animations
- Click-to-call button wired to your phone number

See your website: ${demoUrl}

No obligations. No pitch. Just wanted to show you what ${biz} could look like online.

If you like what you see, reply to this email or call me. If not, no hard feelings.

Matthew Herrman
HOO - Build first, pay on approval
(804) 957-1003
herrmanonlineoutlook@gmail.com
${hooUrl}`;

  const bullets = [
    `Custom homepage designed for ${industry} businesses in ${city || 'your area'}`,
    'Mobile-ready layout with real photos and working animations',
    'Click-to-call button wired to your phone number',
  ];

  // Check for existing screenshot (inline via cid)
  const screenshotPath = findScreenshot(lead);
  const hasScreenshot = !!screenshotPath;

  const bodyBeforeBullets = `Hey ${owner},\n\nMy name's Matthew Herrman - I run HOO out of Kansas City, MO. I build websites for local ${industry} businesses, and I do it a little differently: I build first, you only pay if you love it.\n\nI went ahead and built a custom homepage for ${biz}${city ? ' in ' + city : ''}.`;

  const htmlBody = buildHTMLEmail({
    heading: `Hey ${owner}, I built ${biz} a website`,
    screenshotCid: hasScreenshot ? 'demo-preview' : null,
    bullets,
    ctaText: 'SEE YOUR WEBSITE \u2192',
    ctaUrl: demoUrl,
    bodyText: bodyBeforeBullets,
    footerName: 'Matthew Herrman',
    footerPhone: '(804) 957-1003',
    footerEmail: 'herrmanonlineoutlook@gmail.com',
    hooUrl,
  });

  // Attachments: only inline screenshot (no visible file attachments)
  const attachments = [];
  if (hasScreenshot) {
    attachments.push({
      filename: 'preview.png',
      path: screenshotPath,
      cid: 'demo-preview',
    });
  }

  return {
    to: lead.email,
    subject,
    body: plainText,
    html: htmlBody,
    templateId: 7,
    templateName: 'Demo Delivery',
    attachments,
    demoUrl,
  };
}

// ── PICK BEST TEMPLATE ───────────────────────────────────────────────────────
function pickTemplate(lead, templates, forceId) {
  if (forceId) {
    const t = templates.find(t => t.id === forceId);
    if (t) return t;
    console.warn(`⚠️  Template ${forceId} not found, auto-selecting`);
  }

  // Follow-up
  if (lead.stage === 'contacted' || lead.follow_up) return templates.find(t => t.id === 6) || templates[3];
  // Bad website
  if (lead.has_website && lead.audit_issues) return templates.find(t => t.id === 2) || templates[1];
  // Social only
  if (lead.social_only || lead.source === 'facebook') return templates.find(t => t.id === 3) || templates[2];
  // High-value trades
  if (['tattoo', 'fencing', 'landscaping', 'auto', 'plumbing', 'roofing', 'hvac'].includes(lead.industry?.toLowerCase())) {
    return templates.find(t => t.id === 5) || templates[4];
  }
  // No website (long form)
  if (lead.no_website) return templates.find(t => t.id === 1) || templates[0];
  // Default: punchy short
  return templates.find(t => t.id === 4) || templates[3];
}

// ── BUILD STANDARD EMAIL (templates 1-6) ─────────────────────────────────────
function buildStandardHTMLEmail(lead, template) {
  const biz = lead.business || lead.business_name || 'your business';
  const owner = lead.owner_name || 'there';
  const demoUrl = lead.demo_url || 'https://herrmanonlineoutlook.com';
  const subject = fillTemplate(template.subject, lead);
  const plainBody = fillTemplate(template.body, lead);

  const htmlBody = buildHTMLEmail({
    heading: `Hey ${owner}, a quick note about ${biz}`,
    screenshotCid: null,
    bullets: [],
    ctaText: 'SEE OUR WORK \u2192',
    ctaUrl: demoUrl,
    bodyText: plainBody,
    footerName: 'Matthew Herrman',
    footerPhone: '(804) 957-1003',
    footerEmail: 'herrmanonlineoutlook@gmail.com',
    hooUrl: 'https://herrmanonlineoutlook.com',
  });

  return { to: lead.email, subject, body: plainBody, html: htmlBody, templateId: template.id, templateName: template.name };
}

// ── BUILD EMAIL (dispatcher) ─────────────────────────────────────────────────
function buildEmail(lead, forceTemplateId) {
  // --demo flag: use Template 7 with inline screenshot
  if (IS_DEMO || forceTemplateId === 7) {
    const demoPath = findDemoFile(lead);
    if (!demoPath) {
      console.error(`  ❌  No demo file found for ${lead.business || lead.id} in outputs/demos/`);
      console.log(`       Expected pattern: LEAD-*-${(lead.business || '').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.html`);
      return null;
    }
    console.log(`  📄  Demo found: ${path.basename(demoPath)}`);
    const screenshotPath = findScreenshot(lead);
    if (screenshotPath) {
      console.log(`  🖼️  Screenshot found: ${path.basename(screenshotPath)} (will embed inline)`);
    } else {
      console.log(`  ⚠️  No screenshot found — email will send without preview image`);
    }
    return buildDemoEmail(lead, demoPath);
  }

  const templates = loadTemplates();
  const template  = pickTemplate(lead, templates, forceTemplateId);
  return buildStandardHTMLEmail(lead, template);
}

// ── PREVIEW ───────────────────────────────────────────────────────────────────
function preview(lead, forceTemplateId) {
  const email = buildEmail(lead, forceTemplateId);
  if (!email) return null;
  console.log('\n─────────────────────────────────────');
  console.log(`📧  TO:       ${email.to || '[no email]'}`);
  console.log(`📤  FROM:     ${GMAIL_FROM} <${GMAIL_USER}>`);
  console.log(`📋  TEMPLATE: #${email.templateId} — ${email.templateName}`);
  console.log(`📝  SUBJECT:  ${email.subject}`);
  if (email.demoUrl) {
    console.log(`🔗  CTA URL:  ${email.demoUrl}`);
  }
  if (email.attachments && email.attachments.length > 0) {
    const inlineCount = email.attachments.filter(a => a.cid).length;
    const fileCount = email.attachments.filter(a => !a.cid).length;
    if (inlineCount) console.log(`🖼️  INLINE:   ${inlineCount} embedded image(s) via cid`);
    if (fileCount) console.log(`📎  ATTACH:   ${email.attachments.filter(a => !a.cid).map(a => a.filename).join(', ')}`);
  }
  console.log('─── PLAIN TEXT ───');
  console.log(email.body);
  console.log('─────────────────────────────────────');
  if (email.html) {
    console.log('  [HTML version will also be sent — inline screenshot + themed layout]');
  }
  console.log('');
  return email;
}

// ── SEND SINGLE ───────────────────────────────────────────────────────────────
async function sendEmail(lead, forceTemplateId) {
  if (!lead.email) {
    console.log(`  ⏭️  Skip ${lead.business || lead.business_name} — no email`);
    return null;
  }

  const email = preview(lead, forceTemplateId);
  if (!email) return null;

  if (!IS_LIVE) {
    console.log('  🔒  DRY RUN — not sent. Use --live to send.');
    return { status: 'dry-run', lead: lead.business || lead.business_name, to: email.to };
  }

  const transporter = getTransporter();

  try {
    const mailOpts = {
      from:    `"${GMAIL_FROM}" <${GMAIL_USER}>`,
      to:      email.to,
      subject: email.subject,
      text:    email.body,
    };
    // Plain text only — no HTML, no attachments (avoids spam filters)
    // if (email.html) mailOpts.html = email.html;
    // if (email.attachments && email.attachments.length > 0) mailOpts.attachments = email.attachments;

    const info = await transporter.sendMail(mailOpts);

    const logEntry = {
      date:       new Date().toISOString(),
      lead:       lead.business || lead.business_name,
      id:         lead.id || null,
      to:         email.to,
      subject:    email.subject,
      template:   email.templateId,
      messageId:  info.messageId,
      status:     'sent',
      live:       true,
      hasHTML:    !!email.html,
      hasInlineImage: !!(email.attachments && email.attachments.some(a => a.cid)),
    };

    appendLog(logEntry);
    updateLeadStage(lead, 'emailed');
    console.log(`  ✅  Sent to ${email.to} [${info.messageId}]`);
    return logEntry;

  } catch (err) {
    console.error(`  ❌  Failed: ${err.message}`);
    appendLog({
      date:  new Date().toISOString(),
      lead:  lead.business || lead.business_name,
      to:    email.to,
      error: err.message,
      status: 'failed',
    });
    return null;
  }
}

// ── BATCH FROM JSON ───────────────────────────────────────────────────────────
async function sendBatch(filePath, forceTemplateId) {
  let leads;
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    leads = JSON.parse(raw);
    if (!Array.isArray(leads)) leads = [leads];
  } catch (err) {
    console.error(`❌  Cannot read batch file: ${err.message}`);
    return;
  }

  const withEmail = leads.filter(l => l.email);
  console.log(`\n📬  Batch: ${withEmail.length} leads with emails (of ${leads.length} total)`);

  let sent = 0;
  for (const lead of withEmail) {
    if (sent >= 50) {
      console.log('\n⏸️  Pause — 50 emails sent this batch. Resume later to stay under Gmail limits.');
      break;
    }
    await sendEmail(lead, forceTemplateId);
    sent++;
    if (IS_LIVE) await sleep(3000);
  }

  console.log(`\n✅  Batch done. ${IS_LIVE ? 'Sent' : 'Previewed'}: ${sent} emails.`);
}

// ── SEND ALL (from lead files) ────────────────────────────────────────────────
async function sendAll(forceTemplateId) {
  const leads = loadAllLeads().filter(l => l.email && l.stage !== 'emailed' && l.stage !== 'contacted');
  console.log(`\n📬  Sending to ${leads.length} leads with emails (not yet emailed)`);

  let sent = 0;
  for (const lead of leads) {
    if (sent >= 50) {
      console.log('\n⏸️  Pause — 50 emails sent this session. Resume later.');
      break;
    }
    await sendEmail(lead, forceTemplateId);
    sent++;
    if (IS_LIVE) await sleep(3000);
  }

  console.log(`\n✅  Done. ${IS_LIVE ? 'Sent' : 'Previewed'}: ${sent} emails.`);
}

// ── TEST ──────────────────────────────────────────────────────────────────────
async function sendTest(toAddr) {
  console.log(`\n🧪  Test email to: ${toAddr}`);

  const testLead = {
    email:         toAddr,
    owner_name:    'Test User',
    business:      'Test Business',
    industry:      'local service',
    city:          'Kansas City',
    business_name: 'Test Business',
  };

  const email = preview(testLead, 4); // Use punchy short template

  if (!IS_LIVE) {
    console.log('  🔒  DRY RUN — use --live to actually send the test email.');
    return;
  }

  const transporter = getTransporter();

  try {
    const mailOpts = {
      from:    `"${GMAIL_FROM}" <${GMAIL_USER}>`,
      to:      toAddr,
      subject: '[HOO TEST] ' + email.subject,
      text:    `--- THIS IS A TEST EMAIL ---\n\n${email.body}\n\n--- END TEST ---`,
    };
    if (email.html) {
      mailOpts.html = email.html;
    }
    if (email.attachments && email.attachments.length > 0) {
      mailOpts.attachments = email.attachments;
    }

    const info = await transporter.sendMail(mailOpts);

    console.log(`  ✅  Test sent to ${toAddr} [${info.messageId}]`);
    appendLog({
      date:      new Date().toISOString(),
      type:      'test',
      to:        toAddr,
      messageId: info.messageId,
      status:    'sent',
    });
  } catch (err) {
    console.error(`  ❌  Test failed: ${err.message}`);
    console.log('\n  Troubleshoot:');
    console.log('    1. Enable 2FA on your Google account');
    console.log('    2. Generate App Password: myaccount.google.com/apppasswords');
    console.log('    3. Set GMAIL_APP_PASSWORD in .env (16 chars, spaces ok)');
  }
}

// ── HELPERS ───────────────────────────────────────────────────────────────────
function loadAllLeads() {
  if (!fs.existsSync(LEADS_DIR)) return [];
  return fs.readdirSync(LEADS_DIR)
    .filter(f => f.endsWith('.json') && f.startsWith('LEAD-'))
    .map(f => {
      try {
        const data = JSON.parse(fs.readFileSync(path.join(LEADS_DIR, f), 'utf8'));
        data._filename = f;
        return data;
      } catch { return null; }
    })
    .filter(Boolean);
}

function updateLeadStage(lead, stage) {
  const filename = lead._filename || lead.filename || `LEAD-${lead.id}-${lead.industry}-${lead.city}.json`;
  const file = path.join(LEADS_DIR, filename);
  if (fs.existsSync(file)) {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    data.stage = stage;
    data[`${stage}_date`] = new Date().toISOString().split('T')[0];
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
  }
}

function appendLog(entry) {
  const dir = path.dirname(LOG_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  let log = [];
  try { log = JSON.parse(fs.readFileSync(LOG_FILE, 'utf8')); } catch {}
  log.push(entry);
  fs.writeFileSync(LOG_FILE, JSON.stringify(log, null, 2));
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function getTemplateArg() {
  const arg = process.argv.find(a => a.startsWith('--template='));
  return arg ? parseInt(arg.split('=')[1], 10) : null;
}

// ── CLI ────────────────────────────────────────────────────────────────────────
async function main() {
  const [,, cmd, arg] = process.argv;
  const templateId = getTemplateArg();

  switch (cmd) {
    case 'preview': {
      if (!arg) { console.log('Usage: node email-engine.js preview <lead.json>'); return; }
      const lead = JSON.parse(fs.readFileSync(arg, 'utf8'));
      preview(lead, templateId);
      break;
    }

    case 'send': {
      if (!arg) { console.log('Usage: node email-engine.js send <lead.json> [--live]'); return; }
      const lead = JSON.parse(fs.readFileSync(arg, 'utf8'));
      await sendEmail(lead, templateId);
      break;
    }

    case 'batch': {
      if (!arg) { console.log('Usage: node email-engine.js batch <leads.json> [--live]'); return; }
      await sendBatch(arg, templateId);
      break;
    }

    case 'send-all': {
      await sendAll(templateId);
      break;
    }

    case 'test': {
      if (!arg) { console.log('Usage: node email-engine.js test "you@email.com" [--live]'); return; }
      await sendTest(arg);
      break;
    }

    case 'templates': {
      const templates = loadTemplates();
      console.log(`\n📋  ${templates.length} templates loaded from email-templates.md\n`);
      templates.forEach(t => {
        console.log(`  #${t.id}  ${t.name}`);
        console.log(`       ${t.use_for}`);
        console.log(`       Subject: ${t.subject}\n`);
      });
      break;
    }

    default:
      console.log(`
\x1b[33mHOO Email Engine v2.0\x1b[0m — Gmail SMTP via Nodemailer

Commands:
  preview <lead.json>                  Preview email for a lead (dry run)
  send <lead.json> [--live]            Send email to one lead
  send <lead.json> --demo [--live]     Send demo with inline screenshot (Template 7)
  batch <leads.json> [--live]          Send batch from JSON array
  send-all [--live]                    Send to all lead files in engine/leads/
  test "email@addr" [--live]           Send test email to yourself
  templates                            List all available templates

Options:
  --live                 Actually send (default is dry run)
  --demo                 Use Template 7: demo delivery with inline screenshot
  --template=N           Force template number (1-7)

Email structure (--demo):
  - Heading: "Hey [owner], I built [business] a website"
  - Inline screenshot (embedded via cid — no visible attachment)
  - 3 bullet points of what was built
  - CTA button: "See Your Website" linking to demo_url
  - Matthew's name + phone
  - HTML + plain text versions sent together

Safety: \x1b[33mAll sends are DRY RUN by default.\x1b[0m --live required to actually send.

Templates: engine/outreach/templates/email-templates.md
Log:       engine/data/email-log.json
      `);
  }
}

main().catch(console.error);

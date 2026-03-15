/**
 * HOO Email Engine v1.0 — Gmail SMTP via Nodemailer
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
const LEADS_DIR     = path.join(__dirname, '..', 'leads');
const LOG_FILE      = path.join(__dirname, '..', 'data', 'email-log.json');
const TEMPLATES_FILE = path.join(__dirname, '..', 'outreach', 'templates', 'email-templates.md');

const GMAIL_USER     = process.env.GMAIL_USER;
const GMAIL_APP_PASS = process.env.GMAIL_APP_PASSWORD;
const GMAIL_FROM     = process.env.GMAIL_FROM_NAME || 'Matthew Herrman | HOO';

// ── SAFETY GATE ───────────────────────────────────────────────────────────────
const IS_LIVE = process.argv.includes('--live');

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
// Reads templates from engine/outreach/templates/email-templates.md
// Returns array of { id, name, use_for, subject, body }

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

// ── BUILD EMAIL ───────────────────────────────────────────────────────────────
function buildEmail(lead, forceTemplateId) {
  const templates = loadTemplates();
  const template  = pickTemplate(lead, templates, forceTemplateId);
  const subject   = fillTemplate(template.subject, lead);
  const body      = fillTemplate(template.body, lead);
  const to        = lead.email;

  return { to, subject, body, templateId: template.id, templateName: template.name };
}

// ── PREVIEW ───────────────────────────────────────────────────────────────────
function preview(lead, forceTemplateId) {
  const email = buildEmail(lead, forceTemplateId);
  console.log('\n─────────────────────────────────────');
  console.log(`📧  TO:       ${email.to || '[no email]'}`);
  console.log(`📤  FROM:     ${GMAIL_FROM} <${GMAIL_USER}>`);
  console.log(`📋  TEMPLATE: #${email.templateId} — ${email.templateName}`);
  console.log(`📝  SUBJECT:  ${email.subject}`);
  console.log('─── BODY ───');
  console.log(email.body);
  console.log('─────────────────────────────────────\n');
  return email;
}

// ── SEND SINGLE ───────────────────────────────────────────────────────────────
async function sendEmail(lead, forceTemplateId) {
  if (!lead.email) {
    console.log(`  ⏭️  Skip ${lead.business || lead.business_name} — no email`);
    return null;
  }

  const email = preview(lead, forceTemplateId);

  if (!IS_LIVE) {
    console.log('  🔒  DRY RUN — not sent. Use --live to send.');
    return { status: 'dry-run', lead: lead.business || lead.business_name, to: email.to };
  }

  const transporter = getTransporter();

  try {
    const info = await transporter.sendMail({
      from:    `"${GMAIL_FROM}" <${GMAIL_USER}>`,
      to:      email.to,
      subject: email.subject,
      text:    email.body,
    });

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
// Expects a JSON file with an array of lead objects
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
    if (IS_LIVE) await sleep(3000); // 3s between sends — Gmail rate limit safety
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
    const info = await transporter.sendMail({
      from:    `"${GMAIL_FROM}" <${GMAIL_USER}>`,
      to:      toAddr,
      subject: '[HOO TEST] ' + email.subject,
      text:    `--- THIS IS A TEST EMAIL ---\n\n${email.body}\n\n--- END TEST ---`,
    });

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
\x1b[33mHOO Email Engine v1.0\x1b[0m — Gmail SMTP via Nodemailer

Commands:
  preview <lead.json>                  Preview email for a lead (dry run)
  send <lead.json> [--live]            Send email to one lead
  batch <leads.json> [--live]          Send batch from JSON array
  send-all [--live]                    Send to all lead files in engine/leads/
  test "email@addr" [--live]           Send test email to yourself
  templates                            List all available templates

Options:
  --live                 Actually send (default is dry run)
  --template=N           Force template number (1-6)

Safety: \x1b[33mAll sends are DRY RUN by default.\x1b[0m --live required to actually send.

Templates: engine/outreach/templates/email-templates.md
Log:       engine/data/email-log.json
      `);
  }
}

main().catch(console.error);

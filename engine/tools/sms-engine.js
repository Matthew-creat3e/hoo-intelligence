/**
 * HOO SMS Engine v2.0 — Twilio
 * Replaces carrier gateway SMS that doesn't deliver.
 * Cost: $0.0075/msg sent + $0.0075/msg received.
 * Inbound replies auto-route via webhook to n8n pipeline updater.
 *
 * Install: npm install twilio
 *
 * Setup:
 *   1. Sign up at twilio.com (free trial gives ~$15 credit)
 *   2. Get a phone number (~$1/mo)
 *   3. Add to .env:
 *      TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
 *      TWILIO_AUTH_TOKEN=your_auth_token
 *      TWILIO_PHONE=+18165551234
 *      MATTHEW_PHONE=+18049571003
 *
 * Usage:
 *   node sms-engine.js preview <lead.json>
 *   node sms-engine.js send <lead.json> --live
 *   node sms-engine.js send-all --live
 *   node sms-engine.js test "+18165559999" "Test message"
 *   node sms-engine.js webhook   (starts reply listener on port 3001)
 */

require('dotenv').config();
const fs   = require('fs');
const path = require('path');

// ── CONFIG ────────────────────────────────────────────────────────────────────
const LEADS_DIR = path.join('C:\\Users\\Matth\\hoo-workspace\\engine\\leads');
const LOG_FILE  = path.join('C:\\Users\\Matth\\hoo-workspace\\engine\\data\\sms-log.json');

const TWILIO_SID   = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const FROM_PHONE   = process.env.TWILIO_PHONE;
const MATTHEW      = process.env.MATTHEW_PHONE || '+18049571003';

// ── SAFETY GATE ───────────────────────────────────────────────────────────────
const IS_LIVE = process.argv.includes('--live');
const IS_TEST = process.argv.includes('--test-to');

if (!IS_LIVE && !IS_TEST) {
  console.log('\n⚠️  DRY RUN MODE — no messages will be sent');
  console.log('   Add --live to send for real');
  console.log('   Add --test-to=+1XXXXXXXXXX to send to yourself\n');
}

// ── SMS TEMPLATES ─────────────────────────────────────────────────────────────
function buildMessage(lead) {
  const name    = lead.owner_name || 'there';
  const biz     = lead.business;
  const city    = lead.city;
  const industry = lead.industry;

  // Punchy short — 4 lines max for SMS
  const templates = [
    // Template A — No website
    `Hey ${name}, this is Matthew from HOO.\n\nI noticed ${biz} doesn't have a website. I built you one — free to see.\n\nWant the link? herrmanonlineoutlook.com`,

    // Template B — Industry hook
    `Hey ${name} — most ${industry} businesses in ${city} are getting calls from Google. ${biz} isn't — yet.\n\nI built you a free site to change that. 2 min look? herrmanonlineoutlook.com`,

    // Template C — Direct demo
    `Hi ${name}, Matthew from HOO. I built ${biz} a free website — no catch.\n\nBuilt free. You pay only if you love it.\n\nSee it: herrmanonlineoutlook.com`,
  ];

  // Pick best template based on available data
  if (lead.no_website) return templates[0];
  if (lead.owner_name) return templates[1];
  return templates[2];
}

// ── PREVIEW ───────────────────────────────────────────────────────────────────
function preview(lead) {
  const msg = buildMessage(lead);
  const to  = lead.phone;
  console.log('\n─────────────────────────────────────');
  console.log(`📱  TO:      ${to}`);
  console.log(`📤  FROM:    ${FROM_PHONE || '[TWILIO_PHONE not set]'}`);
  console.log(`📝  MESSAGE:\n${msg}`);
  console.log(`📊  CHARS:   ${msg.length}/160`);
  console.log(`💰  COST:    ~$0.0075`);
  console.log('─────────────────────────────────────\n');
  return { to, msg };
}

// ── SEND ──────────────────────────────────────────────────────────────────────
async function sendSMS(lead) {
  if (!lead.phone) {
    console.log(`  ⏭️  Skip ${lead.business} — no phone`);
    return null;
  }

  const { to, msg } = preview(lead);

  if (!IS_LIVE && !IS_TEST) {
    console.log('  🔒  DRY RUN — not sent. Use --live to send.');
    return { status: 'dry-run', lead: lead.business };
  }

  // Redirect to Matthew's phone in test mode
  const sendTo = IS_TEST
    ? (process.argv.find(a => a.startsWith('--test-to='))?.split('=')[1] || MATTHEW)
    : to;

  if (!TWILIO_SID || !TWILIO_TOKEN) {
    console.log('  ❌  TWILIO credentials not set in .env');
    return null;
  }

  const client = require('twilio')(TWILIO_SID, TWILIO_TOKEN);

  try {
    const result = await client.messages.create({
      body: msg,
      from: FROM_PHONE,
      to: sendTo,
    });

    const logEntry = {
      date:      new Date().toISOString(),
      lead:      lead.business,
      id:        lead.id,
      to:        sendTo,
      sid:       result.sid,
      status:    result.status,
      template:  'punchy-short',
      live:      IS_LIVE,
    };

    _appendLog(logEntry);
    _updateLeadStage(lead, 'contacted');

    console.log(`  ✅  Sent to ${sendTo} [SID: ${result.sid}]`);
    return logEntry;

  } catch (err) {
    console.error(`  ❌  Failed: ${err.message}`);
    _appendLog({ date: new Date().toISOString(), lead: lead.business, error: err.message });
    return null;
  }
}

// ── SEND ALL ──────────────────────────────────────────────────────────────────
async function sendAll() {
  const leads = _loadAllLeads().filter(l => l.phone && l.stage !== 'contacted');
  console.log(`\n📬  Sending to ${leads.length} leads with phones (not yet contacted)`);

  let sent = 0;
  for (const lead of leads) {
    if (sent >= 25) {
      console.log('\n⏸️  Pause — 25 messages sent this session. Resume tomorrow.');
      break;
    }
    await sendSMS(lead);
    sent++;
    if (IS_LIVE) await _sleep(5000); // 5s delay between sends
  }

  console.log(`\n✅  Done. Sent ${sent} messages.`);
}

// ── REPLY WEBHOOK (n8n calls this when Twilio receives inbound SMS) ──────────
function startWebhook() {
  const http = require('http');
  const port = 3001;

  const server = http.createServer(async (req, res) => {
    if (req.method !== 'POST') { res.end(); return; }

    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const params = new URLSearchParams(body);
      const from  = params.get('From');
      const text  = params.get('Body')?.trim();

      console.log(`\n📩  REPLY from ${from}: "${text}"`);

      // Find matching lead by phone
      const leads = _loadAllLeads();
      const lead  = leads.find(l => l.phone?.replace(/\D/g,'') === from?.replace(/\D/g,''));

      if (lead) {
        console.log(`  👤  Matched: ${lead.business}`);
        _updateLeadStage(lead, 'responded');
        _appendLog({
          date:    new Date().toISOString(),
          type:    'inbound-reply',
          from,
          lead:    lead.business,
          message: text,
        });

        // Alert Matthew
        const client = require('twilio')(TWILIO_SID, TWILIO_TOKEN);
        client.messages.create({
          body: `🔥 HOO REPLY: ${lead.business} texted back: "${text}" — call ${from}`,
          from: FROM_PHONE,
          to:   MATTHEW,
        }).catch(e => console.error('Alert failed:', e.message));
      }

      // TwiML response (optional auto-reply)
      res.setHeader('Content-Type', 'text/xml');
      res.end(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>Thanks for reaching out! Matthew will call you shortly. herrmanonlineoutlook.com</Message>
</Response>`);
    });
  });

  server.listen(port, () => {
    console.log(`\n📡  HOO SMS Webhook listening on port ${port}`);
    console.log(`    Set Twilio webhook URL to: http://YOUR-IP:${port}/`);
    console.log('    n8n will also call this when Gmail replies come in');
  });
}

// ── HELPERS ───────────────────────────────────────────────────────────────────
function _loadAllLeads() {
  if (!fs.existsSync(LEADS_DIR)) return [];
  return fs.readdirSync(LEADS_DIR)
    .filter(f => f.endsWith('.json') && f.startsWith('LEAD-'))
    .map(f => { try { return JSON.parse(fs.readFileSync(path.join(LEADS_DIR, f))); } catch { return null; } })
    .filter(Boolean);
}

function _updateLeadStage(lead, stage) {
  const file = path.join(LEADS_DIR, lead.filename || `LEAD-${lead.id}-${lead.industry}-${lead.city}.json`);
  if (fs.existsSync(file)) {
    const data = JSON.parse(fs.readFileSync(file));
    data.stage = stage;
    data[`${stage}_date`] = new Date().toISOString().split('T')[0];
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
  }
}

function _appendLog(entry) {
  const dir = path.dirname(LOG_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  let log = [];
  try { log = JSON.parse(fs.readFileSync(LOG_FILE)); } catch {}
  log.push(entry);
  fs.writeFileSync(LOG_FILE, JSON.stringify(log, null, 2));
}

function _sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── CLI ────────────────────────────────────────────────────────────────────────
async function main() {
  const [,, cmd, arg] = process.argv;

  if (cmd === 'preview' && arg) {
    const lead = JSON.parse(fs.readFileSync(arg));
    preview(lead);
  } else if (cmd === 'send' && arg) {
    const lead = JSON.parse(fs.readFileSync(path.join(LEADS_DIR, arg)));
    await sendSMS(lead);
  } else if (cmd === 'send-all') {
    await sendAll();
  } else if (cmd === 'test' && arg) {
    const msg = process.argv[4] || 'HOO test message — if you got this it works!';
    if (!IS_LIVE) { console.log(`DRY RUN: would send "${msg}" to ${arg}`); return; }
    const client = require('twilio')(TWILIO_SID, TWILIO_TOKEN);
    const r = await client.messages.create({ body: msg, from: FROM_PHONE, to: arg });
    console.log(`✅  Test sent [SID: ${r.sid}]`);
  } else if (cmd === 'webhook') {
    startWebhook();
  } else {
    console.log(`
HOO SMS Engine v2.0 — Twilio

Commands:
  preview <lead.json>          Show message without sending
  send <lead.json> --live      Send to one lead
  send-all --live              Send to all leads with phones
  test "+1XXXXXXXXXX" "msg" --live   Send test message
  webhook                      Start inbound reply listener

Safety: All sends are DRY RUN by default. --live required to actually send.
    `);
  }
}

main().catch(console.error);

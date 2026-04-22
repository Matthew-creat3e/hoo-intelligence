/**
 * lead-to-obsidian.js — Lead JSON → Obsidian vault .md sync
 *
 * Writes a lead into HOO-Vault/02-Leads/ in the format matching
 * the hand-written reference files (KOG-Lawn-Landscaping.md etc.).
 *
 * Usage:
 *   node lead-to-obsidian.js sync <LEAD-NNN.json>    Single lead
 *   node lead-to-obsidian.js sync-all                 Backfill every lead
 *   node lead-to-obsidian.js sync-all --force         Overwrite existing .md
 */

const fs   = require('fs');
const path = require('path');

const LEADS_DIR = path.join(__dirname, '..', 'leads');
const VAULT_DIR = 'C:\\Users\\Matth\\Documents\\HOO-Vault\\02-Leads';
const FORCE     = process.argv.includes('--force');

// JSON pipeline stage → visual label in the vault
const STAGE_MAP = {
  found:             'DISCOVERED',
  researched:        'ENRICHED',
  audited:           'ENRICHED',
  approach_planned:  'SCORED',
  approved:          'SCORED',
  contacted:         'OUTREACH_SENT',
  responded:         'RESPONDED',
  meeting:           'RESPONDED',
  building:          'RESPONDED',
  review:            'RESPONDED',
  closed_won:        'CLOSED',
  closed_lost:       'CLOSED',
};

const PIPELINE = ['DISCOVERED', 'ENRICHED', 'SCORED', 'DEMO_BUILT', 'OUTREACH_SENT', 'RESPONDED', 'CLOSED'];

function slugFilename(business) {
  return business
    .replace(/[‘’']/g, '')          // drop apostrophes (Ray's → Rays)
    .replace(/,?\s*(LLC|Inc\.?|Co\.?|Corp\.?)$/i, '')
    .replace(/&/g, 'and')
    .replace(/[^A-Za-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    + '.md';
}

function tagify(s) {
  return (s || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

function renderPipeline(currentStage) {
  const current = STAGE_MAP[currentStage] || 'DISCOVERED';
  return PIPELINE.map(s => s === current ? `\`${s}\`` : s).join(' → ');
}

function renderOutreachTable(lead) {
  if (Array.isArray(lead.outreach_history) && lead.outreach_history.length > 0) {
    const rows = lead.outreach_history
      .map(h => `| ${h.date || '—'} | ${h.template || '—'} | ${h.response || 'Awaiting'} |`)
      .join('\n');
    return '| Date | Template | Response |\n|---|---|---|\n' + rows;
  }
  return '| Date | Template | Response |\n|---|---|---|\n| — | Not yet contacted | — |';
}

function buildMarkdown(lead) {
  const biz      = lead.business || lead.business_name || 'Unknown Business';
  const industry = lead.industry || 'unknown';
  const city     = lead.city || 'unknown';
  const phone    = lead.phone || '—';
  const email    = lead.email || '—';
  const addr     = [lead.address, lead.city, lead.state].filter(Boolean).join(', ') || '—';
  const website  = lead.website_url || (lead.no_website ? 'None found' : '—');
  const rating   = lead.google_rating || 'Unknown';
  const score    = lead.score != null ? `${lead.score} ${lead.tier || ''}`.trim() : 'Not scored';
  const found    = lead.found_date || 'unknown date';
  const source   = lead.source || 'hunt';
  const notes    = lead.notes || '';

  const tags = `#lead #${tagify(industry)} #${tagify(city)}`;

  const noteLines = [];
  if (notes) noteLines.push(`- ${notes.replace(/\n/g, ' ')}`);
  if (email !== '—') noteLines.push('- Has email — good candidate for first outreach');
  else noteLines.push('- No email found — phone outreach may be needed');
  if (lead.owner_name) noteLines.push(`- Owner: ${lead.owner_name}`);
  noteLines.push(`- Discovered ${found} via ${source}`);

  return `# ${biz}
${tags}

---

## Business Info
- **Lead ID:** ${lead.id || lead._filename || '—'}
- **Phone:** ${phone}
- **Email:** ${email}
- **Address:** ${addr}
- **Website:** ${website}
- **Google Rating:** ${rating}
- **Score:** ${score}

## Pipeline Stage
${renderPipeline(lead.stage)}

## Intel
- **Has website:** ${lead.no_website ? 'No' : (lead.website_url ? 'Yes' : 'Unknown')}
- **Mobile friendly:** ${lead.mobile_friendly || 'N/A'}
- **Social presence:** ${lead.social_presence || 'Unknown'}
- **Competitors nearby:** ${lead.competitors || '—'}

## Outreach History
${renderOutreachTable(lead)}

## Notes
${noteLines.join('\n')}

## Links
- Session discovered: [[01-Sessions/${found}]]
- Source JSON: \`engine/leads/${lead._filename || ''}\`
`;
}

function syncOne(leadJsonPath) {
  const raw  = fs.readFileSync(leadJsonPath, 'utf8');
  const lead = JSON.parse(raw);
  if (!lead._filename) lead._filename = path.basename(leadJsonPath);

  const biz       = lead.business || lead.business_name || 'Unknown';
  const filename  = slugFilename(biz);
  const outPath   = path.join(VAULT_DIR, filename);
  const exists    = fs.existsSync(outPath);

  if (exists && !FORCE) {
    console.log(`   ⏭   SKIP  ${filename}  (exists — use --force to overwrite)`);
    return { skipped: true, outPath };
  }

  const md = buildMarkdown(lead);
  fs.writeFileSync(outPath, md, 'utf8');
  console.log(`   ${exists ? '♻️  UPDATE' : '✅  CREATE'}  ${filename}`);
  return { skipped: false, outPath };
}

function syncAll() {
  if (!fs.existsSync(VAULT_DIR)) {
    console.error(`❌ Vault not found: ${VAULT_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(LEADS_DIR)
    .filter(f => f.startsWith('LEAD-') && f.endsWith('.json'))
    .sort();

  console.log(`\n📦  Syncing ${files.length} leads → ${VAULT_DIR}${FORCE ? ' (FORCE)' : ''}\n`);

  let created = 0, updated = 0, skipped = 0;
  for (const f of files) {
    const before = fs.existsSync(path.join(VAULT_DIR, slugFilename(
      JSON.parse(fs.readFileSync(path.join(LEADS_DIR, f), 'utf8')).business || 'Unknown'
    )));
    const result = syncOne(path.join(LEADS_DIR, f));
    if (result.skipped) skipped++;
    else if (before) updated++;
    else created++;
  }

  console.log(`\n📊  Done: ${created} created, ${updated} updated, ${skipped} skipped\n`);
}

// ── CLI ──────────────────────────────────────────────────────────────────────
const cmd = process.argv[2];
const arg = process.argv[3];

if (cmd === 'sync' && arg) {
  const p = path.isAbsolute(arg) ? arg : path.join(LEADS_DIR, arg);
  syncOne(p);
} else if (cmd === 'sync-all') {
  syncAll();
} else {
  console.log(`Usage:
  node lead-to-obsidian.js sync <LEAD-NNN.json>    Sync single lead to vault
  node lead-to-obsidian.js sync-all                 Backfill every lead
  node lead-to-obsidian.js sync-all --force         Overwrite existing .md files

Vault: ${VAULT_DIR}
Leads: ${LEADS_DIR}`);
}

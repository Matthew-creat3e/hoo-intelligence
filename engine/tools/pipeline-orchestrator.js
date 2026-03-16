/**
 * HOO Pipeline Orchestrator v2.1 — Hunt New → Demo → Approval Pipeline
 *
 * v2.1 change: huntLeads() now calls the Anthropic API with web_search tool
 * instead of lead-hunter-v3.py (which scraped Yelp and failed).
 * Same output contract — the rest of the pipeline is unchanged.
 *
 * Usage:
 *   node pipeline-orchestrator.js run                   Hunt 4 new leads + build approvals
 *   node pipeline-orchestrator.js run --count=2         Hunt specific number
 *   node pipeline-orchestrator.js single <lead.json>    Build approval for one lead
 *   node pipeline-orchestrator.js replace <approval.json> Hunt 1 replacement (different city/industry)
 *   node pipeline-orchestrator.js status                Show all approvals
 *
 * Output: engine/approvals/APPROVAL-{LEAD-ID}.json
 */

require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const fs   = require('fs');
const path = require('path');

const ROOT          = path.join(__dirname, '..', '..');
const LEADS_DIR     = path.join(ROOT, 'engine', 'leads');
const APPROVALS_DIR = path.join(ROOT, 'engine', 'approvals');
const DEMOS_DIR     = path.join(ROOT, 'outputs', 'demos');

// ── ENSURE DIRS ──────────────────────────────────────────────────────────────
[APPROVALS_DIR, DEMOS_DIR, LEADS_DIR].forEach(d => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

// ── LOAD TOOLS ───────────────────────────────────────────────────────────────
const { buildPrototype } = require('./auto-prototype');

// ── KC METRO CITIES & INDUSTRIES ─────────────────────────────────────────────
const CITIES = [
  'Independence MO', 'Blue Springs MO', "Lee's Summit MO",
  'Grain Valley MO', 'Raytown MO', 'Belton MO', 'Liberty MO',
  'Grandview MO', 'Pleasant Hill MO', 'Oak Grove MO',
  'Kansas City MO', 'Kansas City KS', 'Overland Park KS'
];

const INDUSTRIES = [
  'cleaning', 'lawn care', 'handyman', 'painting', 'landscaping',
  'moving', 'auto detailing', 'pressure washing', 'pet grooming',
  'tattoo', 'food truck', 'roofing', 'fencing', 'personal training',
  'barber', 'photography', 'junk removal', 'mobile mechanic'
];

// ── GET EXISTING LEAD FINGERPRINTS ───────────────────────────────────────────
// Returns a Set of "business_name|city" keys (lowercased) for dedup
function getExistingLeadKeys() {
  const keys = new Set();
  if (!fs.existsSync(LEADS_DIR)) return keys;
  fs.readdirSync(LEADS_DIR)
    .filter(f => f.startsWith('LEAD-') && f.endsWith('.json'))
    .forEach(f => {
      try {
        const d = JSON.parse(fs.readFileSync(path.join(LEADS_DIR, f), 'utf8'));
        const biz = (d.business || d.business_name || '').toLowerCase().trim();
        const city = (d.city || '').toLowerCase().trim();
        if (biz) keys.add(`${biz}|${city}`);
      } catch {}
    });
  return keys;
}

// ── GET NEXT LEAD ID ─────────────────────────────────────────────────────────
function getNextLeadId() {
  if (!fs.existsSync(LEADS_DIR)) return 1;
  const existing = fs.readdirSync(LEADS_DIR)
    .filter(f => f.startsWith('LEAD-') && f.endsWith('.json'))
    .map(f => {
      const match = f.match(/^LEAD-(\d+)-/);
      return match ? parseInt(match[1], 10) : 0;
    });
  return existing.length ? Math.max(...existing) + 1 : 1;
}

// ── GET USED CITY/INDUSTRY COMBOS IN CURRENT APPROVALS ──────────────────────
function getApprovalCombos() {
  const combos = [];
  if (!fs.existsSync(APPROVALS_DIR)) return combos;
  fs.readdirSync(APPROVALS_DIR)
    .filter(f => f.startsWith('APPROVAL-') && f.endsWith('.json'))
    .forEach(f => {
      try {
        const d = JSON.parse(fs.readFileSync(path.join(APPROVALS_DIR, f), 'utf8'));
        combos.push({
          city: (d.lead?.city || '').toLowerCase(),
          industry: (d.lead?.industry || '').toLowerCase(),
          status: d.status
        });
      } catch {}
    });
  return combos;
}

// ── PICK RANDOM COMBO AVOIDING GIVEN ─────────────────────────────────────────
function pickNewCombo(avoidCity, avoidIndustry) {
  const availableCities = CITIES.filter(c =>
    c.toLowerCase().split(' ')[0] !== (avoidCity || '').toLowerCase()
  );
  const availableIndustries = INDUSTRIES.filter(i =>
    i.toLowerCase() !== (avoidIndustry || '').toLowerCase()
  );

  const city = availableCities[Math.floor(Math.random() * availableCities.length)] || CITIES[0];
  const industry = availableIndustries[Math.floor(Math.random() * availableIndustries.length)] || INDUSTRIES[0];
  return { city, industry };
}

// ── PICK N RANDOM COMBOS FOR BATCH ──────────────────────────────────────────
function pickBatchCombos(count) {
  const usedCombos = getApprovalCombos();
  const usedKeys = new Set(usedCombos.map(c => `${c.industry}|${c.city}`));
  const combos = [];

  const shuffledCities = [...CITIES].sort(() => Math.random() - 0.5);
  const shuffledIndustries = [...INDUSTRIES].sort(() => Math.random() - 0.5);

  for (const industry of shuffledIndustries) {
    for (const city of shuffledCities) {
      const key = `${industry}|${city.toLowerCase().split(' ')[0]}`;
      if (!usedKeys.has(key)) {
        combos.push({ city, industry });
        usedKeys.add(key);
        if (combos.length >= count * 2) break;
      }
    }
    if (combos.length >= count * 2) break;
  }
  return combos;
}

// ── HUNT NEW LEADS VIA CLAUDE WEB SEARCH ─────────────────────────────────────
// Replaces lead-hunter-v3.py (Yelp scraper that failed).
// Calls Anthropic API with web_search tool — same stealth access Claude uses
// natively when finding leads like Shroomland and Tattoos by Glendon.
// Output contract: returns array of lead objects with _filename set.
async function huntLeads(industry, city) {
  console.log(`\n🔍  Hunting: "${industry}" in "${city}" via Claude web search...`);

  const existingKeys = getExistingLeadKeys();

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('  ❌  ANTHROPIC_API_KEY not set in .env — cannot hunt leads');
    return [];
  }

  const systemPrompt = `You are a lead finder for HOO, a web agency in Kansas City MO.
Search for local small businesses with NO website or a poor website.
Search Facebook, Google Maps, Yelp, their Facebook About section, and any local directories.
For contact info — check their Facebook page About tab, Google Maps listing, Yelp page, and any directory listings.
Return ONLY a JSON array. No markdown, no explanation, no code fences.
Each object must have these exact keys:
  business_name, owner_name (empty string if not found), phone (dig hard — check every source),
  email (dig hard — check Facebook About, Google listing, Yelp, their own website if any),
  address, city, state, industry, source, no_website (true/false), website_url (empty string if none),
  notes (one sentence why they qualify)
Return 5-10 leads. Prioritize leads where you found both phone AND email.`;

  const userMessage = `Find ${industry} businesses in ${city} that have no website or a very poor website. 
Search Facebook business pages, Google Maps listings, Yelp, and local directories.
VERIFY each one — do not include businesses that clearly have a working professional website.
Return as a JSON array only.`;

  let rawText = '';
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2000,
        system: systemPrompt,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages: [{ role: 'user', content: userMessage }]
      })
    });

    if (response.status === 429) {
      console.log(`  ⏳  Rate limited — waiting 60s before retry...`);
      await new Promise(r => setTimeout(r, 60000));
      // Retry once
      const retry = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 2000,
          system: systemPrompt,
          tools: [{ type: 'web_search_20250305', name: 'web_search' }],
          messages: [{ role: 'user', content: userMessage }]
        })
      });
      if (!retry.ok) {
        const err = await retry.text();
        console.error(`  ❌  Retry failed ${retry.status}: ${err.slice(0, 200)}`);
        return [];
      }
      const data = await retry.json();
      rawText = data.content
        .filter(block => block.type === 'text')
        .map(block => block.text)
        .join('');
    } else if (!response.ok) {
      const err = await response.text();
      console.error(`  ❌  Anthropic API error ${response.status}: ${err}`);
      return [];
    } else {
      const data = await response.json();

      // Extract text blocks from response (may also contain tool_use/tool_result blocks)
      rawText = data.content
        .filter(block => block.type === 'text')
        .map(block => block.text)
        .join('');
    }

  } catch (err) {
    console.error(`  ❌  Request failed: ${err.message}`);
    return [];
  }

  // Parse the JSON array out of the response
  let candidates = [];
  try {
    // Strip any accidental markdown fences just in case
    const clean = rawText.replace(/```json|```/g, '').trim();
    // Find the first [ ... ] array in the response
    const arrayMatch = clean.match(/\[[\s\S]*\]/);
    if (!arrayMatch) throw new Error('No JSON array found in response');
    candidates = JSON.parse(arrayMatch[0]);
  } catch (err) {
    console.error(`  ❌  Failed to parse Claude response as JSON: ${err.message}`);
    console.error(`  Raw response preview: ${rawText.slice(0, 300)}`);
    return [];
  }

  if (!Array.isArray(candidates) || !candidates.length) {
    console.log('  ⚠️  Claude returned 0 candidates');
    return [];
  }

  // Dedup against existing leads and write new ones to disk
  const newLeads = [];
  let nextId = getNextLeadId();
  const citySlug = city.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '');

  for (const candidate of candidates) {
    const bizName = (candidate.business_name || '').trim();
    const bizCity = (candidate.city || city.split(' ')[0]).toLowerCase().trim();
    if (!bizName) continue;

    const dedupeKey = `${bizName.toLowerCase()}|${bizCity}`;
    if (existingKeys.has(dedupeKey)) {
      console.log(`  ⏭️  Skipping duplicate: ${bizName}`);
      continue;
    }

    // Score the lead
    let score = 50; // base HOT
    if (candidate.no_website === true) score += 20;
    if (candidate.owner_name) score += 10;
    if (candidate.phone) score += 10;
    if (candidate.email) score += 10;

    const idPadded = String(nextId).padStart(3, '0');
    const industrySlug = industry.toLowerCase().replace(/\s+/g, '-');
    const filename = `LEAD-${idPadded}-${industrySlug}-${citySlug}.json`;
    const leadId = `LEAD-${idPadded}`;

    const lead = {
      id: leadId,
      business: bizName,
      business_name: bizName,
      owner_name: candidate.owner_name || '',
      phone: candidate.phone || '',
      email: candidate.email || '',
      address: candidate.address || '',
      city: candidate.city || city.split(' ')[0],
      state: candidate.state || 'MO',
      industry: industry,
      source: candidate.source || 'web_search',
      no_website: candidate.no_website !== false,
      website_url: candidate.website_url || '',
      notes: candidate.notes || '',
      score: score,
      tier: score >= 50 ? 'HOT' : score >= 30 ? 'WARM' : 'COLD',
      stage: 'found',
      found_date: new Date().toISOString().split('T')[0],
      _filename: filename
    };

    fs.writeFileSync(path.join(LEADS_DIR, filename), JSON.stringify(lead, null, 2), 'utf8');
    newLeads.push(lead);
    existingKeys.add(dedupeKey);
    nextId++;

    console.log(`  ✅  ${leadId}: ${bizName} (${lead.city}) — score ${score}`);
  }

  console.log(`  📦  ${newLeads.length} brand new leads written to engine/leads/`);
  return newLeads;
}

// ── BUILD EMAIL PREVIEW ──────────────────────────────────────────────────────
function buildEmailPreview(lead, demoFilename) {
  const biz = lead.business || lead.business_name || 'your business';
  const ownerName = (lead.owner_name || lead.owner || '').trim();
  const ownerFirst = ownerName ? ownerName.split(' ')[0] : 'there';

  return {
    to: lead.email || '[no email]',
    subject: `built something for ${biz}`,
    body: `Hey ${ownerFirst},

I'm a concrete worker out of Kansas City - Local 1290. I've been learning web design at night and building free sites for local businesses to grow my portfolio.

I noticed ${biz} doesn't have a website so I built you one. Took me a few hours. No charge to look at it:

[link will be inserted on send]

If you love it, I'll finish the full build for a flat fee. If not, no hard feelings - keep the design.

Either way I hope it helps.

- Matthew Herrman
HOO - Kansas City, MO
(804) 957-1003
herrmanonlineoutlook.com`
  };
}

// ── BUILD SOCIAL CAPTIONS ────────────────────────────────────────────────────
function buildSocialCaptions(lead) {
  const biz = lead.business || lead.business_name || 'a local business';
  const city = lead.city || 'KC';
  const industry = lead.industry || 'business';

  return {
    facebook: `Built ${biz}'s entire homepage — completely free for them to see first.\n\nThey're a ${industry} business in ${city}, MO. No website before this. Now they've got a full site with real photos, mobile layout, animations, booking CTA — everything.\n\nThey paid nothing until they saw it live and loved it. That's HOO. Build free. Pay on approval.\n\nherrmanonlineoutlook.com`,
    instagram: `${biz} had no website. Now they do.\n\nBuilt free. Paid on approval. That's how HOO works.\n\nFull custom homepage for a ${industry} business in ${city}, MO — real photos, mobile-first, booking CTA ready.\n\nherrmanonlineoutlook.com\n\n#HOO #WebDesign #${city.replace(/\s/g,'')}MO #SmallBusiness #ShopifyPartner`,
    tiktok: `POV: You build a ${industry} business a free website and they see it for the first time.\n\n${biz} in ${city} — from zero web presence to a full custom homepage. Build free, pay on approval. herrmanonlineoutlook.com`
  };
}

// ── PROCESS SINGLE LEAD → APPROVAL ──────────────────────────────────────────
async function processLead(leadPath) {
  let lead;
  try {
    lead = JSON.parse(fs.readFileSync(leadPath, 'utf8'));
  } catch (err) {
    console.error(`❌  Cannot read: ${err.message}`);
    return null;
  }

  const biz = lead.business || lead.business_name || 'Unknown';
  const leadId = lead.id || 'UNKNOWN';

  // Skip if approval already exists
  const approvalFile = path.join(APPROVALS_DIR, `APPROVAL-${leadId}.json`);
  if (fs.existsSync(approvalFile)) {
    console.log(`  ⏭️  Skipping ${biz} — approval already exists`);
    return null;
  }

  console.log(`\n━━━ Processing: ${biz} (${leadId}) ━━━`);

  // Step 1: Build demo
  console.log('\n📸  Building demo...');
  let demoResult;
  try {
    demoResult = await buildPrototype(leadPath);
  } catch (err) {
    console.error(`  ❌  Demo build failed: ${err.message}`);
    return null;
  }

  if (!demoResult) {
    console.error('  ❌  Demo build returned no result');
    return null;
  }

  // Step 2: Build email preview
  console.log('📧  Building email preview...');
  const emailPreview = buildEmailPreview(lead, demoResult.filename);

  // Step 3: Build social captions
  console.log('📱  Building social captions...');
  const socialCaptions = buildSocialCaptions(lead);

  // Step 4: Save approval
  const approval = {
    id: leadId,
    lead: {
      business: biz,
      owner: lead.owner_name || lead.owner || '',
      phone: lead.phone || '',
      email: lead.email || '',
      city: lead.city || '',
      state: lead.state || 'MO',
      industry: lead.industry || '',
      score: lead.score || 0,
      tier: lead.tier || 'HOT'
    },
    demo_path: `outputs/demos/${demoResult.filename}`,
    email_preview: emailPreview,
    social_captions: socialCaptions,
    status: 'pending',
    created_date: new Date().toISOString().split('T')[0]
  };

  fs.writeFileSync(approvalFile, JSON.stringify(approval, null, 2), 'utf8');
  console.log(`✅  Approval saved: APPROVAL-${leadId}.json`);

  return approval;
}

// ── SLEEP HELPER ────────────────────────────────────────────────────────────
function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

// ── RUN: HUNT NEW + BUILD APPROVALS ─────────────────────────────────────────
async function runBatch(targetCount) {
  console.log(`\n🚀  HOO Pipeline Orchestrator v2.1`);
  console.log(`    Target: ${targetCount} brand new leads → demos → approvals`);
  console.log(`    Hunt method: Claude web search (Anthropic API)`);
  console.log(`${'━'.repeat(55)}\n`);

  const combos = pickBatchCombos(targetCount);
  let processed = 0;

  let isFirstHunt = true;
  for (const { city, industry } of combos) {
    if (processed >= targetCount) break;

    if (!isFirstHunt) {
      console.log('\n⏳  Waiting 65s before next hunt (rate limit cooldown)...');
      await sleep(65000);
    }
    isFirstHunt = false;

    const newLeads = await huntLeads(industry, city);

    for (const lead of newLeads) {
      if (processed >= targetCount) break;
      const leadPath = path.join(LEADS_DIR, lead._filename);
      const result = await processLead(leadPath);
      if (result) processed++;
    }
  }

  if (processed === 0) {
    console.log('\n⚠️  No new leads found. Check:');
    console.log('    - ANTHROPIC_API_KEY in .env');
    console.log('    - All combos tried may already exist in engine/leads/');
  }

  console.log(`\n${'━'.repeat(55)}`);
  console.log(`✅  Done. ${processed}/${targetCount} new approvals created.`);
  console.log(`📂  Open War Room → Approvals to review`);
  console.log(`${'━'.repeat(55)}\n`);

  // Auto-push demos to GitHub Pages so email links work immediately
  if (processed > 0) {
    try {
      const { execSync } = require('child_process');
      // Copy new demos to /demos/ with clean business names (GitHub Pages serves from there)
      const demosDir = path.join(ROOT, 'demos');
      if (!fs.existsSync(demosDir)) fs.mkdirSync(demosDir, { recursive: true });
      fs.readdirSync(path.join(ROOT, 'outputs', 'demos'))
        .filter(f => f.startsWith('LEAD-') && f.endsWith('.html'))
        .forEach(f => {
          const src = path.join(ROOT, 'outputs', 'demos', f);
          // Try to find matching lead JSON to get clean business name
          const leadIdMatch = f.match(/^(LEAD-\d+)/);
          let cleanFilename = f;
          if (leadIdMatch) {
            const matchingLead = fs.readdirSync(LEADS_DIR)
              .filter(lf => lf.startsWith(leadIdMatch[1] + '-') && lf.endsWith('.json'));
            if (matchingLead.length) {
              try {
                const ld = JSON.parse(fs.readFileSync(path.join(LEADS_DIR, matchingLead[0]), 'utf8'));
                const bizName = ld.business || ld.business_name || '';
                if (bizName) {
                  const clean = bizName.replace(/[^a-zA-Z0-9\s]/g, '').split(' ')
                    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
                  cleanFilename = clean + '.html';
                }
              } catch {}
            }
          }
          fs.copyFileSync(src, path.join(demosDir, cleanFilename));
        });
      execSync('git add demos/ outputs/demos/', { cwd: ROOT });
      const status = execSync('git status --porcelain demos/ outputs/demos/', { cwd: ROOT, encoding: 'utf8' });
      if (status.trim()) {
        execSync('git commit -m "deploy: new demo pages"', { cwd: ROOT });
        execSync('git push origin master', { cwd: ROOT, timeout: 30000 });
        console.log('🚀  Demos pushed to GitHub Pages — links will be live in ~1 min');
      }
    } catch (err) {
      console.warn(`⚠️  Auto-push failed: ${err.message} — run "git push" manually before sending emails`);
    }
  }
}

// ── REPLACE: HUNT 1 NEW LEAD TO REPLACE A REJECTION ────────────────────────
async function replaceRejected(approvalFilename) {
  const approvalPath = path.join(APPROVALS_DIR, approvalFilename);
  if (!fs.existsSync(approvalPath)) {
    console.error(`❌  Approval not found: ${approvalFilename}`);
    return null;
  }

  const rejected = JSON.parse(fs.readFileSync(approvalPath, 'utf8'));
  const rejectedCity = rejected.lead?.city || '';
  const rejectedIndustry = rejected.lead?.industry || '';

  console.log(`\n🔄  Replacing rejected lead: ${rejected.lead?.business}`);
  console.log(`    Avoiding: ${rejectedIndustry} in ${rejectedCity}`);

  const { city, industry } = pickNewCombo(rejectedCity, rejectedIndustry);
  console.log(`    Hunting: ${industry} in ${city}`);

  const newLeads = await huntLeads(industry, city);

  if (!newLeads.length) {
    console.log('  ⚠️  No new leads found for replacement. Try a different combo.');
    return null;
  }

  const lead = newLeads[0];
  const leadPath = path.join(LEADS_DIR, lead._filename);
  const result = await processLead(leadPath);

  if (result) {
    console.log(`\n✅  Replacement ready: ${result.lead.business} (${result.lead.city})`);
  }
  return result;
}

// ── STATUS ───────────────────────────────────────────────────────────────────
function showStatus() {
  if (!fs.existsSync(APPROVALS_DIR)) {
    console.log('\n📂  No approvals directory yet.\n');
    return;
  }

  const files = fs.readdirSync(APPROVALS_DIR)
    .filter(f => f.startsWith('APPROVAL-') && f.endsWith('.json'));

  if (!files.length) {
    console.log('\n📂  No approvals yet. Run: node pipeline-orchestrator.js run\n');
    return;
  }

  const pending = [], sent = [], rejected = [];
  for (const f of files) {
    try {
      const d = JSON.parse(fs.readFileSync(path.join(APPROVALS_DIR, f), 'utf8'));
      d._filename = f;
      if (d.status === 'pending') pending.push(d);
      else if (d.status === 'sent') sent.push(d);
      else if (d.status === 'rejected') rejected.push(d);
    } catch {}
  }

  console.log(`\n📋  Approvals: ${pending.length} pending · ${sent.length} sent · ${rejected.length} rejected\n`);
  console.log('  Status     | Lead ID    | Business                   | City            | Industry       | Score');
  console.log('  -----------|------------|----------------------------|-----------------|----------------|------');

  for (const d of [...pending, ...sent, ...rejected]) {
    const status = d.status === 'pending' ? '⏳ PENDING' :
                   d.status === 'sent'    ? '✅ SENT   ' :
                   d.status === 'rejected'? '❌ REJECT ' : d.status;
    console.log(`  ${status} | ${(d.id || '').padEnd(10)} | ${(d.lead?.business || '').padEnd(26)} | ${(d.lead?.city || '').padEnd(15)} | ${(d.lead?.industry || '').padEnd(14)} | ${d.lead?.score || 0}`);
  }
  console.log('');
}

// ── CALL QUEUE ──────────────────────────────────────────────────────────────
function showCallQueue() {
  if (!fs.existsSync(APPROVALS_DIR)) {
    console.log('\n📂  No approvals directory yet.\n');
    return;
  }

  const files = fs.readdirSync(APPROVALS_DIR)
    .filter(f => f.startsWith('APPROVAL-') && f.endsWith('.json'));

  const callLeads = [];
  for (const f of files) {
    try {
      const d = JSON.parse(fs.readFileSync(path.join(APPROVALS_DIR, f), 'utf8'));
      if (d.status !== 'pending') continue;
      const email = (d.lead?.email || '').trim();
      const noEmail = !email || email === '[no email]' || email === 'null' || email === 'undefined';
      if (noEmail) {
        callLeads.push(d);
      }
    } catch {}
  }

  if (!callLeads.length) {
    console.log('\n📞  No leads need a phone call - all pending leads have emails.\n');
    return;
  }

  console.log(`\n📞  CALL QUEUE - ${callLeads.length} lead${callLeads.length === 1 ? '' : 's'} need${callLeads.length === 1 ? 's' : ''} a phone call`);
  console.log('━'.repeat(55));

  callLeads.forEach((d, i) => {
    const biz      = d.lead?.business || 'Unknown';
    const owner    = d.lead?.owner || 'N/A';
    const phone    = d.lead?.phone || '';
    const city     = d.lead?.city || '';
    const state    = d.lead?.state || 'MO';
    const industry = d.lead?.industry || '';
    const leadId   = d.id || '';

    console.log(`#${i + 1}  ${biz}`);
    console.log(`    Owner:    ${owner || 'N/A'}`);
    console.log(`    Phone:    ${phone}`);
    console.log(`    City:     ${city} ${state}`);
    console.log(`    Industry: ${industry}`);
    console.log(`    Script:   "Hey, this is Matthew from HOO - I built ${biz} a free website. Can I send it over to you? What's the best email?"`);
    console.log(`    Lead ID:  ${leadId}`);
    console.log('━'.repeat(55));
  });

  console.log('');
}

// ── ADD EMAIL + SEND DEMO WITH ATTACHMENT ───────────────────────────────────
async function addEmail(leadId, email) {
  if (!leadId || !email) {
    console.log('Usage: node pipeline-orchestrator.js add-email <LEAD-ID> <email>');
    return;
  }

  // Normalize leadId — ensure it has LEAD- prefix
  if (!leadId.startsWith('LEAD-')) leadId = `LEAD-${leadId}`;

  // Find approval file
  const approvalFile = path.join(APPROVALS_DIR, `APPROVAL-${leadId}.json`);
  if (!fs.existsSync(approvalFile)) {
    console.error(`❌  Approval not found: APPROVAL-${leadId}.json`);
    return;
  }

  // Find lead file
  const leadFiles = fs.readdirSync(LEADS_DIR)
    .filter(f => f.startsWith(`${leadId}-`) && f.endsWith('.json'));

  if (!leadFiles.length) {
    console.error(`❌  Lead file not found matching ${leadId}-*.json in engine/leads/`);
    return;
  }

  const leadFilename = leadFiles[0];
  const leadPath = path.join(LEADS_DIR, leadFilename);

  // Update lead file
  const lead = JSON.parse(fs.readFileSync(leadPath, 'utf8'));
  lead.email = email;
  fs.writeFileSync(leadPath, JSON.stringify(lead, null, 2), 'utf8');
  console.log(`📝  Updated ${leadFilename} with email: ${email}`);

  // Update approval file
  const approval = JSON.parse(fs.readFileSync(approvalFile, 'utf8'));
  approval.lead.email = email;
  approval.email_preview.to = email;
  approval.status = 'sent';
  approval.sent_date = new Date().toISOString().split('T')[0];
  fs.writeFileSync(approvalFile, JSON.stringify(approval, null, 2), 'utf8');
  console.log(`📝  Updated APPROVAL-${leadId}.json - status → sent`);

  // Resolve demo file path
  const demoRelPath = approval.demo_path || '';
  const demoFullPath = path.join(ROOT, demoRelPath);
  if (!demoRelPath || !fs.existsSync(demoFullPath)) {
    console.error(`❌  Demo file not found: ${demoRelPath}`);
    return;
  }

  const biz = approval.lead?.business || lead.business || lead.business_name || 'your business';
  const ownerName = (approval.lead?.owner || lead.owner_name || lead.owner || '').trim();
  const ownerFirst = ownerName ? ownerName.split(' ')[0] : 'there';

  // Build live demo URL on GitHub Pages with clean business name
  const cleanName = biz.replace(/[^a-zA-Z0-9\s]/g, '').split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
  const cleanDemoFilename = `${cleanName}.html`;
  const liveUrl = `https://matthew-creat3e.github.io/hoo-intelligence/demos/${cleanDemoFilename}`;

  // Copy demo to /demos/ with clean name so the URL works
  const demosDir = path.join(ROOT, 'demos');
  if (!fs.existsSync(demosDir)) fs.mkdirSync(demosDir, { recursive: true });
  fs.copyFileSync(demoFullPath, path.join(demosDir, cleanDemoFilename));

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
  console.log(`\n📧  Sending demo to ${email}...`);
  try {
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    const info = await transporter.sendMail({
      from: `"Matthew Herrman | HOO" <${process.env.GMAIL_USER}>`,
      to: email,
      subject,
      text: bodyText,
    });

    console.log(`🔗  Live URL: ${liveUrl}`);
    console.log(`✅  Demo sent to ${email} [${info.messageId}]`);

    // Log to email-log.json
    const logFile = path.join(ROOT, 'engine', 'data', 'email-log.json');
    const logDir  = path.dirname(logFile);
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
    let log = [];
    try { log = JSON.parse(fs.readFileSync(logFile, 'utf8')); } catch {}
    log.push({
      date:       new Date().toISOString(),
      lead:       biz,
      id:         leadId,
      to:         email,
      subject,
      source:     'add-email',
      messageId:  info.messageId,
      status:     'sent',
      liveUrl,
    });
    fs.writeFileSync(logFile, JSON.stringify(log, null, 2), 'utf8');

    // Auto-push demo to GitHub Pages so the link works
    try {
      const { execSync } = require('child_process');
      execSync('git add demos/', { cwd: ROOT });
      const status = execSync('git status --porcelain demos/', { cwd: ROOT, encoding: 'utf8' });
      if (status.trim()) {
        execSync(`git commit -m "deploy: ${cleanName} demo"`, { cwd: ROOT });
        execSync('git push origin master', { cwd: ROOT, timeout: 30000 });
        console.log('🚀  Demo pushed to GitHub Pages — link will be live in ~1 min');
      }
    } catch (pushErr) {
      console.warn(`⚠️  Auto-push failed: ${pushErr.message} — run "git push" manually`);
    }
  } catch (err) {
    console.error(`❌  Email send failed: ${err.message}`);
    return;
  }
}

// ── REJECT BY LEAD ID ───────────────────────────────────────────────────────
function rejectById(leadId) {
  if (!leadId.startsWith('LEAD-')) leadId = `LEAD-${leadId}`;

  const approvalFile = path.join(APPROVALS_DIR, `APPROVAL-${leadId}.json`);
  if (!fs.existsSync(approvalFile)) {
    console.error(`❌  Approval not found: APPROVAL-${leadId}.json`);
    return false;
  }

  const approval = JSON.parse(fs.readFileSync(approvalFile, 'utf8'));
  approval.status = 'rejected';
  approval.rejected_date = new Date().toISOString().split('T')[0];
  fs.writeFileSync(approvalFile, JSON.stringify(approval, null, 2), 'utf8');
  console.log(`❌  ${approval.lead?.business || leadId} marked as not interested`);
  return true;
}

// ── CLI ──────────────────────────────────────────────────────────────────────
async function main() {
  const [,, cmd, arg] = process.argv;
  const countArg = process.argv.find(a => a.startsWith('--count='));
  const count = countArg ? parseInt(countArg.split('=')[1], 10) : 4;

  switch (cmd) {
    case 'run':
      await runBatch(count);
      break;

    case 'single':
      if (!arg) { console.log('Usage: node pipeline-orchestrator.js single <lead.json>'); return; }
      await processLead(arg);
      break;

    case 'replace':
      if (!arg) { console.log('Usage: node pipeline-orchestrator.js replace <APPROVAL-XXX.json>'); return; }
      await replaceRejected(arg);
      break;

    case 'status':
      showStatus();
      break;

    case 'calls':
      showCallQueue();
      break;

    case 'add-email': {
      const emailArg = process.argv[4];
      addEmail(arg, emailArg);
      break;
    }

    case 'reject': {
      if (!arg) { console.log('Usage: node pipeline-orchestrator.js reject <LEAD-ID>'); return; }
      rejectById(arg);
      break;
    }

    default:
      console.log(`
\x1b[33mHOO Pipeline Orchestrator v2.1\x1b[0m — Hunt New → Demo → Approval

Commands:
  run                      Hunt 4 brand new leads + build approvals
  run --count=N            Hunt N new leads
  single <lead.json>       Build approval for one specific lead
  replace <approval.json>  Hunt 1 replacement (different city/industry than rejected)
  status                   Show all approvals
  calls                    Show phone call queue (pending leads with no email)
  add-email <ID> <email>   Add email to lead + send demo immediately
  reject <LEAD-ID>         Mark lead as not interested

Pipeline:
  1. Pick random city/industry combos (avoids duplicates)
  2. Call Anthropic API (web_search tool) to find no-website businesses
  3. Dedup against engine/leads/ — only brand new businesses
  4. Write new LEAD-{ID}-{industry}-{city}.json files
  5. Build demo for each (auto-prototype + Pexels photos)
  6. Generate email preview (Template 7) + social captions
  7. Save to engine/approvals/APPROVAL-{ID}.json
  8. Matthew reviews in War Room → Approvals tab
  9. On reject → auto-hunts replacement from different city/industry

Requires: ANTHROPIC_API_KEY in engine/tools/.env
Output:   engine/approvals/
      `);
  }
}

module.exports = { processLead, huntLeads, replaceRejected, buildEmailPreview, buildSocialCaptions, showCallQueue, addEmail, rejectById };

if (require.main === module) {
  main().catch(console.error);
}
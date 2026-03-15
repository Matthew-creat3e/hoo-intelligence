#!/usr/bin/env node
/**
 * HOO Social Post Manager
 * Manages the content queue, generates captions manually, tracks post performance.
 * Used alongside the n8n social-content-engine workflow.
 *
 * Usage:
 *   node post-manager.js queue                    -- show queued posts
 *   node post-manager.js generate [store] [section] -- generate caption for build
 *   node post-manager.js approve [filename]       -- mark post as approved
 *   node post-manager.js stats                    -- what content is performing
 */

const fs   = require('fs');
const path = require('path');
const https = require('https');

const BASE      = 'C:\\Users\\Matth\\hoo-workspace';
const QUEUE     = path.join(BASE, 'social-engine', 'queue');
const POSTED    = path.join(BASE, 'social-engine', 'posted');
const INTEL     = path.join(BASE, 'memory', 'social-intel.json');

[QUEUE, POSTED].forEach(d => fs.existsSync(d) || fs.mkdirSync(d, { recursive: true }));

// ── CDN ASSETS (already uploaded) ────────────────────────────────────────────
const CDN = 'https://cdn.shopify.com/s/files/1/0658/1911/5587/files/';
const ASSETS = {
  'noreturn-before':    CDN + 'preview.webp',
  'noreturn-after':     CDN + 'nr-homepage-showcase.png',
  'god-quest-before':   CDN + 'homepage-fold.png',
  'god-quest-after':    CDN + 'nr-god-quest-showcase.png',
  'best-sellers-after': CDN + 'nr-best-sellers-showcase.png',
  'tcb-after':          CDN + 'preview_3.webp',
};

// ── HOO VOICE ─────────────────────────────────────────────────────────────────
const HOO_VOICE = `
You are writing social content for HOO (herrmanonlineoutlook.com).
Owner: Matthew Herrman — a Journeyman Laborer from Independence MO who learned AI and now builds 
premium Shopify websites. Blue collar turned builder. Dad. Grinder. Faith in the work.

HOO model: "Build free, pay on approval" — zero risk for the client.
Every post should feel raw, real, earned. Not marketing fluff.
Target audience: local small business owners in KC metro who need a website.

Tone rules:
- Short punchy sentences
- Real talk — no corporate speak
- Mention the free build model
- Local pride (KC, Independence, Missouri)
- End with herrmanonlineoutlook.com
`.trim();

// ── CAPTION TEMPLATES (no AI needed for these) ───────────────────────────────
const CAPTION_TEMPLATES = {
  before_after: (store, section) => ({
    facebook: `Built this ${section} for ${store} — completely free for them to see first.\n\nThey paid nothing until they saw it live and loved it.\n\nThat's HOO. Build free. Pay on approval. No risk to you.\n\nIf your business doesn't have a website yet, I'll build you one the same way.\n\nherrmanonlineoutlook.com`,

    instagram: `Built ${store}'s ${section} for free. They saw it live before paying a cent.\n\nBuild free. Pay only if you love it.\n\nherrmanonlineoutlook.com\n\n#shopify #websitedesign #smallbusiness #kcmo #independencemo #webdesign #entrepreneur #buildingbusiness #localbusiness #freelancewebdesign`,

    tiktok: `Built this whole ${section} before they paid a single dollar. That's the HOO way. herrmanonlineoutlook.com`,
  }),

  no_website_pitch: (industry, city) => ({
    facebook: `There are ${industry} businesses in ${city} right now losing jobs to competitors who have websites.\n\nCustomers Google first. If you're not there — that job goes to someone else.\n\nI build websites for ${industry} businesses for free. You see it live. You pay only if you love it.\n\nDM me or go to herrmanonlineoutlook.com`,

    instagram: `${industry} businesses in ${city} — your competitors are getting Google calls you're not.\n\nI'll build you a website free. You pay only if you love it.\n\nherrmanonlineoutlook.com\n\n#${industry.replace(/\s/,'')} #${city.replace(/\s/,'').toLowerCase()} #kcmo #smallbusiness #websitedesign #localbusiness`,

    tiktok: `${industry} businesses without a website are losing money every single day. I'll build yours free. herrmanonlineoutlook.com`,
  }),

  build_story: (store, what_changed) => ({
    facebook: `This is what happens when a ${store} stops relying on Facebook and gets a real website.\n\n${what_changed}\n\nBuilt free. They paid only when they saw it and loved it.\n\nherrmanonlineoutlook.com — build free, pay on approval`,

    instagram: `${store} transformation.\n\n${what_changed}\n\nBuilt free → paid on approval → live.\n\nherrmanonlineoutlook.com\n\n#websitedesign #shopify #smallbusiness #beforeandafter #buildingbusiness`,

    tiktok: `${store} had no website. Now they have this. Built it free first. herrmanonlineoutlook.com`,
  }),
};

// ── QUEUE VIEWER ──────────────────────────────────────────────────────────────
function showQueue() {
  const files = fs.readdirSync(QUEUE).filter(f => f.endsWith('.json'));
  if (!files.length) { console.log('Queue is empty. Run: node post-manager.js generate'); return; }

  console.log(`\n📱  HOO SOCIAL QUEUE (${files.length} posts)\n`);
  files.forEach((f, i) => {
    const post = JSON.parse(fs.readFileSync(path.join(QUEUE, f)));
    console.log(`${i+1}. ${f}`);
    console.log(`   Store: ${post.store} | Section: ${post.section}`);
    console.log(`   Status: ${post.status}`);
    console.log(`   Facebook preview: ${post.captions?.facebook?.slice(0,80)}...`);
    console.log();
  });
}

// ── GENERATE CAPTION ──────────────────────────────────────────────────────────
function generateCaption(store, section, type = 'before_after') {
  const today = new Date().toISOString().split('T')[0];
  const slug  = section.toLowerCase().replace(/\s+/g, '-');
  const fname = `SOCIAL-${today}-${slug}.json`;

  let captions;
  if (type === 'before_after') {
    captions = CAPTION_TEMPLATES.before_after(store, section);
  } else if (type === 'pitch') {
    captions = CAPTION_TEMPLATES.no_website_pitch(store, section);
  } else {
    captions = CAPTION_TEMPLATES.build_story(store, section);
  }

  const post = {
    date: today,
    store, section, type,
    captions,
    status: 'queued',
    filename: fname,
    assets: {
      before: ASSETS[`${store.toLowerCase().replace(/\s+/g,'-')}-before`] || null,
      after:  ASSETS[`${store.toLowerCase().replace(/\s+/g,'-')}-after`] || null,
    }
  };

  fs.writeFileSync(path.join(QUEUE, fname), JSON.stringify(post, null, 2));
  console.log(`\n✅  Post queued: ${fname}`);
  console.log('\n📘  FACEBOOK:');
  console.log(captions.facebook);
  console.log('\n📸  INSTAGRAM:');
  console.log(captions.instagram);
  console.log('\n🎵  TIKTOK:');
  console.log(captions.tiktok);
  console.log(`\n📁  File: ${path.join(QUEUE, fname)}`);
}

// ── APPROVE POST ──────────────────────────────────────────────────────────────
function approvePost(filename) {
  const src  = path.join(QUEUE, filename);
  const dest = path.join(POSTED, filename);
  if (!fs.existsSync(src)) {
    console.log(`❌  Not found: ${filename}`);
    return;
  }
  const post = JSON.parse(fs.readFileSync(src));
  post.status = 'approved';
  post.approved_date = new Date().toISOString().split('T')[0];
  fs.writeFileSync(dest, JSON.stringify(post, null, 2));
  fs.unlinkSync(src);
  console.log(`✅  Approved: ${filename}`);
  console.log('📋  Copy captions above and post to:');
  console.log('    Facebook: facebook.com (HOO page)');
  console.log('    Instagram: instagram.com');
  console.log('    TikTok: tiktok.com');
  console.log('\n📊  Tag performance later: node post-manager.js log-result [filename] [platform] [likes] [comments]');
}

// ── LOG RESULT ────────────────────────────────────────────────────────────────
function logResult(filename, platform, likes, comments) {
  let intel = {};
  try { intel = JSON.parse(fs.readFileSync(INTEL)); } catch {}
  if (!intel.posts) intel.posts = [];

  intel.posts.push({
    date:      new Date().toISOString().split('T')[0],
    filename,
    platform,
    likes:     parseInt(likes) || 0,
    comments:  parseInt(comments) || 0,
    engagement: (parseInt(likes)||0) + (parseInt(comments)||0),
  });

  // Track top performing content types
  const byType = {};
  intel.posts.forEach(p => {
    const type = p.filename.includes('before') ? 'before_after' :
                 p.filename.includes('pitch') ? 'pitch' : 'build_story';
    if (!byType[type]) byType[type] = { count:0, engagement:0 };
    byType[type].count++;
    byType[type].engagement += p.engagement;
  });
  intel.top_content_types = Object.entries(byType)
    .map(([type, d]) => ({ type, avg_engagement: Math.round(d.engagement/d.count) }))
    .sort((a,b) => b.avg_engagement - a.avg_engagement);

  fs.writeFileSync(INTEL, JSON.stringify(intel, null, 2));
  console.log(`✅  Logged: ${filename} on ${platform} — ${likes} likes, ${comments} comments`);
}

// ── STATS ─────────────────────────────────────────────────────────────────────
function showStats() {
  let intel = {};
  try { intel = JSON.parse(fs.readFileSync(INTEL)); } catch {}

  if (!intel.posts?.length) {
    console.log('No performance data yet. Post some content and log the results.');
    return;
  }

  console.log('\n📊  HOO SOCIAL STATS\n');
  console.log(`Total posts tracked: ${intel.posts.length}`);
  console.log(`\nTop content types (by avg engagement):`);
  (intel.top_content_types || []).forEach(t => {
    console.log(`  ${t.type}: avg ${t.avg_engagement} engagements`);
  });

  const best = intel.posts.sort((a,b) => b.engagement - a.engagement)[0];
  if (best) {
    console.log(`\nBest performing post:`);
    console.log(`  ${best.filename} on ${best.platform} — ${best.engagement} total engagements`);
  }
}

// ── PRE-BUILT CONTENT LIBRARY (free — based on existing HOO builds) ──────────
function generateLibrary() {
  console.log('\n📚  Generating content library from existing HOO builds...\n');

  const builds = [
    { store: 'NoReturn Apparel', section: 'God Quest Collection', type: 'before_after' },
    { store: 'NoReturn Apparel', section: 'Best Sellers Collection', type: 'before_after' },
    { store: 'NoReturn Apparel', section: 'Fatherhood Ascended Collection', type: 'build_story',
      change: 'Turned a basic product grid into a full father-and-faith story with scripture, custom sections, and a collection navigator' },
    { store: '1TrueDispensery (TCB)', section: 'Full Dispensary Build', type: 'before_after' },
    { store: 'HOO', section: 'Pricing Page', type: 'build_story',
      change: 'A Shopify section that explains the entire HOO business model in one scroll' },
    { store: 'local tattoo shop', section: 'Homepage', type: 'pitch',
      industry: 'tattoo', city: 'Kansas City' },
    { store: 'local cleaning service', section: 'Homepage', type: 'pitch',
      industry: 'cleaning', city: 'Independence' },
  ];

  builds.forEach(b => {
    const section = b.change ? `${b.section} — ${b.change}` : b.section;
    generateCaption(b.store, section, b.type);
    console.log('\n' + '─'.repeat(60) + '\n');
  });

  console.log(`✅  Library generated. ${builds.length} posts queued.`);
  console.log(`    Run: node post-manager.js queue  to review all`);
}

// ── CLI ────────────────────────────────────────────────────────────────────────
const [,, cmd, ...args] = process.argv;
switch (cmd) {
  case 'queue':    showQueue(); break;
  case 'generate': generateCaption(args[0]||'HOO', args[1]||'website build', args[2]||'before_after'); break;
  case 'approve':  approvePost(args[0]); break;
  case 'log-result': logResult(args[0], args[1], args[2], args[3]); break;
  case 'stats':    showStats(); break;
  case 'library':  generateLibrary(); break;
  default:
    console.log(`
HOO Social Post Manager

Commands:
  queue                             Show all queued posts
  generate [store] [section] [type] Generate caption (types: before_after, pitch, build_story)
  approve [filename]                Mark post approved, move to posted/
  log-result [file] [platform] [likes] [comments]  Track performance
  stats                             Show what content works best
  library                           Generate posts for all existing HOO builds

Types: before_after | pitch | build_story

Example:
  node post-manager.js generate "NoReturn Apparel" "God Quest Collection" before_after
  node post-manager.js library
    `);
}

/**
 * HOO Demo → Shopify Section Converter v1.0
 * Splits an auto-prototype demo HTML into individual Shopify Custom Liquid sections.
 *
 * Usage:
 *   node demo-to-shopify.js convert <demo.html>             Split into Shopify sections
 *   node demo-to-shopify.js convert <demo.html> --preview    List sections without writing
 *   node demo-to-shopify.js batch                            Convert all approved demos
 *
 * Output: outputs/shopify/LEAD-{id}/LEAD-{id}-{section}.html
 */

const fs   = require('fs');
const path = require('path');

const SHOPIFY_DIR = path.join(__dirname, '..', '..', 'outputs', 'shopify');

// ── SECTION DEFINITIONS ──────────────────────────────────────────────────────
// Maps section names to their HTML comment markers and CSS class prefixes
const SECTIONS = [
  {
    name: 'hero',
    label: 'Hero + Trust Strip',
    htmlMarkers: ['<!-- Hero', '<!-- Trust Strip'],
    htmlEnd: '<!-- About',
    cssPrefixes: ['.ap-hero', '.ap-btn', '.ap-trust', '@keyframes'],
    includeKeyframes: true,
    needsIO: false, // hero uses CSS animations, not IO
    postProcess: (css) => css.replace(/min-height:\s*100vh/g, 'min-height:calc(100vh - 80px)'),
  },
  {
    name: 'about',
    label: 'About',
    htmlMarkers: ['<!-- About'],
    htmlEnd: '<!-- Why Choose Us',
    cssPrefixes: ['.ap-about'],
    needsIO: true,
  },
  {
    name: 'why-choose-us',
    label: 'Why Choose Us',
    htmlMarkers: ['<!-- Why Choose Us'],
    htmlEnd: '<!-- Services',
    cssPrefixes: ['.ap-why'],
    needsIO: true,
  },
  {
    name: 'services',
    label: 'Services',
    htmlMarkers: ['<!-- Services'],
    htmlEnd: '<!-- Reviews',
    cssPrefixes: ['.ap-svc'],
    needsIO: true,
  },
  {
    name: 'reviews',
    label: 'Reviews',
    htmlMarkers: ['<!-- Reviews'],
    htmlEnd: '<!-- CTA',
    cssPrefixes: ['.ap-reviews', '.ap-review-'],
    needsIO: true,
  },
  {
    name: 'cta',
    label: 'CTA + Contact Form',
    htmlMarkers: ['<!-- CTA'],
    htmlEnd: '<!-- Footer',
    cssPrefixes: ['.ap-cta', '.ap-form'],
    needsIO: true,
    postProcess: (html) => html
      .replace('onsubmit="return false"', 'action="https://formspree.io/f/YOUR_FORM_ID" method="POST"')
      .replace(
        '<form class="ap-form"',
        '<!-- TODO: Replace YOUR_FORM_ID with your Formspree endpoint (free at formspree.io) -->\n    <form class="ap-form"'
      ),
  },
  {
    name: 'footer',
    label: 'Footer',
    htmlMarkers: ['<!-- Footer'],
    htmlEnd: '<!-- Demo Banner',
    cssPrefixes: ['.ap-footer'],
    needsIO: false,
  },
];

// ── SHARED CSS (included in every section) ───────────────────────────────────
const SHARED_CSS_PREFIXES = [
  '*,*::before,*::after',
  ':root',
  'html{', 'body{', 'a{', 'a:hover', 'img{',
  '.ap-label', '.ap-title',
  '.ap-pop', '.ap-vis',
];

// ── IO OBSERVER SCRIPT ───────────────────────────────────────────────────────
const IO_SCRIPT = `<script>
(function(){
  var els=document.querySelectorAll('.ap-pop');
  if('IntersectionObserver' in window){
    var io=new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(e.isIntersecting){e.target.classList.add('ap-vis');io.unobserve(e.target)}
      });
    },{threshold:.15,rootMargin:'0px 0px -30px 0px'});
    els.forEach(function(el,i){el.style.transitionDelay=(i%4)*80+'ms';io.observe(el)});
  }else{els.forEach(function(p){p.classList.add('ap-vis')})}
})();
</script>`;

// ── PARSE DEMO HTML ──────────────────────────────────────────────────────────
function parseDemoHTML(html) {
  // Extract Google Fonts link
  const fontsMatch = html.match(/<link[^>]*fonts\.googleapis\.com[^>]*>/);
  const fonts = fontsMatch ? fontsMatch[0] : '';

  // Extract full <style> block
  const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/);
  const fullCSS = styleMatch ? styleMatch[1] : '';

  // Extract body content (between <body> and </body>)
  const bodyMatch = html.match(/<body>([\s\S]*?)<\/body>/);
  const bodyHTML = bodyMatch ? bodyMatch[1] : '';

  // Split CSS into main and media queries
  const mediaMatches = [];
  let mainCSS = fullCSS;

  // Extract all @media blocks
  const mediaRegex = /@media\s*\([^)]+\)\s*\{([\s\S]*?\})\s*\}/g;
  let m;
  while ((m = mediaRegex.exec(fullCSS)) !== null) {
    mediaMatches.push({ full: m[0], inner: m[1] });
    mainCSS = mainCSS.replace(m[0], '');
  }

  return { fonts, fullCSS, mainCSS, mediaMatches, bodyHTML };
}

// ── EXTRACT CSS RULES FOR A SECTION ──────────────────────────────────────────
function extractCSS(css, prefixes, includeKeyframes = false) {
  const lines = css.split('\n');
  const result = [];
  let braceDepth = 0;
  let capturing = false;
  let currentBlock = '';

  for (const line of lines) {
    const trimmed = line.trim();

    if (braceDepth === 0 && !capturing) {
      // Check if this line starts a rule that matches our prefixes
      const matchesPrefix = prefixes.some(p => {
        if (p === '@keyframes' && includeKeyframes) {
          return trimmed.startsWith('@keyframes');
        }
        return trimmed.startsWith(p) || trimmed.includes(p + '{') || trimmed.includes(p + ' ');
      });

      if (matchesPrefix) {
        capturing = true;
        currentBlock = line + '\n';
        braceDepth += (line.match(/\{/g) || []).length;
        braceDepth -= (line.match(/\}/g) || []).length;
        if (braceDepth <= 0) {
          result.push(currentBlock);
          capturing = false;
          currentBlock = '';
          braceDepth = 0;
        }
        continue;
      }
    }

    if (capturing) {
      currentBlock += line + '\n';
      braceDepth += (line.match(/\{/g) || []).length;
      braceDepth -= (line.match(/\}/g) || []).length;
      if (braceDepth <= 0) {
        result.push(currentBlock);
        capturing = false;
        currentBlock = '';
        braceDepth = 0;
      }
    }
  }

  return result.join('\n');
}

// ── EXTRACT MEDIA CSS FOR A SECTION ──────────────────────────────────────────
function extractMediaCSS(mediaMatches, prefixes) {
  const results = [];
  for (const media of mediaMatches) {
    const sectionRules = extractCSS(media.inner, prefixes);
    if (sectionRules.trim()) {
      // Reconstruct media block with only this section's rules
      const mediaHeader = media.full.match(/@media\s*\([^)]+\)/)[0];
      results.push(`${mediaHeader}{\n${sectionRules}}`);
    }
  }
  return results.join('\n');
}

// ── EXTRACT HTML SECTION ─────────────────────────────────────────────────────
function extractHTML(bodyHTML, markers, endMarker) {
  let startIdx = -1;

  // Find the earliest marker
  for (const marker of markers) {
    const idx = bodyHTML.indexOf(marker);
    if (idx !== -1 && (startIdx === -1 || idx < startIdx)) {
      startIdx = idx;
    }
  }

  if (startIdx === -1) return '';

  // Find the end marker
  let endIdx = bodyHTML.length;
  if (endMarker) {
    const idx = bodyHTML.indexOf(endMarker, startIdx + 1);
    if (idx !== -1) endIdx = idx;
  }

  return bodyHTML.substring(startIdx, endIdx).trim();
}

// ── BUILD SECTION FILE ───────────────────────────────────────────────────────
function buildSectionFile(section, parsed, demoFilename) {
  const { fonts, mainCSS, mediaMatches } = parsed;

  // Extract shared CSS (base reset, variables, common classes)
  const sharedCSS = extractCSS(mainCSS, SHARED_CSS_PREFIXES);

  // Extract section-specific CSS
  let sectionCSS = extractCSS(mainCSS, section.cssPrefixes, section.includeKeyframes);

  // For hero, also include .ap-btn styles
  if (section.name === 'hero') {
    const btnCSS = extractCSS(mainCSS, ['.ap-btn']);
    sectionCSS += '\n' + btnCSS;
  }

  // For CTA, also include .ap-btn styles
  if (section.name === 'cta') {
    const btnCSS = extractCSS(mainCSS, ['.ap-btn']);
    sectionCSS += '\n' + btnCSS;
  }

  // Extract media queries for this section
  const allMediaPrefixes = [...section.cssPrefixes, ...SHARED_CSS_PREFIXES];
  if (section.name === 'hero' || section.name === 'cta') {
    allMediaPrefixes.push('.ap-btn');
  }
  const sectionMedia = extractMediaCSS(mediaMatches, allMediaPrefixes);

  // Extract HTML
  let sectionHTML = extractHTML(parsed.bodyHTML, section.htmlMarkers, section.htmlEnd);

  // Apply post-processing
  if (section.postProcess) {
    sectionCSS = section.postProcess(sectionCSS);
    sectionHTML = section.postProcess(sectionHTML);
  }

  // Remove --topbar-h from :root (not needed without topbar)
  const cleanedShared = sharedCSS.replace(/\s*--topbar-h:[^;]+;/, '');

  // Build the file
  const parts = [
    `<!-- HOO Section: ${section.label} | From ${demoFilename} -->`,
    `<!-- Paste into: Shopify Admin > Online Store > Customize > Add Section > Custom Liquid -->`,
    '',
    fonts,
    '',
    '<style>',
    '/* HOO Base */',
    cleanedShared,
    '',
    `/* ${section.label} */`,
    sectionCSS,
    '',
    '/* Responsive */',
    sectionMedia,
    '</style>',
    '',
    sectionHTML,
    '',
  ];

  if (section.needsIO) {
    parts.push(IO_SCRIPT);
  }

  return parts.join('\n');
}

// ── CONVERT DEMO ─────────────────────────────────────────────────────────────
function convertDemo(demoPath, options = {}) {
  const { preview = false, outputDir = null } = options;

  // Read demo HTML
  let html;
  try {
    html = fs.readFileSync(demoPath, 'utf8');
  } catch (err) {
    console.error(`\u274c  Cannot read demo file: ${err.message}`);
    return null;
  }

  const demoFilename = path.basename(demoPath);

  // Extract lead ID from filename
  const idMatch = demoFilename.match(/LEAD-(\d+)/i);
  const leadId = idMatch ? `LEAD-${idMatch[1]}` : path.basename(demoFilename, '.html');

  console.log(`\n\ud83d\udd27  Demo \u2192 Shopify Converter v1.0`);
  console.log(`   Source: ${demoPath}`);
  console.log(`   Lead:   ${leadId}`);

  // Parse HTML
  const parsed = parseDemoHTML(html);

  if (!parsed.bodyHTML) {
    console.error(`\u274c  Could not parse demo HTML — no <body> found`);
    return null;
  }

  // Process each section
  const results = [];
  console.log(`\n\ud83d\udccb  Sections found:`);

  for (const section of SECTIONS) {
    const sectionHTML = extractHTML(parsed.bodyHTML, section.htmlMarkers, section.htmlEnd);

    if (!sectionHTML) {
      console.log(`   \u26a0\ufe0f  ${section.label} — NOT FOUND (skipping)`);
      continue;
    }

    const file = buildSectionFile(section, parsed, demoFilename);
    const sizeKB = (Buffer.byteLength(file) / 1024).toFixed(1);

    console.log(`   ${results.length + 1}. ${section.label.padEnd(25)} ${sizeKB} KB`);

    results.push({
      name: section.name,
      label: section.label,
      content: file,
      size: sizeKB,
      filename: `${leadId}-${section.name}.html`,
    });
  }

  if (preview) {
    console.log(`\n\ud83d\udc41\ufe0f  Preview mode \u2014 no files written. Add without --preview to save.\n`);
    return { sections: results, outputDir: null };
  }

  // Write section files
  const outDir = outputDir || path.join(SHOPIFY_DIR, leadId);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  for (const section of results) {
    const filepath = path.join(outDir, section.filename);
    fs.writeFileSync(filepath, section.content, 'utf8');
  }

  console.log(`\n\u2705  ${results.length} sections written to ${outDir}/`);
  results.forEach(s => console.log(`   ${s.filename}`));
  console.log('');

  return { sections: results, outputDir: outDir };
}

// ── BATCH CONVERT ────────────────────────────────────────────────────────────
function batchConvert() {
  const demosDir = path.join(__dirname, '..', '..', 'outputs', 'demos');

  if (!fs.existsSync(demosDir)) {
    console.log('\u274c  No demos directory found');
    return;
  }

  const files = fs.readdirSync(demosDir).filter(f => f.startsWith('LEAD-') && f.endsWith('.html'));
  console.log(`\n\ud83d\udce6  Batch converting ${files.length} demos...\n`);

  let success = 0;
  for (const file of files) {
    const result = convertDemo(path.join(demosDir, file));
    if (result) success++;
  }

  console.log(`\n\ud83c\udfc1  Batch complete: ${success}/${files.length} demos converted\n`);
}

// ── CLI ────────────────────────────────────────────────────────────────────────
function main() {
  const [,, cmd, arg1] = process.argv;
  const hasFlag = (flag) => process.argv.includes(flag);

  switch (cmd) {
    case 'convert': {
      if (!arg1 || arg1.startsWith('--')) {
        console.log('Usage: node demo-to-shopify.js convert <demo.html> [--preview]');
        return;
      }
      convertDemo(arg1, { preview: hasFlag('--preview') });
      break;
    }

    case 'batch': {
      batchConvert();
      break;
    }

    default:
      console.log(`
\x1b[33mHOO Demo \u2192 Shopify Converter v1.0\x1b[0m

Splits an auto-prototype demo HTML into individual Shopify Custom Liquid sections.
Each section is self-contained and ready to paste into Shopify Admin.

Commands:
  convert <demo.html>              Split demo into Shopify sections
  convert <demo.html> --preview    List sections without writing files
  batch                            Convert all LEAD-*.html demos

Output: outputs/shopify/LEAD-{id}/LEAD-{id}-{section}.html

Sections extracted:
  1. hero          Hero + trust strip (merged, they overlap visually)
  2. about         About section with grid layout
  3. why-choose-us Numbered pillars section
  4. services      Asymmetric service grid with overlay cards
  5. reviews       Staggered review cards
  6. cta           CTA with contact form (Formspree placeholder)
  7. footer        Simple footer (optional, most themes have one)

Skipped (demo-only):
  - Progress bar, utility bar, nav, demo banner

How to use output:
  1. Open Shopify Admin \u2192 Online Store \u2192 Customize
  2. Click "Add section" \u2192 Custom Liquid
  3. Paste the contents of a section file
  4. Repeat for each section
  5. Update CTA form with your Formspree endpoint
      `);
  }
}

module.exports = { convertDemo, batchConvert };

if (require.main === module) {
  main();
}

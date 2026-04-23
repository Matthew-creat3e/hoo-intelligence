/**
 * Crawl a local demo as a mobile user; take full-page + viewport screenshots.
 * Usage: node _crawl-mobile.js <demoPath>
 */
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
  const demoPath = process.argv[2];
  if (!demoPath) { console.error('Usage: node _crawl-mobile.js <demoPath>'); process.exit(1); }
  const abs = path.resolve(demoPath);
  if (!fs.existsSync(abs)) { console.error('File not found:', abs); process.exit(1); }

  const outDir = path.join(__dirname, '..', '..', 'engine', 'mobile-crawl');
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await puppeteer.launch({ headless: 'new', args: ['--allow-file-access-from-files'] });
  const page = await browser.newPage();

  // iPhone 14 Pro-ish mobile viewport (no DPR scaling — lighter files, easier to inspect)
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1');

  const url = 'file:///' + abs.replace(/\\/g, '/');
  console.log('Loading', url);
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });
  await new Promise(r => setTimeout(r, 1500)); // let animations settle

  // Full-page screenshot
  const full = path.join(outDir, '01-fullpage.png');
  await page.screenshot({ path: full, fullPage: true, type: 'png' });
  const size = (fs.statSync(full).size / 1024).toFixed(0);
  console.log('✓ full-page →', full, `(${size} KB)`);

  // Also grab total document height
  const docHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  const vh = 844;
  console.log('Document height:', docHeight + 'px (' + (docHeight / vh).toFixed(1) + ' screens)');

  // Viewport screenshots at scroll positions — top, ~25%, ~50%, ~75%, bottom
  const frames = [
    { y: 0, name: '02-top.png' },
    { y: Math.round(docHeight * .15), name: '03-hero-bottom.png' },
    { y: Math.round(docHeight * .3), name: '04-mid-upper.png' },
    { y: Math.round(docHeight * .5), name: '05-mid.png' },
    { y: Math.round(docHeight * .7), name: '06-mid-lower.png' },
    { y: Math.max(0, docHeight - vh), name: '07-bottom.png' }
  ];
  for (const f of frames) {
    await page.evaluate(y => window.scrollTo(0, y), f.y);
    await new Promise(r => setTimeout(r, 500));
    const p = path.join(outDir, f.name);
    await page.screenshot({ path: p, fullPage: false, type: 'png' });
    console.log('✓ viewport @ y=' + f.y + ' →', f.name);
  }

  await browser.close();
  console.log('\nDone. Screenshots in', outDir);
})().catch(err => { console.error('CRAWL FAILED:', err); process.exit(1); });

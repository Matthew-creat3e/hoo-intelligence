/**
 * HOO Pexels Engine v1.0 — Free Stock Photos by Industry
 * Fetches high-quality photos from Pexels API for demo builds.
 *
 * Credentials in .env:
 *   PEXELS_API_KEY=your_pexels_key_here
 *
 * Usage (CLI):
 *   node pexels-engine.js test                       Fetch 3 tattoo photos
 *   node pexels-engine.js search "tattoo" 5          Fetch 5 tattoo photos
 *   node pexels-engine.js search "cleaning" 4        Fetch 4 cleaning photos
 *   node pexels-engine.js industries                 List all mapped industries
 *
 * Usage (require):
 *   const { getPhotos } = require('./pexels-engine');
 *   const urls = await getPhotos('tattoo', 3);
 */

require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const https = require('https');

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;

// ── INDUSTRY → SEARCH QUERY MAP ──────────────────────────────────────────────
const INDUSTRY_MAP = {
  'tattoo':             'tattoo artist studio',
  'cleaning':           'house cleaning service',
  'lawn care':          'lawn mowing grass',
  'handyman':           'home repair tools',
  'fencing':            'wood fence installation',
  'food truck':         'food truck street',
  'landscaping':        'landscaping garden',
  'roofing':            'roofing construction',
  'barber':             'barbershop haircut',
  'auto detailing':     'car detailing shine',
  'painting':           'house painting contractor',
  'pet grooming':       'dog grooming salon',
  'photography':        'professional photography studio',
  'personal training':  'personal trainer gym',
  'moving':             'moving boxes truck',
  'pressure washing':   'pressure washing driveway',
  'junk removal':       'junk removal truck',
  'mobile mechanic':    'mobile mechanic car repair',
};

// ── PEXELS API REQUEST ────────────────────────────────────────────────────────
function pexelsRequest(query, perPage) {
  return new Promise((resolve, reject) => {
    if (!PEXELS_API_KEY || PEXELS_API_KEY === 'your_pexels_key_here') {
      reject(new Error('PEXELS_API_KEY not set in .env — get one free at pexels.com/api'));
      return;
    }

    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=landscape`;

    const options = {
      headers: { Authorization: PEXELS_API_KEY },
    };

    https.get(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(`Pexels API ${res.statusCode}: ${data}`));
          return;
        }
        try {
          resolve(JSON.parse(data));
        } catch (err) {
          reject(new Error(`Pexels JSON parse error: ${err.message}`));
        }
      });
    }).on('error', reject);
  });
}

// ── GET PHOTOS ────────────────────────────────────────────────────────────────
/**
 * Fetch photos from Pexels for a given industry.
 * @param {string} industry - Industry key (e.g. "tattoo", "cleaning") or raw search query
 * @param {number} count - Number of photos to return (default 3, max 80)
 * @returns {Promise<Array<{url: string, width: number, height: number, alt: string, photographer: string, pexelsUrl: string}>>}
 */
async function getPhotos(industry, count = 3) {
  const key = industry.toLowerCase().trim();
  const query = INDUSTRY_MAP[key] || key;

  const result = await pexelsRequest(query, Math.min(count, 80));

  if (!result.photos || result.photos.length === 0) {
    console.warn(`⚠️  No photos found for "${query}"`);
    return [];
  }

  return result.photos.map(photo => ({
    url:          photo.src.large2x,
    medium:       photo.src.medium,
    small:        photo.src.small,
    original:     photo.src.original,
    width:        photo.width,
    height:       photo.height,
    alt:          photo.alt || `${industry} photo`,
    photographer: photo.photographer,
    pexelsUrl:    photo.url,
  }));
}

// ── CLI ────────────────────────────────────────────────────────────────────────
async function main() {
  const [,, cmd, arg1, arg2] = process.argv;

  switch (cmd) {
    case 'test': {
      console.log('\n🧪  Fetching 3 tattoo photos from Pexels...\n');
      try {
        const photos = await getPhotos('tattoo', 3);
        if (photos.length === 0) {
          console.log('No photos returned. Check your API key.');
          return;
        }
        photos.forEach((p, i) => {
          console.log(`  #${i + 1}  ${p.url}`);
          console.log(`       ${p.width}x${p.height} — by ${p.photographer}`);
          console.log(`       Alt: ${p.alt}\n`);
        });
        console.log(`✅  ${photos.length} photos fetched.`);
      } catch (err) {
        console.error(`❌  ${err.message}`);
      }
      break;
    }

    case 'search': {
      if (!arg1) { console.log('Usage: node pexels-engine.js search "industry" [count]'); return; }
      const count = parseInt(arg2, 10) || 3;
      const key = arg1.toLowerCase().trim();
      const query = INDUSTRY_MAP[key] || key;
      console.log(`\n🔍  Searching Pexels: "${query}" (${count} photos)\n`);
      try {
        const photos = await getPhotos(arg1, count);
        if (photos.length === 0) {
          console.log('No photos returned.');
          return;
        }
        photos.forEach((p, i) => {
          console.log(`  #${i + 1}  ${p.url}`);
          console.log(`       ${p.width}x${p.height} — by ${p.photographer}\n`);
        });
        console.log(`✅  ${photos.length} photos fetched.`);
      } catch (err) {
        console.error(`❌  ${err.message}`);
      }
      break;
    }

    case 'industries': {
      console.log('\n📋  Industry → Search Query Map\n');
      const maxLen = Math.max(...Object.keys(INDUSTRY_MAP).map(k => k.length));
      Object.entries(INDUSTRY_MAP).forEach(([industry, query]) => {
        console.log(`  ${industry.padEnd(maxLen + 2)} → "${query}"`);
      });
      console.log(`\n  ${Object.keys(INDUSTRY_MAP).length} industries mapped.`);
      console.log('  Pass any unlisted string and it searches Pexels directly.\n');
      break;
    }

    default:
      console.log(`
\x1b[33mHOO Pexels Engine v1.0\x1b[0m — Free Stock Photos by Industry

Commands:
  test                             Fetch 3 tattoo photos (quick check)
  search "industry" [count]        Fetch photos for any industry
  industries                       List all mapped industry keywords

Examples:
  node pexels-engine.js test
  node pexels-engine.js search "barber" 5
  node pexels-engine.js search "roofing" 4

Require:
  const { getPhotos } = require('./pexels-engine');
  const photos = await getPhotos('tattoo', 3);

API Key: Set PEXELS_API_KEY in .env (free at pexels.com/api)
      `);
  }
}

// ── EXPORTS ───────────────────────────────────────────────────────────────────
module.exports = { getPhotos, INDUSTRY_MAP };

// Run CLI only when called directly
if (require.main === module) {
  main().catch(console.error);
}

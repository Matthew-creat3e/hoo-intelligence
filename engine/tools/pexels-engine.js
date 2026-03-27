/**
 * HOO Pexels Engine v2.0 — Curated Photo Library + API Fallback
 * Fetches high-quality photos from curated library or Pexels API.
 *
 * v2.0: Curated photo library per industry/slot, multi-query seeding,
 *       usage tracking to avoid repeats, smart fallback to API.
 *
 * Credentials in .env:
 *   PEXELS_API_KEY=your_pexels_key_here
 *
 * Usage (CLI):
 *   node pexels-engine.js test                       Fetch 3 tattoo photos
 *   node pexels-engine.js search "tattoo" 5          Fetch 5 tattoo photos
 *   node pexels-engine.js industries                 List all mapped industries
 *   node pexels-engine.js seed cleaning              Fetch photo candidates (dry run)
 *   node pexels-engine.js seed cleaning --save       Fetch and save to library
 *   node pexels-engine.js curated cleaning           Show curated photo counts
 *   node pexels-engine.js add cleaning hero <url>    Manually add a photo URL
 *
 * Usage (require):
 *   const { getPhotos, getCuratedPhotos } = require('./pexels-engine');
 *   const photos = await getCuratedPhotos('cleaning', 10);
 */

require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const https = require('https');
const fs    = require('fs');
const path  = require('path');

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
const LIBRARY_PATH   = path.join(__dirname, '..', 'data', 'photo-library.json');
const USAGE_PATH     = path.join(__dirname, '..', 'data', 'photo-usage.json');

// ── INDUSTRY → SEARCH QUERY MAP (legacy, still used for basic getPhotos) ─────
const INDUSTRY_MAP = {
  'tattoo':             'tattoo artist studio',
  'cleaning':           'house cleaning service',
  'lawn care':          'lawn mowing grass',
  'handyman':           'home repair tools',
  'fencing':            'wood fence installation',
  'food truck':         'food truck street food',
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
  'auto repair':        'auto repair shop mechanic',
};

// ── INDUSTRY QUERIES (targeted per slot for seeding) ─────────────────────────
const INDUSTRY_QUERIES = {
  cleaning: {
    hero:     ['professional cleaner wiping kitchen counter', 'woman cleaning modern bright home', 'house cleaning service maid'],
    about:    ['cleaning team portrait smiling', 'professional cleaner uniform supplies', 'friendly cleaner woman'],
    services: [
      ['deep cleaning bathroom scrubbing tiles', 'thorough house cleaning baseboards'],
      ['regular weekly house cleaning service', 'maintaining clean living room'],
      ['move out cleaning empty apartment spotless', 'empty clean room'],
      ['office cleaning commercial janitor desk', 'professional office cleaning night'],
      ['carpet cleaning machine steam extraction', 'upholstery cleaning sofa'],
      ['window cleaning squeegee professional', 'crystal clear window washing']
    ],
    cta:      ['sparkling clean home interior bright', 'clean modern living room white']
  },
  'lawn care': {
    hero:     ['lawn mowing professional green grass', 'landscaper mowing beautiful yard', 'perfectly manicured lawn stripes'],
    about:    ['landscaper portrait friendly', 'lawn care worker smiling', 'lawn maintenance crew'],
    services: [
      ['professional lawn mowing stripes', 'riding mower beautiful yard'],
      ['lawn edging trimming sidewalk clean', 'weed trimmer edging precision'],
      ['fertilizer spreader lawn green', 'lawn fertilization treatment'],
      ['weed control spray lawn', 'dandelion weeds lawn treatment'],
      ['leaf blower autumn cleanup yard', 'leaf removal raking fall'],
      ['yard spring cleanup mulching', 'seasonal garden cleanup']
    ],
    cta:      ['beautiful green lawn house curb appeal', 'lush green backyard']
  },
  handyman: {
    hero:     ['handyman working home repair', 'contractor fixing house interior', 'professional repairman tools'],
    about:    ['handyman portrait toolbelt friendly', 'experienced contractor smiling', 'home repair professional'],
    services: [
      ['home repair fixing door hinge', 'general maintenance house'],
      ['drywall repair patch painting', 'wall repair spackling'],
      ['plumber fixing sink faucet', 'plumbing repair kitchen'],
      ['electrician installing light fixture', 'electrical outlet repair'],
      ['furniture assembly tools', 'building bookshelf assembly'],
      ['deck repair wood boards', 'fence repair backyard']
    ],
    cta:      ['beautiful renovated home interior', 'well maintained house']
  },
  painting: {
    hero:     ['painter rolling wall interior', 'professional house painter brush', 'painting contractor working room'],
    about:    ['painter portrait friendly professional', 'painting crew team', 'house painter with roller'],
    services: [
      ['interior painting living room walls', 'painter rolling wall white'],
      ['exterior house painting siding', 'painter on ladder house outside'],
      ['cabinet refinishing kitchen spray', 'kitchen cabinet painting white'],
      ['deck staining wood brush', 'staining outdoor deck boards'],
      ['drywall repair spackle sand', 'wall repair patching'],
      ['paint color swatches consultation', 'color samples wall paint']
    ],
    cta:      ['freshly painted bright room interior', 'beautiful painted home']
  },
  landscaping: {
    hero:     ['landscape design beautiful garden', 'professional landscaping yard', 'garden landscape backyard patio'],
    about:    ['landscaper working garden', 'landscape designer planning', 'gardening professional'],
    services: [
      ['landscape architecture design plan', 'garden design blueprint'],
      ['patio hardscape stone pavers', 'retaining wall construction'],
      ['sprinkler irrigation system installation', 'lawn sprinkler watering'],
      ['garden installation flower bed planting', 'raised garden bed'],
      ['tree trimming pruning arborist', 'shrub care landscaping'],
      ['outdoor landscape lighting path', 'garden lights night']
    ],
    cta:      ['beautiful backyard landscape patio', 'stunning garden outdoor space']
  },
  moving: {
    hero:     ['movers carrying boxes house', 'professional moving truck loading', 'moving crew carrying furniture'],
    about:    ['moving company team friendly', 'professional movers portrait', 'moving truck driver'],
    services: [
      ['local moving house neighborhood', 'movers carrying boxes truck'],
      ['long distance moving truck highway', 'cross country moving van'],
      ['packing boxes supplies wrapping', 'professional packing service'],
      ['loading furniture truck dolly', 'movers loading heavy items'],
      ['storage unit clean organized', 'storage facility boxes'],
      ['office moving commercial desk', 'business relocation moving']
    ],
    cta:      ['happy family new home moving', 'new home keys moving day']
  },
  'auto detailing': {
    hero:     ['car detailing polishing paint', 'auto detailer working on car', 'car wash hand detail'],
    about:    ['car detailer professional portrait', 'auto detailing expert', 'car care professional'],
    services: [
      ['full car detail interior exterior', 'detailed clean car showroom'],
      ['interior car cleaning vacuum', 'car seat cleaning detail'],
      ['car exterior polish wax shine', 'car paint polish buffing'],
      ['ceramic coating car application', 'car paint protection coating'],
      ['paint correction car polishing', 'swirl mark removal car'],
      ['mobile detailing van driveway', 'mobile car wash service']
    ],
    cta:      ['showroom clean car shiny', 'perfectly detailed car']
  },
  'pressure washing': {
    hero:     ['pressure washing driveway concrete', 'power washing house siding', 'pressure washer cleaning'],
    about:    ['pressure washing worker equipment', 'power washing professional', 'pressure cleaning worker'],
    services: [
      ['driveway pressure washing concrete clean', 'power washing oil stains driveway'],
      ['house washing siding exterior soft', 'vinyl siding cleaning'],
      ['deck pressure washing wood clean', 'patio pressure washing stone'],
      ['fence pressure washing wood clean', 'vinyl fence cleaning'],
      ['roof soft wash cleaning shingles', 'roof cleaning algae removal'],
      ['commercial pressure washing storefront', 'sidewalk power washing']
    ],
    cta:      ['clean driveway after pressure washing', 'sparkling clean house exterior']
  },
  'pet grooming': {
    hero:     ['dog grooming salon professional', 'pet groomer bathing dog', 'cute dog after grooming'],
    about:    ['pet groomer portrait with dog', 'friendly groomer with puppy', 'pet care professional'],
    services: [
      ['dog grooming haircut trim', 'full grooming poodle'],
      ['dog bath shampoo grooming', 'bathing dog wash tub'],
      ['dog nail trimming clipping', 'pet nail grooming'],
      ['dog deshedding brush furry', 'husky deshedding grooming'],
      ['puppy first grooming bath', 'small puppy grooming gentle'],
      ['mobile grooming van dog', 'pet mobile grooming service']
    ],
    cta:      ['happy groomed dog cute', 'clean fluffy dog after grooming']
  },
  tattoo: {
    hero:     ['tattoo artist working arm', 'tattoo studio professional', 'tattoo machine ink art'],
    about:    ['tattoo artist portrait creative', 'tattoo shop interior studio', 'tattoo artist drawing'],
    services: [
      ['custom tattoo design drawing', 'tattoo sketch artwork'],
      ['realistic portrait tattoo arm', 'photo realistic tattoo detail'],
      ['traditional tattoo colorful bold', 'neo traditional tattoo art'],
      ['geometric tattoo blackwork pattern', 'mandala tattoo design'],
      ['tattoo cover up transformation', 'cover up tattoo before after'],
      ['tattoo consultation sketch planning', 'tattoo design meeting']
    ],
    cta:      ['detailed tattoo arm artwork', 'beautiful tattoo art close up']
  },
  'food truck': {
    hero:     ['food truck serving customers', 'street food truck colorful', 'food truck festival'],
    about:    ['food truck chef cooking', 'food truck owner portrait', 'food truck kitchen inside'],
    services: [
      ['catering event food outdoor', 'food truck catering party'],
      ['birthday party food outdoor', 'private event food truck'],
      ['corporate lunch food truck office', 'business lunch catering'],
      ['food festival market street', 'food truck fair crowd'],
      ['food truck parked street', 'food truck weekly spot'],
      ['custom menu food plating', 'chef preparing food plate']
    ],
    cta:      ['delicious street food close up', 'amazing food truck meal']
  },
  roofing: {
    hero:     ['roofer working on roof shingles', 'roofing construction worker', 'roof installation professional'],
    about:    ['roofing contractor portrait', 'roofer team crew', 'roofing professional safety'],
    services: [
      ['roof replacement new shingles', 'new roof installation house'],
      ['roof repair fixing leak', 'roofer repairing shingles'],
      ['storm damage roof hail', 'roof damage repair wind'],
      ['roof inspection professional', 'roofer inspecting shingles'],
      ['gutter installation seamless', 'gutter downspout installation'],
      ['commercial roofing flat roof', 'industrial roof installation']
    ],
    cta:      ['beautiful new roof house', 'new roof curb appeal']
  },
  fencing: {
    hero:     ['wood fence backyard privacy', 'fence installation professional', 'beautiful cedar fence'],
    about:    ['fence installer worker', 'fencing contractor portrait', 'fence building crew'],
    services: [
      ['cedar wood privacy fence', 'wooden fence backyard'],
      ['vinyl fence white clean', 'vinyl privacy fence'],
      ['chain link fence installation', 'chain link fencing yard'],
      ['iron fence ornamental elegant', 'aluminum decorative fence'],
      ['fence repair broken boards', 'fixing fence post'],
      ['gate installation fence entry', 'fence gate hardware']
    ],
    cta:      ['beautiful fenced backyard yard', 'privacy fence backyard']
  },
  'personal training': {
    hero:     ['personal trainer coaching client', 'fitness training gym workout', 'trainer helping client exercise'],
    about:    ['personal trainer portrait fit', 'fitness coach smiling gym', 'trainer professional'],
    services: [
      ['one on one personal training gym', 'trainer client workout'],
      ['group fitness class exercise', 'small group training gym'],
      ['healthy meal prep nutrition', 'nutritious food plate'],
      ['weight loss transformation fitness', 'measuring tape fitness'],
      ['strength training weights barbell', 'weightlifting gym workout'],
      ['online coaching phone laptop', 'virtual training session']
    ],
    cta:      ['fit person workout success', 'gym workout motivation']
  },
  barber: {
    hero:     ['barber cutting hair fade', 'barbershop haircut professional', 'barber chair classic'],
    about:    ['barber portrait clippers chair', 'barbershop interior classic', 'barber smiling shop'],
    services: [
      ['mens haircut classic fade', 'barber cutting hair clippers'],
      ['beard trim shape barber', 'beard grooming razor'],
      ['hot towel shave barber razor', 'straight razor shave'],
      ['kids haircut barber chair', 'child getting haircut'],
      ['hair design pattern barber', 'creative haircut design'],
      ['barbershop walk in open', 'barber shop front door']
    ],
    cta:      ['fresh haircut clean fade', 'sharp barber haircut result']
  },
  photography: {
    hero:     ['photographer camera professional', 'photography session studio', 'photographer working shoot'],
    about:    ['photographer portrait camera', 'professional photographer smiling', 'photography studio setup'],
    services: [
      ['portrait photography session natural', 'family portrait outdoor'],
      ['wedding photography ceremony', 'wedding photographer couple'],
      ['event photography corporate', 'photographer at event'],
      ['product photography studio setup', 'ecommerce product photo'],
      ['professional headshot portrait', 'business headshot studio'],
      ['photo editing computer screen', 'photographer editing photos']
    ],
    cta:      ['beautiful photograph stunning', 'professional photo gallery']
  },
  'junk removal': {
    hero:     ['junk removal truck loading', 'junk hauling workers', 'trash removal cleanup'],
    about:    ['junk removal team friendly', 'hauling crew workers', 'cleanup crew portrait'],
    services: [
      ['garage cleanout junk removal', 'house cleanout debris'],
      ['furniture removal old couch', 'hauling furniture truck'],
      ['appliance removal hauling', 'old appliance disposal'],
      ['yard debris removal cleanup', 'tree branch yard waste'],
      ['construction debris removal', 'demo waste cleanup dumpster'],
      ['same day junk removal fast', 'quick debris cleanup']
    ],
    cta:      ['clean empty garage after', 'organized clean space']
  },
  'mobile mechanic': {
    hero:     ['mechanic working on car engine', 'mobile auto repair driveway', 'car mechanic under hood'],
    about:    ['mechanic portrait professional', 'auto mechanic friendly', 'car repair professional'],
    services: [
      ['oil change car maintenance', 'pouring motor oil engine'],
      ['brake repair pads rotors', 'mechanic changing brakes'],
      ['car diagnostic computer scan', 'obd scanner car check engine'],
      ['car battery replacement install', 'jump start battery'],
      ['engine tune up spark plugs', 'car maintenance tune up'],
      ['roadside emergency car repair', 'mechanic helping broken down car']
    ],
    cta:      ['happy car owner mechanic', 'well maintained car engine']
  },
  'auto repair': {
    hero:     ['auto repair shop garage', 'mechanic shop interior lift', 'car repair garage bay'],
    about:    ['auto mechanic working engine', 'mechanic team portrait shop', 'car repair professional tools'],
    services: [
      ['car engine repair mechanic', 'engine rebuild repair shop'],
      ['brake repair mechanic shop', 'mechanic changing brakes car lift'],
      ['transmission repair rebuild', 'mechanic transmission service'],
      ['car diagnostic scanner mechanic', 'check engine light diagnostic'],
      ['oil change mechanic shop', 'car maintenance oil filter'],
      ['car air conditioning repair', 'auto electrical wiring repair']
    ],
    cta:      ['car on lift mechanic shop', 'happy customer auto repair']
  },
};

// ── CUISINE / SPECIALTY KEYWORDS ────────────────────────────────────────────
const CUISINE_HINTS = [
  { pattern: /taco|mexican|burrito|enchilada|tamale|chicatan|salsa|quesadilla|pozole/i, query: 'mexican food tacos' },
  { pattern: /bbq|barbecue|brisket|smok|rib/i,                                        query: 'bbq barbecue smoked meat' },
  { pattern: /pizza|italian|pasta|calzone/i,                                           query: 'pizza food truck' },
  { pattern: /burger|grill|slider/i,                                                   query: 'burger grill food' },
  { pattern: /soul food|southern|fried chicken|catfish|collard/i,                       query: 'soul food southern cooking' },
  { pattern: /asian|chinese|wok|noodle|dumpling|lo mein/i,                             query: 'asian street food noodles' },
  { pattern: /thai|pad thai|curry/i,                                                   query: 'thai food curry' },
  { pattern: /korean|kimchi|bulgogi|bibimbap/i,                                        query: 'korean food truck' },
  { pattern: /ice cream|gelato|frozen|popsicle|shaved ice|snow cone/i,                 query: 'ice cream truck dessert' },
  { pattern: /coffee|espresso|cafe|latte/i,                                            query: 'coffee truck espresso' },
  { pattern: /crepe|french|pastry/i,                                                   query: 'crepes french food' },
  { pattern: /seafood|shrimp|lobster|fish/i,                                           query: 'seafood food truck' },
  { pattern: /wing|chicken wing|buffalo/i,                                             query: 'chicken wings food' },
  { pattern: /vegan|plant.?based|vegetarian/i,                                         query: 'vegan food truck' },
  { pattern: /jamaican|jerk|caribbean/i,                                               query: 'jamaican jerk food' },
  { pattern: /greek|gyro|falafel|mediterranean/i,                                      query: 'greek food mediterranean' },
  { pattern: /hotdog|hot dog|sausage|brat/i,                                           query: 'hot dog food cart' },
  { pattern: /cupcake|cake|bakery|bake|donut|doughnut/i,                               query: 'bakery cupcakes food truck' },
];

// ── PEXELS API REQUEST ────────────────────────────────────────────────────────
function pexelsRequest(query, perPage) {
  return new Promise((resolve, reject) => {
    if (!PEXELS_API_KEY || PEXELS_API_KEY === 'your_pexels_key_here') {
      reject(new Error('PEXELS_API_KEY not set in .env \u2014 get one free at pexels.com/api'));
      return;
    }

    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=landscape`;
    const options = { headers: { Authorization: PEXELS_API_KEY } };

    https.get(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(`Pexels API ${res.statusCode}: ${data}`));
          return;
        }
        try { resolve(JSON.parse(data)); }
        catch (err) { reject(new Error(`Pexels JSON parse error: ${err.message}`)); }
      });
    }).on('error', reject);
  });
}

// ── FORMAT PHOTO OBJECT ───────────────────────────────────────────────────────
function formatPhoto(photo, industry) {
  return {
    url:          photo.src ? photo.src.large2x : photo.url,
    medium:       photo.src ? photo.src.medium : photo.medium || photo.url,
    small:        photo.src ? photo.src.small : photo.small || photo.url,
    original:     photo.src ? photo.src.original : photo.original || photo.url,
    width:        photo.width || 0,
    height:       photo.height || 0,
    alt:          photo.alt || `${industry} photo`,
    photographer: photo.photographer || '',
    pexelsUrl:    photo.url || '',
  };
}

// ── GET PHOTOS (legacy API-only) ─────────────────────────────────────────────
async function getPhotos(industry, count = 3, context = '') {
  const key = industry.toLowerCase().trim();
  let query = INDUSTRY_MAP[key] || key;

  if (context && CUISINE_HINTS) {
    for (const hint of CUISINE_HINTS) {
      if (hint.pattern.test(context)) {
        query = hint.query;
        console.log(`   \ud83c\udfaf  Photo hint matched: "${hint.query}" (from business context)`);
        break;
      }
    }
  }

  const result = await pexelsRequest(query, Math.min(count, 80));

  if (!result.photos || result.photos.length === 0) {
    console.warn(`\u26a0\ufe0f  No photos found for "${query}"`);
    return [];
  }

  return result.photos.map(p => formatPhoto(p, industry));
}

// ── LOAD / SAVE LIBRARY ──────────────────────────────────────────────────────
function loadLibrary() {
  try { return JSON.parse(fs.readFileSync(LIBRARY_PATH, 'utf8')); }
  catch { return {}; }
}

function saveLibrary(lib) {
  lib._meta = lib._meta || {};
  lib._meta.lastUpdated = new Date().toISOString().split('T')[0];
  fs.writeFileSync(LIBRARY_PATH, JSON.stringify(lib, null, 2), 'utf8');
}

function loadUsage() {
  try { return JSON.parse(fs.readFileSync(USAGE_PATH, 'utf8')); }
  catch { return {}; }
}

function saveUsage(usage) {
  fs.writeFileSync(USAGE_PATH, JSON.stringify(usage, null, 2), 'utf8');
}

// ── PICK RANDOM PHOTO FROM POOL (prefer not recently used) ───────────────────
function pickPhoto(pool, usage) {
  if (!pool || pool.length === 0) return null;

  const now = Date.now();
  const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

  // Separate into fresh (not used recently) and stale
  const fresh = pool.filter(p => {
    const lastUsed = usage[p.url] ? new Date(usage[p.url]).getTime() : 0;
    return (now - lastUsed) > SEVEN_DAYS;
  });

  const source = fresh.length > 0 ? fresh : pool;
  const pick = source[Math.floor(Math.random() * source.length)];

  // Record usage
  if (pick) usage[pick.url] = new Date().toISOString();

  return pick;
}

// ── GET CURATED PHOTOS (library first, API fallback) ─────────────────────────
/**
 * Get photos for a demo build. Pulls from curated library first,
 * falls back to Pexels API for missing slots.
 * Returns same format as getPhotos() — drop-in replacement.
 *
 * Slot assignment: [0]=hero, [1]=about, [2-7]=6 services, [8]=cta, [9]=spare
 */
async function getCuratedPhotos(industry, count = 10, context = '') {
  const key = industry.toLowerCase().trim();
  const lib = loadLibrary();
  const usage = loadUsage();
  const indLib = lib[key];

  // If no curated photos for this industry, fall back to API
  if (!indLib) {
    console.log(`   \ud83d\udcf7  No curated library for "${key}" \u2014 falling back to Pexels API`);
    return getPhotos(industry, count, context);
  }

  let serviceNames = indLib.services ? Object.keys(indLib.services) : [];

  const photos = [];
  let usedCurated = 0;

  // Slot 0: Hero
  const heroPhoto = pickPhoto(indLib.hero, usage);
  photos.push(heroPhoto);
  if (heroPhoto) usedCurated++;

  // Slot 1: About
  const aboutPhoto = pickPhoto(indLib.about, usage);
  photos.push(aboutPhoto);
  if (aboutPhoto) usedCurated++;

  // Slots 2-7: Services (one per service)
  for (let i = 0; i < 6; i++) {
    const svcName = serviceNames[i];
    const svcPool = svcName && indLib.services ? indLib.services[svcName] : null;
    const svcPhoto = svcPool ? pickPhoto(svcPool, usage) : null;
    photos.push(svcPhoto);
    if (svcPhoto) usedCurated++;
  }

  // Slot 8: CTA
  const ctaPhoto = pickPhoto(indLib.cta, usage);
  photos.push(ctaPhoto);
  if (ctaPhoto) usedCurated++;

  // Slot 9: Spare
  photos.push(null);

  // Save usage tracking
  saveUsage(usage);

  // Count how many slots need API fallback
  const emptySlots = photos.filter(p => !p).length;

  if (emptySlots > 0) {
    console.log(`   \ud83d\udcf7  Curated: ${usedCurated}/${count} slots filled \u2014 fetching ${emptySlots} from Pexels API`);
    const apiPhotos = await getPhotos(industry, Math.min(emptySlots + 3, 15), context);
    let apiIdx = 0;

    // Fill empty slots with API photos
    for (let i = 0; i < photos.length; i++) {
      if (!photos[i] && apiIdx < apiPhotos.length) {
        photos[i] = apiPhotos[apiIdx++];
      }
    }
  } else {
    console.log(`   \u2728  All ${usedCurated} photo slots filled from curated library`);
  }

  // Filter out any remaining nulls and ensure format
  return photos.map((p, i) => {
    if (!p) return { url: '', alt: `${industry} photo`, photographer: '', pexelsUrl: '' };
    // Ensure consistent format
    return {
      url:          p.url || '',
      medium:       p.medium || p.url || '',
      small:        p.small || p.url || '',
      original:     p.original || p.url || '',
      width:        p.width || 0,
      height:       p.height || 0,
      alt:          p.alt || `${industry} photo`,
      photographer: p.photographer || '',
      pexelsUrl:    p.pexelsUrl || '',
    };
  });
}

// ── SEED PHOTO LIBRARY ───────────────────────────────────────────────────────
/**
 * Fetch photo candidates for an industry using INDUSTRY_QUERIES.
 * Dry run prints candidates. --save writes them to the library.
 */
async function seedPhotoLibrary(industry, save = false) {
  const key = industry.toLowerCase().trim();
  const queries = INDUSTRY_QUERIES[key];

  if (!queries) {
    console.log(`\u274c  No INDUSTRY_QUERIES defined for "${key}"`);
    console.log(`   Available: ${Object.keys(INDUSTRY_QUERIES).join(', ')}`);
    return;
  }

  const lib = loadLibrary();
  if (!lib[key]) {
    lib[key] = { hero: [], about: [], services: {}, cta: [] };
  }

  console.log(`\n\ud83c\udf31  Seeding photo library for "${key}"${save ? ' (SAVING)' : ' (DRY RUN)'}...\n`);

  let totalFetched = 0;
  let totalAdded = 0;

  // Helper: fetch and optionally save photos for a slot
  async function seedSlot(slotName, queryList, targetArray) {
    console.log(`  \ud83d\udcf8  ${slotName}:`);
    for (const query of queryList) {
      try {
        const result = await pexelsRequest(query, 3);
        if (result.photos && result.photos.length > 0) {
          for (const photo of result.photos) {
            totalFetched++;
            const formatted = {
              url:          photo.src.large2x,
              medium:       photo.src.medium,
              small:        photo.src.small,
              original:     photo.src.original,
              width:        photo.width,
              height:       photo.height,
              alt:          photo.alt || `${key} ${slotName} photo`,
              photographer: photo.photographer,
              pexelsUrl:    photo.url,
              tag:          'auto-seeded',
              addedDate:    new Date().toISOString().split('T')[0],
            };

            // Check for duplicates
            const isDuplicate = targetArray.some(p => p.url === formatted.url);
            if (!isDuplicate) {
              if (save) {
                targetArray.push(formatted);
                totalAdded++;
              }
              console.log(`     ${save ? '\u2705' : '\ud83d\udc41\ufe0f'}  ${photo.src.medium.substring(0, 80)}...`);
              console.log(`        "${photo.alt || 'no alt'}" by ${photo.photographer}`);
            } else {
              console.log(`     \u23ed\ufe0f  Duplicate skipped: ${photo.src.medium.substring(0, 60)}...`);
            }
          }
        } else {
          console.log(`     \u26a0\ufe0f  No results for "${query}"`);
        }
      } catch (err) {
        console.log(`     \u274c  API error for "${query}": ${err.message}`);
      }
      // Delay to respect Pexels rate limits (free tier: ~200 req/hr)
      await new Promise(r => setTimeout(r, 1500));
    }
  }

  // Seed hero
  await seedSlot('hero', queries.hero, lib[key].hero);

  // Seed about
  await seedSlot('about', queries.about, lib[key].about);

  // Seed each service
  if (queries.services) {
    // Get service names from library structure
    const svcNames = lib[key].services ? Object.keys(lib[key].services) : [];
    for (let i = 0; i < queries.services.length && i < svcNames.length; i++) {
      const svcName = svcNames[i];
      if (!lib[key].services[svcName]) lib[key].services[svcName] = [];
      await seedSlot(`service: ${svcName}`, queries.services[i], lib[key].services[svcName]);
    }
  }

  // Seed cta
  await seedSlot('cta', queries.cta, lib[key].cta);

  console.log(`\n\ud83d\udcca  Summary: ${totalFetched} photos fetched, ${save ? `${totalAdded} added to library` : 'DRY RUN \u2014 add --save to persist'}`);

  if (save) {
    saveLibrary(lib);
    console.log(`\ud83d\udcbe  Library saved: ${LIBRARY_PATH}\n`);
  }
}

// ── SHOW CURATED COUNTS ──────────────────────────────────────────────────────
function showCurated(industry) {
  const lib = loadLibrary();
  const key = industry ? industry.toLowerCase().trim() : null;

  if (key && lib[key]) {
    const ind = lib[key];
    console.log(`\n\ud83d\udcf7  Curated photos for "${key}":\n`);
    console.log(`  hero:    ${(ind.hero || []).length} photos`);
    console.log(`  about:   ${(ind.about || []).length} photos`);
    if (ind.services) {
      for (const [svc, arr] of Object.entries(ind.services)) {
        console.log(`  svc/${svc.substring(0, 25).padEnd(25)}: ${arr.length} photos`);
      }
    }
    console.log(`  cta:     ${(ind.cta || []).length} photos`);
    const total = (ind.hero || []).length + (ind.about || []).length +
      Object.values(ind.services || {}).reduce((s, a) => s + a.length, 0) + (ind.cta || []).length;
    console.log(`\n  Total: ${total} curated photos\n`);
  } else {
    console.log(`\n\ud83d\udcf7  Curated photo counts by industry:\n`);
    for (const [ind, data] of Object.entries(lib)) {
      if (ind === '_meta') continue;
      const total = (data.hero || []).length + (data.about || []).length +
        Object.values(data.services || {}).reduce((s, a) => s + a.length, 0) + (data.cta || []).length;
      console.log(`  ${ind.padEnd(20)} ${total} photos`);
    }
    console.log('');
  }
}

// ── ADD PHOTO MANUALLY ───────────────────────────────────────────────────────
async function addPhoto(industry, slot, photoUrl) {
  const key = industry.toLowerCase().trim();
  const lib = loadLibrary();

  if (!lib[key]) {
    console.log(`\u274c  Industry "${key}" not found in library`);
    return;
  }

  // Fetch photo info from Pexels to get metadata
  // For now, just add with the URL directly
  const photo = {
    url: photoUrl,
    medium: photoUrl,
    small: photoUrl,
    original: photoUrl,
    width: 0,
    height: 0,
    alt: `${key} ${slot} photo`,
    photographer: 'manual',
    pexelsUrl: photoUrl,
    tag: 'manual',
    addedDate: new Date().toISOString().split('T')[0],
  };

  if (slot === 'hero' || slot === 'about' || slot === 'cta') {
    if (!lib[key][slot]) lib[key][slot] = [];
    lib[key][slot].push(photo);
    saveLibrary(lib);
    console.log(`\u2705  Added photo to ${key} > ${slot} (${lib[key][slot].length} total)`);
  } else if (slot.startsWith('svc:') || slot.startsWith('service:')) {
    const svcName = slot.replace(/^(svc|service):/, '').trim();
    if (!lib[key].services) lib[key].services = {};
    if (!lib[key].services[svcName]) lib[key].services[svcName] = [];
    lib[key].services[svcName].push(photo);
    saveLibrary(lib);
    console.log(`\u2705  Added photo to ${key} > services > ${svcName} (${lib[key].services[svcName].length} total)`);
  } else {
    console.log(`\u274c  Unknown slot "${slot}". Use: hero, about, cta, or svc:ServiceName`);
  }
}

// ── CLI ────────────────────────────────────────────────────────────────────────
async function main() {
  const [,, cmd, arg1, arg2, arg3] = process.argv;
  const hasFlag = (flag) => process.argv.includes(flag);

  switch (cmd) {
    case 'test': {
      console.log('\n\ud83e\uddea  Fetching 3 tattoo photos from Pexels...\n');
      try {
        const photos = await getPhotos('tattoo', 3);
        if (photos.length === 0) { console.log('No photos returned.'); return; }
        photos.forEach((p, i) => {
          console.log(`  #${i + 1}  ${p.url}`);
          console.log(`       ${p.width}x${p.height} \u2014 by ${p.photographer}`);
          console.log(`       Alt: ${p.alt}\n`);
        });
        console.log(`\u2705  ${photos.length} photos fetched.`);
      } catch (err) { console.error(`\u274c  ${err.message}`); }
      break;
    }

    case 'search': {
      if (!arg1) { console.log('Usage: node pexels-engine.js search "industry" [count]'); return; }
      const count = parseInt(arg2, 10) || 3;
      const key = arg1.toLowerCase().trim();
      const query = INDUSTRY_MAP[key] || key;
      console.log(`\n\ud83d\udd0d  Searching Pexels: "${query}" (${count} photos)\n`);
      try {
        const photos = await getPhotos(arg1, count);
        if (photos.length === 0) { console.log('No photos returned.'); return; }
        photos.forEach((p, i) => {
          console.log(`  #${i + 1}  ${p.url}`);
          console.log(`       ${p.width}x${p.height} \u2014 by ${p.photographer}\n`);
        });
        console.log(`\u2705  ${photos.length} photos fetched.`);
      } catch (err) { console.error(`\u274c  ${err.message}`); }
      break;
    }

    case 'industries': {
      console.log('\n\ud83d\udccb  Industry \u2192 Search Query Map\n');
      const maxLen = Math.max(...Object.keys(INDUSTRY_MAP).map(k => k.length));
      Object.entries(INDUSTRY_MAP).forEach(([industry, query]) => {
        console.log(`  ${industry.padEnd(maxLen + 2)} \u2192 "${query}"`);
      });
      console.log(`\n  ${Object.keys(INDUSTRY_MAP).length} industries mapped.\n`);
      break;
    }

    case 'seed': {
      if (!arg1) {
        console.log('Usage: node pexels-engine.js seed <industry> [--save]');
        console.log(`Available: ${Object.keys(INDUSTRY_QUERIES).join(', ')}`);
        return;
      }
      await seedPhotoLibrary(arg1, hasFlag('--save'));
      break;
    }

    case 'curated': {
      showCurated(arg1);
      break;
    }

    case 'add': {
      if (!arg1 || !arg2 || !arg3) {
        console.log('Usage: node pexels-engine.js add <industry> <slot> <url>');
        console.log('Slots: hero, about, cta, svc:ServiceName');
        return;
      }
      await addPhoto(arg1, arg2, arg3);
      break;
    }

    default:
      console.log(`
\x1b[33mHOO Pexels Engine v2.0\x1b[0m \u2014 Curated Photo Library + API Fallback

Commands:
  test                               Fetch 3 tattoo photos (quick check)
  search "industry" [count]          Fetch photos for any industry
  industries                         List all mapped industry keywords
  seed <industry>                    Fetch photo candidates (dry run)
  seed <industry> --save             Fetch and save to library
  curated [industry]                 Show curated photo counts
  add <industry> <slot> <url>        Manually add a photo to a slot

Examples:
  node pexels-engine.js seed cleaning --save
  node pexels-engine.js curated cleaning
  node pexels-engine.js add painting hero https://images.pexels.com/...

Require:
  const { getCuratedPhotos } = require('./pexels-engine');
  const photos = await getCuratedPhotos('cleaning', 10);

API Key: Set PEXELS_API_KEY in .env (free at pexels.com/api)
Photo Library: ${LIBRARY_PATH}
      `);
  }
}

// ── EXPORTS ───────────────────────────────────────────────────────────────────
module.exports = { getPhotos, getCuratedPhotos, seedPhotoLibrary, INDUSTRY_MAP, INDUSTRY_QUERIES };

if (require.main === module) {
  main().catch(console.error);
}

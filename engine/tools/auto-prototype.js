/**
 * HOO Auto-Prototype v4.0 — V4 Template Demo Engine
 * Lead → Competitor Intel → Pexels Photos → V4 Template Swap → Email
 *
 * v4.0: Uses pre-built V4 industry demo templates as the base. Swaps in lead's
 *       business name, phone, city, and fresh Pexels photos. Layout stays locked.
 *       Falls back to v3 generated template if no V4 template exists.
 *
 * Usage:
 *   node auto-prototype.js build <lead.json>              Build demo (dry run preview)
 *   node auto-prototype.js build <lead.json> --send       Build + email demo link to lead
 *   node auto-prototype.js build <lead.json> --send --live Build + actually send email
 *   node auto-prototype.js test                           Build demo for fake tattoo lead
 *   node auto-prototype.js test --industry=cleaning       Test with specific industry theme
 *
 * Output: outputs/demos/LEAD-{id}-{business-slug}.html
 *         outputs/prototypes/LEAD-{id}-color-intel.json
 */

require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const fs   = require('fs');
const path = require('path');
const { getPhotos, getCuratedPhotos, INDUSTRY_MAP } = require('./pexels-engine');

const OUTPUTS_DIR = path.join(__dirname, '..', '..', 'outputs', 'demos');
const DEMOS_DIR   = path.join(__dirname, '..', '..', 'demos');
const INTEL_DIR   = path.join(__dirname, '..', '..', 'outputs', 'prototypes');
const IS_SEND     = process.argv.includes('--send');
const IS_LIVE     = process.argv.includes('--live');

// ── V4 TEMPLATE MAP ──────────────────────────────────────────────────────────
// Each industry maps to its V4 template file and placeholder business info.
// The engine reads the template, swaps placeholders with real lead data.
const V4_TEMPLATES = {
  'auto detailing':    { file: 'v7-auto-detailing-demo-LOCKED.html', placeholder: 'Mirror Finish KC',     shortName: 'Mirror Finish',   brandWord: 'Mirror',   phone: '(816) 555-0347' },
  'auto repair':       { file: 'v4-auto-repair-demo.html',       placeholder: 'Precision Auto KC',        shortName: 'Precision Auto',  brandWord: 'Precision', phone: '(816) 955-1234' },
  barber:              { file: 'v4-barber-demo.html',             placeholder: 'Iron & Blade Barbershop',  shortName: 'Iron & Blade',    brandWord: null,       phone: '(816) 955-1234' },
  cleaning:            { file: 'v7-cleaning-demo-LOCKED.html',    placeholder: 'Pristine Clean KC',        shortName: 'Pristine Clean',  brandWord: 'Pristine', phone: '(816) 555-0147' },
  fencing:             { file: 'v7-fencing-demo-LOCKED.html',     placeholder: 'Ironline Fencing KC',      shortName: 'Ironline',        brandWord: 'Ironline', phone: '(804) 957-1003' },
  'food truck':        { file: 'v7-food-truck-demo-LOCKED.html',  placeholder: 'Fuego KC',                 shortName: 'Fuego',           brandWord: 'Fuego',    phone: '(816) 555-0193' },
  handyman:            { file: 'v4-handyman-demo.html',           placeholder: 'FixIt Pro KC',             shortName: 'FixIt Pro',       brandWord: 'FixIt',    phone: '(816) 955-1234' },
  'junk removal':      { file: 'v4-junk-removal-demo.html',       placeholder: 'KC Junk Pros',             shortName: 'KC Junk',         brandWord: null,       phone: '(816) 955-1234' },
  landscaping:         { file: 'v4-landscaping-demo.html',        placeholder: 'Stonegate Landscapes',     shortName: 'Stonegate',       brandWord: 'Stonegate', phone: '(816) 555-0247' },
  'lawn care':         { file: 'v7-lawn-care-demo-LOCKED.html',   placeholder: 'Greenfield Lawn',          shortName: 'Greenfield',      brandWord: 'Greenfield', phone: '(816) 555-0147' },
  moving:              { file: 'v7-moving-demo-LOCKED.html',      placeholder: 'North Star Moving',        shortName: 'North Star',      brandWord: 'North Star', phone: '(816) 555-0123' },
  painting:            { file: 'v7-painting-demo-LOCKED.html',    placeholder: 'True Coat Painting KC',    shortName: 'True Coat',       brandWord: 'True Coat', phone: '(913) 555-0147' },
  'personal training': { file: 'v7-personal-training-demo-LOCKED.html', placeholder: 'IRONCLAD FITNESS',  shortName: 'IRONCLAD',        brandWord: 'Ironclad', phone: '(816) 555-4766' },
  clothing:            { file: 'v7-risen-clothing-demo-LOCKED.html', placeholder: 'RISEN',                shortName: 'RISEN',           brandWord: 'RISEN',    phone: '(000) 000-0000' },
  'pet grooming':      { file: 'v7-pet-grooming-demo-LOCKED.html', placeholder: 'Paws & Suds',            shortName: 'Paws & Suds',     brandWord: 'Paws',     phone: '(816) 555-7297' },
  photography:         { file: 'v7-photography-demo-LOCKED.html', placeholder: 'Long Light Studio',        shortName: 'Long Light',      brandWord: 'Long Light', phone: '(816) 555-0182' },
  'pressure washing':  { file: 'v7-pressure-washing-demo-LOCKED.html', placeholder: 'BlastClean KC',       shortName: 'BlastClean',      brandWord: 'BlastClean', phone: '(816) 555-0284' },
  roofing:             { file: 'v7-roofing-demo-LOCKED.html',     placeholder: 'Summit Roofing',           shortName: 'Summit Roofing',  brandWord: 'Summit',   phone: '(816) 955-0100' },
  tattoo:              { file: 'v4-tattoo-demo.html',             placeholder: 'Iron & Ink Tattoo',        shortName: 'Iron & Ink',      brandWord: null,       phone: '(816) 955-1234' },
};

// ── INDUSTRY COLOR THEMES (ALL LIGHT) ────────────────────────────────────────
// Every theme is light: white bg, tinted bg2/bg3, dark text, colored primary
const INDUSTRY_THEMES = {
  cleaning:             { bg: '#FFFFFF', bg2: '#F0F4F8', bg3: '#E4EBF2', primary: '#3498DB', primaryHover: '#5DADE2', accent: '#2C3E50', text: '#1A1A1A', textDim: 'rgba(26,26,26,.55)' },
  'lawn care':          { bg: '#FFFFFF', bg2: '#F0F5ED', bg3: '#E4EDE0', primary: '#2D6A4F', primaryHover: '#40916C', accent: '#C8952E', text: '#1A1A1A', textDim: 'rgba(26,26,26,.55)' },
  handyman:             { bg: '#FFFFFF', bg2: '#F5F2ED', bg3: '#EDE8E0', primary: '#CC5500', primaryHover: '#E67300', accent: '#2C3E50', text: '#1A1A1A', textDim: 'rgba(26,26,26,.55)' },
  painting:             { bg: '#FFFFFF', bg2: '#F5F2F8', bg3: '#EDE8F2', primary: '#4A0E8F', primaryHover: '#6B21B0', accent: '#C8952E', text: '#1A1A1A', textDim: 'rgba(26,26,26,.55)' },
  landscaping:          { bg: '#FFFFFF', bg2: '#F0F5ED', bg3: '#E4EDE0', primary: '#1A5C38', primaryHover: '#2D8B57', accent: '#8B4513', text: '#1A1A1A', textDim: 'rgba(26,26,26,.55)' },
  moving:               { bg: '#FFFFFF', bg2: '#F8F2F0', bg3: '#F0E8E5', primary: '#C0392B', primaryHover: '#E74C3C', accent: '#2C3E50', text: '#1A1A1A', textDim: 'rgba(26,26,26,.55)' },
  'auto detailing':     { bg: '#FFFFFF', bg2: '#F8F2F0', bg3: '#F0E8E5', primary: '#C0392B', primaryHover: '#E74C3C', accent: '#C0C0C0', text: '#1A1A1A', textDim: 'rgba(26,26,26,.55)' },
  'pressure washing':   { bg: '#FFFFFF', bg2: '#F0F4F8', bg3: '#E4EBF2', primary: '#3498DB', primaryHover: '#5DADE2', accent: '#2C3E50', text: '#1A1A1A', textDim: 'rgba(26,26,26,.55)' },
  'pet grooming':       { bg: '#FFFFFF', bg2: '#F5F2F8', bg3: '#EDE8F2', primary: '#9B59B6', primaryHover: '#BB77D4', accent: '#E91E8C', text: '#1A1A1A', textDim: 'rgba(26,26,26,.55)' },
  tattoo:               { bg: '#FFFFFF', bg2: '#F8F2F0', bg3: '#F0E8E5', primary: '#C0392B', primaryHover: '#E74C3C', accent: '#1A1A1A', text: '#1A1A1A', textDim: 'rgba(26,26,26,.55)' },
  'food truck':         { bg: '#FFFFFF', bg2: '#F8F3ED', bg3: '#F0E8DE', primary: '#CC5500', primaryHover: '#E67300', accent: '#2C3E50', text: '#1A1A1A', textDim: 'rgba(26,26,26,.55)' },
  roofing:              { bg: '#FFFFFF', bg2: '#F8F2F0', bg3: '#F0E8E5', primary: '#C0392B', primaryHover: '#E74C3C', accent: '#2C3E50', text: '#1A1A1A', textDim: 'rgba(26,26,26,.55)' },
  fencing:              { bg: '#FFFFFF', bg2: '#F0F5ED', bg3: '#E4EDE0', primary: '#2D6A4F', primaryHover: '#40916C', accent: '#8B6914', text: '#1A1A1A', textDim: 'rgba(26,26,26,.55)' },
  'personal training':  { bg: '#FFFFFF', bg2: '#F8F5ED', bg3: '#F0EBDF', primary: '#C8952E', primaryHover: '#E8B84B', accent: '#1A1A1A', text: '#1A1A1A', textDim: 'rgba(26,26,26,.55)' },
  barber:               { bg: '#FFFFFF', bg2: '#F8F2F0', bg3: '#F0E8E5', primary: '#C0392B', primaryHover: '#E74C3C', accent: '#2C3E50', text: '#1A1A1A', textDim: 'rgba(26,26,26,.55)' },
  photography:          { bg: '#FFFFFF', bg2: '#F8F5ED', bg3: '#F0EBDF', primary: '#C8952E', primaryHover: '#E8B84B', accent: '#1A1A1A', text: '#1A1A1A', textDim: 'rgba(26,26,26,.55)' },
  'junk removal':       { bg: '#FFFFFF', bg2: '#F8F3ED', bg3: '#F0E8DE', primary: '#CC5500', primaryHover: '#E67300', accent: '#2C3E50', text: '#1A1A1A', textDim: 'rgba(26,26,26,.55)' },
  'mobile mechanic':    { bg: '#FFFFFF', bg2: '#F0F4F8', bg3: '#E4EBF2', primary: '#3498DB', primaryHover: '#5DADE2', accent: '#2C3E50', text: '#1A1A1A', textDim: 'rgba(26,26,26,.55)' },
  'auto repair':        { bg: '#FFFFFF', bg2: '#F0F4F8', bg3: '#E4EBF2', primary: '#2C3E50', primaryHover: '#34495E', accent: '#C0392B', text: '#1A1A1A', textDim: 'rgba(26,26,26,.55)' },
};

const DEFAULT_THEME = { bg: '#FFFFFF', bg2: '#F5F3F0', bg3: '#EDEAE6', primary: '#C8952E', primaryHover: '#E8B84B', accent: '#1A1A1A', text: '#1A1A1A', textDim: 'rgba(26,26,26,.55)' };

// ── INDUSTRY COPY (EXPANDED — every industry gets custom content) ────────────
const INDUSTRY_COPY = {
  painting: {
    verb: 'painting', heroLabel: 'Professional Painters',
    services: ['Interior Painting', 'Exterior Painting', 'Cabinet Refinishing', 'Deck Staining', 'Drywall Repair', 'Color Consultation'],
    svcDesc: [
      'Clean lines, zero mess. Every room prepped, primed, and painted to perfection.',
      'Power wash, scrape, prime, two coats \u2014 curb appeal that lasts through every season.',
      'New kitchen feel without the remodel price. Sand, prime, spray \u2014 factory-smooth finish.',
      'Premium stain that protects wood through sun, rain, and snow for years to come.',
      'Holes, cracks, water damage \u2014 patched and texture-matched so you\u2019d never know.',
      'We bring swatches, test in your lighting, and help pick the perfect color.'
    ],
    tagline: 'Fresh Paint. Fresh Start.', sub: 'Interior, exterior, and cabinet painting \u2014 done right the first time. Free estimates for every project.',
    cta: ['YOUR HOME DESERVES', 'FRESH PAINT', 'Schedule your free walk-through estimate today. We\u2019ll come to you, see the project in person, and give you an honest quote \u2014 no pressure, no obligation.'],
    pillars: [
      ['FREE WALK-THROUGH', 'We see the job in person before quoting. No guesswork, no surprises.'],
      ['FULL PREP INCLUDED', 'Sanding, taping, priming, drop cloths \u2014 we prep every surface the right way.'],
      ['LICENSED & INSURED', 'Fully covered so you never have to worry about your home.'],
      ['SPOTLESS CLEAN-UP', 'When we leave, the only thing different is your walls.']
    ],
    reviews: [
      ['Painted our entire first floor in two days. Tape lines were perfect, and they even moved the furniture back.', 'SARAH M.'],
      ['Only contractor who walked the whole house and pointed out issues we didn\u2019t see. Fair price, great work.', 'JAMES T.'],
      ['Had our cabinets refinished instead of replacing. Saved thousands and they look brand new.', 'LISA R.']
    ],
    trust: [['&#10003;', 'Free Estimates', 'No obligation'], ['&#9881;', 'Licensed & Insured', 'Full coverage'], ['&#9733;', 'Locally Owned', 'We live here too']],
    aboutP2: 'Every project gets walked through in person before a brush touches the wall. No surprises on the invoice, no cutting corners behind the trim.'
  },
  cleaning: {
    verb: 'cleaning', heroLabel: 'Professional Cleaning',
    services: ['Deep Cleaning', 'Regular Maintenance', 'Move-In/Move-Out', 'Office Cleaning', 'Carpet & Upholstery', 'Window Cleaning'],
    svcDesc: [
      'Top-to-bottom scrub that gets into every corner, baseboard, and blind.',
      'Scheduled cleanings that keep your home consistently fresh without lifting a finger.',
      'Spotless handoff for your next chapter \u2014 every surface sanitized and inspection-ready.',
      'Clean offices mean productive teams. We work around your schedule.',
      'Deep extraction that pulls embedded dirt and allergens from fibers.',
      'Streak-free shine inside and out. We bring our own equipment.'
    ],
    tagline: 'A Spotless Home, Every Time', sub: 'Professional cleaning services that bring the shine back to your space.',
    cta: ['YOUR SPACE DESERVES', 'A FRESH START', 'Book your first cleaning today. We\u2019ll handle everything \u2014 you just enjoy the results.'],
    pillars: [
      ['BACKGROUND-CHECKED', 'Every team member vetted and verified for your peace of mind.'],
      ['ECO-FRIENDLY PRODUCTS', 'Safe for kids, pets, and the planet \u2014 no harsh chemicals.'],
      ['SATISFACTION GUARANTEED', 'Not happy? We\u2019ll come back and make it right, free of charge.'],
      ['FLEXIBLE SCHEDULING', 'Weekly, biweekly, monthly, or one-time \u2014 whatever works for you.']
    ],
    reviews: [
      ['Came home to a spotless house after their deep clean. Even the baseboards were perfect.', 'MARIA L.'],
      ['Been using them biweekly for six months. Most consistent cleaning crew we\u2019ve ever had.', 'DAVID K.'],
      ['Our move-out clean got our full deposit back. Worth every penny.', 'ASHLEY R.']
    ],
    trust: [['&#10003;', 'Free Estimates', 'No obligation'], ['&#128274;', 'Bonded & Insured', 'Full protection'], ['&#9733;', 'Background Checked', 'Vetted team']],
    aboutP2: 'We show up on time, every time. Our crews follow a detailed checklist for every home so nothing gets missed \u2014 ever.'
  },
  'lawn care': {
    verb: 'lawn care', heroLabel: 'Professional Lawn Care',
    services: ['Weekly Mowing', 'Edging & Trimming', 'Fertilization', 'Weed Control', 'Leaf Removal', 'Seasonal Cleanup'],
    svcDesc: [
      'Consistent cut height, clean lines, clippings blown off \u2014 every single week.',
      'Crisp edges along sidewalks, beds, and driveways that frame your lawn perfectly.',
      'Seasonal feeding programs that keep your grass thick, green, and healthy.',
      'Targeted treatments that eliminate weeds without harming your lawn or soil.',
      'Full yard cleared of leaves, debris bagged and hauled \u2014 no trace left behind.',
      'Spring prep and fall cleanup to keep your property looking sharp year-round.'
    ],
    tagline: 'The Best Lawn on the Block', sub: 'Professional lawn care that keeps your yard looking pristine all season long.',
    cta: ['YOUR YARD DESERVES', 'THE BEST CARE', 'Get a free quote today. We\u2019ll keep your lawn looking better than the neighbors\u2019.'],
    pillars: [
      ['SAME-DAY QUOTES', 'Tell us what you need and we\u2019ll get back to you today.'],
      ['ALL EQUIPMENT PROVIDED', 'Commercial-grade mowers and tools \u2014 you don\u2019t supply a thing.'],
      ['CONSISTENT SCHEDULING', 'Same day, same time, same crew \u2014 like clockwork.'],
      ['CLEAN EDGES EVERY TIME', 'We don\u2019t just mow \u2014 we edge, trim, and blow off every surface.']
    ],
    reviews: [
      ['Best lawn service we\u2019ve had in ten years. They show up same time every week without fail.', 'MIKE D.'],
      ['Our HOA actually complimented our yard for the first time. That says it all.', 'JENNIFER W.'],
      ['Signed up for mowing, added fertilization \u2014 lawn has never been this thick and green.', 'ROBERT S.']
    ],
    trust: [['&#10003;', 'Free Quotes', 'Same-day response'], ['&#9881;', 'Licensed & Insured', 'Full coverage'], ['&#9733;', 'Locally Owned', 'We live here too']],
    aboutP2: 'We bring commercial-grade equipment to every job. Your lawn gets the same level of care whether it\u2019s a quarter acre or five.'
  },
  handyman: {
    verb: 'handyman', heroLabel: 'Professional Handyman',
    services: ['General Repairs', 'Drywall & Painting', 'Plumbing Fixes', 'Electrical Work', 'Furniture Assembly', 'Deck & Fence Repair'],
    svcDesc: [
      'That list of small jobs you\u2019ve been putting off? We knock them all out in one visit.',
      'Patch, sand, paint \u2014 walls look like new. No job too small.',
      'Leaky faucets, running toilets, garbage disposals \u2014 fixed fast and done right.',
      'Outlets, switches, ceiling fans, light fixtures \u2014 safe, up to code.',
      'Desks, shelves, bed frames, gym equipment \u2014 built and level on the first try.',
      'Boards replaced, posts reset, stain applied \u2014 your outdoor space restored.'
    ],
    tagline: 'Fixed Right the First Time', sub: 'Reliable handyman services for every job around the house.',
    cta: ['YOUR HOME DESERVES', 'A HELPING HAND', 'Book your handyman visit today. One call handles it all \u2014 no job too small.'],
    pillars: [
      ['ONE-CALL SOLUTION', 'Plumbing, electrical, drywall, assembly \u2014 we handle it all.'],
      ['NO JOB TOO SMALL', 'Hanging shelves to rebuilding decks \u2014 every job gets full effort.'],
      ['LICENSED & INSURED', 'Proper coverage for every job we take on.'],
      ['CLEAN WORKSPACE', 'We protect your floors and clean up when we\u2019re done.']
    ],
    reviews: [
      ['Had a list of 8 things \u2014 he knocked them all out in one afternoon. Incredible.', 'KAREN P.'],
      ['Fixed our deck railing, patched drywall, and installed a ceiling fan. All in one trip.', 'STEVE M.'],
      ['Most reliable handyman we\u2019ve found. Shows up when he says, does what he quotes.', 'LINDA G.']
    ],
    trust: [['&#10003;', 'Free Estimates', 'No obligation'], ['&#9881;', 'Licensed & Insured', 'Full coverage'], ['&#128337;', 'Same-Week Service', 'Fast turnaround']],
    aboutP2: 'No fancy sales pitch, no upselling. You tell us what\u2019s broken, we fix it. You tell us what you need built, we build it.'
  },
  landscaping: {
    verb: 'landscaping', heroLabel: 'Professional Landscaping',
    services: ['Landscape Design', 'Hardscaping', 'Irrigation Systems', 'Garden Installation', 'Tree & Shrub Care', 'Outdoor Lighting'],
    svcDesc: [
      'Custom designs that transform your vision into a plan \u2014 then into reality.',
      'Patios, retaining walls, walkways \u2014 built to last with premium materials.',
      'Efficient sprinkler systems that keep everything green without wasting water.',
      'Flower beds, raised planters, and garden features that add color year-round.',
      'Pruning, shaping, and seasonal care that keeps your landscape looking its best.',
      'Path lights, accent spots, and ambient lighting that extend your outdoor living.'
    ],
    tagline: 'Transform Your Outdoor Space', sub: 'Professional landscaping that turns your yard into a backyard paradise.',
    cta: ['YOUR PROPERTY DESERVES', 'A TRANSFORMATION', 'Schedule your free design consultation. We\u2019ll walk your property and show you what\u2019s possible.'],
    pillars: [
      ['CUSTOM DESIGNS', 'Every landscape is unique \u2014 cookie-cutter plans don\u2019t live here.'],
      ['PROFESSIONAL INSTALL', 'Licensed crews with commercial equipment for clean, lasting results.'],
      ['DRAINAGE EXPERTISE', 'We solve water problems before they become foundation problems.'],
      ['YEAR-ROUND CARE', 'Seasonal maintenance plans that protect your investment.']
    ],
    reviews: [
      ['They turned our muddy backyard into an actual outdoor living space. Patio, plants, lighting \u2014 everything.', 'CHRIS B.'],
      ['Best investment we\u2019ve made in our home. Curb appeal went through the roof.', 'AMANDA F.'],
      ['The irrigation system alone saved us hours a week. Should have done this years ago.', 'PAUL N.']
    ],
    trust: [['&#10003;', 'Free Consultation', 'Design walkthrough'], ['&#9881;', 'Licensed & Insured', 'Full coverage'], ['&#9733;', 'Locally Owned', 'We know the soil']],
    aboutP2: 'We start with your vision and end with a landscape that makes you want to spend every evening outside.'
  },
  moving: {
    verb: 'moving', heroLabel: 'Professional Movers',
    services: ['Local Moves', 'Long Distance', 'Packing Services', 'Loading & Unloading', 'Storage Solutions', 'Commercial Moving'],
    svcDesc: [
      'Same-city moves handled fast \u2014 your furniture protected, your timeline respected.',
      'State-to-state relocations with tracking, insurance, and guaranteed delivery windows.',
      'We bring boxes, wrap everything, and pack your entire home room by room.',
      'Need muscle? We\u2019ll load your truck, trailer, or pod \u2014 nothing gets damaged.',
      'Short-term or long-term \u2014 clean, secure, climate-controlled storage options.',
      'Office relocations planned around your business hours to minimize downtime.'
    ],
    tagline: 'Moving Made Simple', sub: 'Stress-free moving services \u2014 we handle the heavy lifting so you don\u2019t have to.',
    cta: ['YOUR MOVE DESERVES', 'ZERO STRESS', 'Get your free moving quote today. We\u2019ll plan every detail so you don\u2019t have to.'],
    pillars: [
      ['ON-TIME GUARANTEED', 'We show up when we say \u2014 your schedule is our schedule.'],
      ['NO HIDDEN FEES', 'The quote you get is the price you pay. Period.'],
      ['FURNITURE PROTECTION', 'Blankets, straps, and corner guards on every piece.'],
      ['LICENSED & INSURED', 'Full coverage for your belongings from pickup to delivery.']
    ],
    reviews: [
      ['Moved our 3-bedroom house in under 5 hours. Not a single scratch on anything.', 'TONY R.'],
      ['They packed our entire kitchen in an hour. Every glass arrived in one piece.', 'RACHEL H.'],
      ['Third time using them. Prices are fair and they treat your stuff like it\u2019s theirs.', 'MARCUS J.']
    ],
    trust: [['&#10003;', 'Free Estimates', 'No obligation'], ['&#128274;', 'Licensed & Insured', 'Full cargo coverage'], ['&#128337;', 'On-Time Guaranteed', 'We show up when we say']],
    aboutP2: 'We\u2019ve handled thousands of moves \u2014 from studio apartments to five-bedroom houses. Every one gets the same level of care.'
  },
  'auto detailing': {
    verb: 'detailing', heroLabel: 'Professional Detailing',
    services: ['Full Detail', 'Interior Deep Clean', 'Exterior Polish', 'Ceramic Coating', 'Paint Correction', 'Mobile Service'],
    svcDesc: [
      'Inside and out \u2014 every surface cleaned, conditioned, and protected to showroom standard.',
      'Seats, carpets, dash, vents, door jams \u2014 deep cleaned and sanitized.',
      'Hand wash, clay bar, polish, wax \u2014 your paint protected and mirror-perfect.',
      'Long-lasting ceramic protection that repels water, dirt, and UV damage for years.',
      'Swirl marks, scratches, and oxidation removed \u2014 your paint restored to factory.',
      'We come to your home or office. Same quality, zero hassle.'
    ],
    tagline: 'Showroom Shine, Every Time', sub: 'Professional auto detailing that makes your ride look brand new.',
    cta: ['YOUR RIDE DESERVES', 'THE BEST DETAIL', 'Book your detail today. Mobile service available \u2014 we come to you.'],
    pillars: [
      ['HAND-WASHED ONLY', 'No automated brushes. Every panel washed by hand, every time.'],
      ['PAINT PROTECTION', 'Ceramic coatings and sealants that last months, not days.'],
      ['MOBILE SERVICE', 'We come to your driveway, office, or anywhere you park.'],
      ['SATISFACTION GUARANTEED', 'Not perfect? We\u2019ll make it right on the spot.']
    ],
    reviews: [
      ['My car hasn\u2019t looked this good since I drove it off the lot. Interior smells amazing.', 'ALEX C.'],
      ['Got the ceramic coating \u2014 water just beads off now. Worth every penny.', 'BRIAN T.'],
      ['They came to my office parking lot. Car was done by lunch. So convenient.', 'NICOLE W.']
    ],
    trust: [['&#10003;', 'Free Estimates', 'No obligation'], ['&#9881;', 'Fully Insured', 'Your vehicle protected'], ['&#128666;', 'Mobile Service', 'We come to you']],
    aboutP2: 'We treat every vehicle like it\u2019s our own. From daily drivers to weekend toys, the standard is the same \u2014 perfection.'
  },
  'pressure washing': {
    verb: 'pressure washing', heroLabel: 'Professional Pressure Washing',
    services: ['Driveway Cleaning', 'House Washing', 'Deck & Patio', 'Fence Cleaning', 'Roof Soft Wash', 'Commercial Properties'],
    svcDesc: [
      'Oil stains, tire marks, algae \u2014 blasted away. Your driveway looking brand new.',
      'Gentle soft wash that removes dirt and mildew without damaging siding or paint.',
      'Years of grime stripped in hours. Your outdoor space ready to enjoy again.',
      'Wood, vinyl, or chain link \u2014 restored to like-new condition safely.',
      'Low-pressure treatment that kills algae and moss without harming shingles.',
      'Storefronts, parking lots, sidewalks \u2014 clean properties attract more business.'
    ],
    tagline: 'Restore the Clean', sub: 'Professional pressure washing that strips away years of grime in hours.',
    cta: ['YOUR PROPERTY DESERVES', 'A FRESH LOOK', 'Get your free pressure washing quote today. See the difference one wash makes.'],
    pillars: [
      ['SOFT WASH OPTION', 'Gentle cleaning for delicate surfaces like siding and roofs.'],
      ['ECO-FRIENDLY', 'Biodegradable detergents safe for your lawn and landscaping.'],
      ['SAME-WEEK SERVICE', 'Fast scheduling \u2014 most jobs completed within the week.'],
      ['NO DAMAGE GUARANTEED', 'The right pressure for every surface. We protect your property.']
    ],
    reviews: [
      ['Our driveway looked 10 years newer in 30 minutes. Should have done this ages ago.', 'TOM H.'],
      ['They soft washed our entire house exterior. Looks like a fresh paint job.', 'SANDRA L.'],
      ['Deck was black with algae. Now it looks like new wood. Incredible difference.', 'KEVIN B.']
    ],
    trust: [['&#10003;', 'Free Estimates', 'No obligation'], ['&#9881;', 'Licensed & Insured', 'Property protected'], ['&#9733;', 'Locally Owned', 'We know the area']],
    aboutP2: 'We use the right pressure for every surface. Concrete gets the full blast, siding gets the gentle touch. No damage, guaranteed.'
  },
  'pet grooming': {
    verb: 'grooming', heroLabel: 'Professional Pet Grooming',
    services: ['Full Grooming', 'Bath & Brush', 'Nail Trimming', 'De-Shedding', 'Puppy First Groom', 'Mobile Grooming'],
    svcDesc: [
      'Complete groom \u2014 bath, haircut, nails, ears, and a bandana to finish.',
      'Quick refresh between full grooms. Clean, brushed out, and smelling great.',
      'Safe, stress-free nail trims with treats and patience.',
      'Special tools and techniques that remove loose undercoat without irritation.',
      'Gentle introduction designed to make your puppy love grooming from day one.',
      'Full salon service in our mobile van \u2014 right in your driveway.'
    ],
    tagline: 'Pampered Pets, Happy Owners', sub: 'Professional pet grooming that keeps your furry family looking and feeling their best.',
    cta: ['YOUR PET DESERVES', 'THE VIP TREATMENT', 'Book your pet\u2019s grooming appointment today. Walk-ins welcome for nail trims.'],
    pillars: [
      ['CERTIFIED GROOMERS', 'Trained professionals who know every breed\u2019s specific needs.'],
      ['GENTLE HANDLING', 'Patience first. We never rush, force, or stress your pet.'],
      ['BREED-SPECIFIC CUTS', 'From poodle clips to golden blowouts \u2014 we know the standards.'],
      ['CLEAN FACILITY', 'Sanitized between every pet. Fresh towels, clean tools, always.']
    ],
    reviews: [
      ['My anxious rescue actually wagged his tail when we pulled into the parking lot. That says everything.', 'EMMA J.'],
      ['Best groomer we\u2019ve ever used. Our goldendoodle looks like a show dog every time.', 'MATT P.'],
      ['The mobile grooming is a game changer. No car ride stress for my senior cat.', 'DIANA S.']
    ],
    trust: [['&#10003;', 'Walk-Ins Welcome', 'For nail trims'], ['&#9881;', 'Certified Groomers', 'Trained pros'], ['&#9733;', 'Clean Facility', 'Sanitized between pets']],
    aboutP2: 'Every pet that comes through our door gets treated like family. We work at their pace, use the gentlest products, and never rush a groom.'
  },
  tattoo: {
    verb: 'tattoo', heroLabel: 'Custom Tattoo Artists',
    services: ['Custom Designs', 'Portraits & Realism', 'Traditional & Neo-Trad', 'Blackwork & Geometric', 'Cover-Ups & Reworks', 'Free Consultations'],
    svcDesc: [
      'Your idea, our artistry. Every piece designed from scratch, never flash off a wall.',
      'Photo-realistic detail that captures every shadow, texture, and expression.',
      'Bold lines, saturated color, timeless style \u2014 classic Americana or modern evolution.',
      'Precision linework and sacred geometry that demands attention.',
      'Old ink transformed. We specialize in turning regrets into new favorites.',
      'Sit down, talk through your vision, see a sketch \u2014 no commitment required.'
    ],
    tagline: 'Your Vision, Perfected in Ink', sub: 'Custom tattoos crafted with precision. Every piece is a one-of-a-kind work of art.',
    cta: ['YOUR STORY DESERVES', 'GREAT INK', 'Book your free consultation. Bring your ideas \u2014 we\u2019ll bring them to life.'],
    pillars: [
      ['CUSTOM DESIGNS ONLY', 'No flash, no templates. Every tattoo is drawn for you.'],
      ['STERILE ENVIRONMENT', 'Hospital-grade sterilization. Single-use needles. Zero compromise.'],
      ['FREE CONSULTATION', 'Come in, talk through your idea, and see a custom sketch.'],
      ['PORTFOLIO REVIEW', 'Years of work you can see before you sit in the chair.']
    ],
    reviews: [
      ['Got a half-sleeve done over three sessions. The detail is unreal \u2014 people think it\u2019s a photo.', 'JAKE F.'],
      ['Covered up a 15-year-old tribal piece. You\u2019d never know anything was under there.', 'CHRIS A.'],
      ['The consultation alone sold me. They sketched my idea right there and nailed the vibe.', 'MEGAN T.']
    ],
    trust: [['&#10003;', 'Free Consultation', 'No commitment'], ['&#9881;', 'Sterile Environment', 'Hospital-grade'], ['&#9733;', 'Custom Art Only', 'No flash']],
    aboutP2: 'This isn\u2019t a walk-in flash shop. Every piece starts with your story, your vision, and hours of custom design work before needle ever meets skin.'
  },
  'food truck': {
    verb: 'food', heroLabel: 'Mobile Kitchen',
    services: ['Catering Events', 'Private Parties', 'Corporate Lunch', 'Festival Booking', 'Weekly Locations', 'Custom Menus'],
    svcDesc: [
      'Full-service catering from our truck to your event. Setup, serve, cleanup \u2014 all handled.',
      'Birthday, graduation, block party \u2014 we pull up and feed the whole crew.',
      'Weekly lunch service that gives your team something to actually look forward to.',
      'Festivals, fairs, and markets \u2014 we bring the crowd and the flavor.',
      'Follow us to find out where we\u2019re parked this week. Regulars get the best spots.',
      'Special dietary needs or themed menus? We\u2019ll build something custom for your event.'
    ],
    tagline: 'Street Food, Elevated', sub: 'Incredible food brought straight to you \u2014 wherever you are.',
    cta: ['YOUR EVENT DESERVES', 'GREAT FOOD', 'Book us for your next event. Check our schedule for weekly locations.'],
    pillars: [
      ['FRESH INGREDIENTS', 'Locally sourced when possible. Never frozen, never pre-made.'],
      ['EVENT CATERING', 'From 20 to 500 people \u2014 we scale to your crowd.'],
      ['CUSTOM MENUS', 'Dietary needs, themed events, special requests \u2014 we make it work.'],
      ['ON-TIME SETUP', 'We arrive early, set up fast, and start serving on schedule.']
    ],
    reviews: [
      ['Booked them for our company BBQ. 150 people and not a single complaint. Food was incredible.', 'DEREK M.'],
      ['The tacos alone are worth tracking them down every week. Best in the city.', 'VANESSA C.'],
      ['They catered our wedding rehearsal dinner. Guests are still talking about it.', 'RYAN & KATE']
    ],
    trust: [['&#10003;', 'Book Us', 'Events & private parties'], ['&#9881;', 'Health Certified', 'Licensed kitchen'], ['&#9733;', 'Fresh Daily', 'Never frozen']],
    aboutP2: 'We started with a passion for food and a truck. That hasn\u2019t changed \u2014 just the size of the crowds.'
  },
  roofing: {
    verb: 'roofing', heroLabel: 'Professional Roofing',
    services: ['Roof Replacement', 'Roof Repair', 'Storm Damage', 'Inspections', 'Gutter Installation', 'Commercial Roofing'],
    svcDesc: [
      'Full tear-off and re-roof with premium materials and manufacturer warranty.',
      'Leaks, missing shingles, flashing issues \u2014 found and fixed fast.',
      'Hail, wind, fallen trees \u2014 we handle the damage and the insurance paperwork.',
      'Free roof inspections that catch problems before they become expensive.',
      'Seamless gutters installed and fitted to protect your foundation and fascia.',
      'Flat roofs, TPO, metal, built-up \u2014 commercial solutions built to last.'
    ],
    tagline: 'Protection Above Everything', sub: 'Expert roofing services that keep your family safe and dry.',
    cta: ['YOUR FAMILY DESERVES', 'A SOLID ROOF', 'Schedule your free roof inspection today. We\u2019ll check every shingle and give you an honest assessment.'],
    pillars: [
      ['FREE INSPECTIONS', 'We check your roof for free and show you exactly what we find.'],
      ['STORM DAMAGE EXPERTS', 'Insurance claims filed and managed. We know the process.'],
      ['WARRANTY INCLUDED', 'Manufacturer warranty on materials plus our workmanship guarantee.'],
      ['LICENSED & INSURED', 'Full liability and worker\u2019s comp. Your property is protected.']
    ],
    reviews: [
      ['Replaced our entire roof after hail damage. Handled everything with the insurance company.', 'BILL S.'],
      ['Found a leak three other roofers missed. Fixed it in one visit for a fair price.', 'DONNA M.'],
      ['New roof looks incredible. Neighbors have already asked for their number.', 'GREG K.']
    ],
    trust: [['&#10003;', 'Free Inspections', 'No obligation'], ['&#9881;', 'Licensed & Insured', 'Full coverage'], ['&#128274;', 'Warranty Included', 'Materials + labor']],
    aboutP2: 'Your roof is the most important part of your house. We treat every roof like it\u2019s over our own family\u2019s head.'
  },
  fencing: {
    verb: 'fencing', heroLabel: 'Professional Fencing',
    services: ['Wood Fencing', 'Vinyl Fencing', 'Chain Link', 'Iron & Aluminum', 'Fence Repair', 'Gate Installation'],
    svcDesc: [
      'Cedar, pine, or pressure-treated \u2014 classic privacy fencing built to last.',
      'Zero-maintenance vinyl that stays clean and strong for decades.',
      'Affordable, durable, and fast to install. Perfect for yards and properties.',
      'Ornamental fencing that adds elegance and security to any property.',
      'Leaning posts, broken boards, storm damage \u2014 repaired fast and affordable.',
      'Swing gates, sliding gates, automatic openers \u2014 function meets style.'
    ],
    tagline: 'Built Strong. Built to Last.', sub: 'Premium fencing installation that adds security and value to your property.',
    cta: ['YOUR PROPERTY DESERVES', 'A GREAT FENCE', 'Get your free fence estimate today. We\u2019ll measure, design, and give you an honest quote.'],
    pillars: [
      ['FREE ESTIMATES', 'We measure your property and quote the job \u2014 no cost, no pressure.'],
      ['PREMIUM MATERIALS', 'Top-grade lumber, vinyl, and metal \u2014 no builder-grade shortcuts.'],
      ['CUSTOM DESIGNS', 'Height, style, spacing, gates \u2014 built exactly how you want it.'],
      ['LICENSED & INSURED', 'Permits pulled, property lines verified, work guaranteed.']
    ],
    reviews: [
      ['6-foot cedar privacy fence around our entire backyard. Straight, solid, and beautiful.', 'DANIEL W.'],
      ['Replaced our old chain link with vinyl. Looks amazing and zero maintenance.', 'PATRICIA H.'],
      ['The gate they installed is the best part. Smooth close, perfect fit.', 'JASON R.']
    ],
    trust: [['&#10003;', 'Free Estimates', 'No obligation'], ['&#9881;', 'Licensed & Insured', 'Full coverage'], ['&#9733;', 'Premium Materials', 'Built to last']],
    aboutP2: 'We don\u2019t use builder-grade materials or cut corners on posts. Every fence we build is one we\u2019d want in our own backyard.'
  },
  'personal training': {
    verb: 'training', heroLabel: 'Personal Training',
    services: ['1-on-1 Training', 'Group Sessions', 'Nutrition Plans', 'Weight Loss Programs', 'Strength Training', 'Online Coaching'],
    svcDesc: [
      'Personalized workouts designed for your goals, fitness level, and schedule.',
      'Small group energy with personal attention. Max 6 people per session.',
      'Custom meal plans that work with your lifestyle \u2014 not against it.',
      'Sustainable weight loss through training, nutrition, and accountability.',
      'Progressive overload programs that build real strength safely.',
      'Full training programs and check-ins delivered to your phone.'
    ],
    tagline: 'Your Goals. Your Pace. Real Results.', sub: 'Personal training that meets you where you are and takes you where you want to go.',
    cta: ['YOUR GOALS DESERVE', 'REAL RESULTS', 'Book your free consultation. Let\u2019s build a plan that actually works for your life.'],
    pillars: [
      ['CERTIFIED TRAINER', 'Nationally certified with real-world experience and results.'],
      ['CUSTOM PROGRAMS', 'No cookie-cutter workouts. Every plan built for your body and goals.'],
      ['FLEXIBLE SCHEDULING', 'Early morning, lunch hour, evening \u2014 we work around your life.'],
      ['NUTRITION GUIDANCE', 'Training is half the equation. We help you fuel it right.']
    ],
    reviews: [
      ['Down 30 pounds in 4 months. The meal plan was the game changer.', 'JESSICA L.'],
      ['First trainer who actually listened to my goals instead of pushing a generic plan.', 'MARCUS B.'],
      ['The group sessions are incredible. Best workout of my week, every week.', 'TANYA K.']
    ],
    trust: [['&#10003;', 'Free Consultation', 'No commitment'], ['&#9881;', 'Certified Trainer', 'Nationally accredited'], ['&#9733;', 'Real Results', 'Client transformations']],
    aboutP2: 'No gimmicks, no fads. Just smart programming, consistent effort, and someone in your corner who actually gives a damn about your results.'
  },
  barber: {
    verb: 'barber', heroLabel: 'Premium Barbershop',
    services: ['Classic Cuts', 'Beard Trim & Shape', 'Hot Towel Shave', 'Kids Cuts', 'Hair Design', 'Walk-Ins Welcome'],
    svcDesc: [
      'Precision fades, tapers, and classic cuts \u2014 sharp lines, clean finish.',
      'Lined up, shaped, and conditioned. Your beard looking its absolute best.',
      'Straight razor, hot lather, warm towel \u2014 the old-school experience done right.',
      'Patient, friendly barbers who make sure your kid leaves looking great.',
      'Custom designs, patterns, and artwork cut with surgical precision.',
      'No appointment needed. Walk in, grab a seat, we\u2019ll get you right.'
    ],
    tagline: 'Sharp Cuts. Clean Lines.', sub: 'Premium barbershop experience \u2014 walk in looking good, leave looking great.',
    cta: ['YOU DESERVE', 'A SHARP CUT', 'Walk in or book your appointment. We\u2019ll have you looking right in no time.'],
    pillars: [
      ['WALK-INS WELCOME', 'No appointment needed. Grab a seat, we\u2019ll get you in.'],
      ['HOT TOWEL SERVICE', 'Every cut finishes with a hot towel and clean lineup.'],
      ['EXPERIENCED BARBERS', 'Years behind the chair. Every style, every texture.'],
      ['CLEAN SHOP', 'Sterilized tools, fresh capes, clean stations \u2014 every client.']
    ],
    reviews: [
      ['Best fade I\u2019ve ever gotten. Period. And I\u2019ve been to a lot of barbers.', 'DARIUS J.'],
      ['My son used to hate haircuts. Now he asks to go. That says it all.', 'ANGELA M.'],
      ['The hot towel shave is worth every penny. I feel like a new man every time.', 'OMAR S.']
    ],
    trust: [['&#10003;', 'Walk-Ins Welcome', 'No appointment needed'], ['&#9881;', 'Sterilized Tools', 'Every client'], ['&#9733;', 'All Ages', 'Kids to gentlemen']],
    aboutP2: 'This is a real barbershop \u2014 not a chain salon. You get a barber who knows your name, your cut, and how you like your line.'
  },
  photography: {
    verb: 'photography', heroLabel: 'Professional Photography',
    services: ['Portrait Sessions', 'Wedding Photography', 'Event Coverage', 'Product Photography', 'Headshots', 'Photo Editing'],
    svcDesc: [
      'Natural, relaxed portraits that capture who you really are \u2014 not a forced smile.',
      'Every moment from getting ready to the last dance \u2014 beautifully documented.',
      'Corporate events, parties, milestones \u2014 professional coverage start to finish.',
      'Clean, high-resolution product shots that sell. E-commerce ready.',
      'Professional headshots for LinkedIn, your website, or your team page.',
      'Color correction, retouching, and creative edits that make your photos shine.'
    ],
    tagline: 'Moments Worth Remembering', sub: 'Professional photography that captures the moments that matter most.',
    cta: ['YOUR MOMENTS DESERVE', 'GREAT PHOTOS', 'Book your session today. Let\u2019s capture something worth keeping.'],
    pillars: [
      ['EDITED & DELIVERED FAST', 'High-res gallery delivered within 2 weeks. Rush available.'],
      ['FULL RIGHTS INCLUDED', 'Your photos, your rights. Print, post, share \u2014 no restrictions.'],
      ['NATURAL POSING', 'We guide you into natural poses that look and feel real.'],
      ['PROFESSIONAL EQUIPMENT', 'Pro cameras, lighting, and backup gear for every shoot.']
    ],
    reviews: [
      ['Our engagement photos were so natural. Not a single awkward pose in the bunch.', 'SARAH & TIM'],
      ['The headshots he took are the best professional photos I\u2019ve ever had.', 'JONATHAN P.'],
      ['We got our wedding gallery in 10 days. Every single photo was stunning.', 'ALYSSA K.']
    ],
    trust: [['&#10003;', 'Free Consultation', 'No commitment'], ['&#9881;', 'Full Rights Included', 'Your photos, forever'], ['&#128337;', 'Fast Delivery', '2-week turnaround']],
    aboutP2: 'I don\u2019t just take photos \u2014 I capture the way things actually felt. The laugh, the look, the moment before the moment.'
  },
  'junk removal': {
    verb: 'junk removal', heroLabel: 'Professional Junk Removal',
    services: ['Full Cleanouts', 'Furniture Removal', 'Appliance Hauling', 'Yard Debris', 'Construction Waste', 'Same-Day Service'],
    svcDesc: [
      'Garage, basement, attic, whole house \u2014 cleared out and cleaned up in one visit.',
      'Couches, mattresses, desks, dressers \u2014 hauled out and disposed of responsibly.',
      'Fridges, washers, dryers, water heaters \u2014 disconnected and removed safely.',
      'Branches, stumps, dirt, old landscaping \u2014 loaded up and gone.',
      'Drywall, lumber, tile, demo waste \u2014 we handle post-project cleanup.',
      'Need it gone today? Call before noon and we\u2019ll be there this afternoon.'
    ],
    tagline: 'Gone. Just Like That.', sub: 'Fast, affordable junk removal \u2014 we show up, load up, and haul it away.',
    cta: ['YOUR SPACE DESERVES', 'A CLEAN SLATE', 'Call for a free estimate. Same-day service available \u2014 we\u2019ll have it gone today.'],
    pillars: [
      ['SAME-DAY SERVICE', 'Call before noon, we\u2019re there this afternoon. No waiting.'],
      ['UPFRONT PRICING', 'We quote on-site before we load a single item. No surprises.'],
      ['ECO-FRIENDLY DISPOSAL', 'We donate what we can and recycle the rest. Landfill is last resort.'],
      ['HEAVY ITEMS NO PROBLEM', 'Hot tubs, pianos, safes \u2014 we\u2019ve hauled it all.']
    ],
    reviews: [
      ['Called at 9am, they were here by 1pm. Entire garage cleared out in an hour.', 'FRANK D.'],
      ['They hauled away an old hot tub, a broken treadmill, and a pile of lumber. Done in 45 minutes.', 'KELLY S.'],
      ['Best part? They swept the garage floor after. Didn\u2019t expect that level of service.', 'WAYNE T.']
    ],
    trust: [['&#10003;', 'Free On-Site Quotes', 'No obligation'], ['&#128337;', 'Same-Day Service', 'Call before noon'], ['&#9733;', 'Eco-Friendly', 'Donate & recycle first']],
    aboutP2: 'We don\u2019t just dump everything in a landfill. Usable items get donated, metals get recycled, and your space gets cleared \u2014 the right way.'
  },
  'mobile mechanic': {
    verb: 'mechanic', heroLabel: 'Mobile Mechanic',
    services: ['Oil Changes', 'Brake Service', 'Diagnostics', 'Battery Replacement', 'Tune-Ups', 'Emergency Repairs'],
    svcDesc: [
      'Full synthetic, conventional, or blend \u2014 done in your driveway in 30 minutes.',
      'Pads, rotors, calipers, fluid flush \u2014 your brakes done right, at your location.',
      'Check engine light? We bring the scanner to you and tell you exactly what\u2019s wrong.',
      'Dead battery? We come to you with a new one, installed and tested on the spot.',
      'Spark plugs, filters, fluids \u2014 keep your engine running smooth and efficient.',
      'Broke down? We\u2019ll come to you and get you back on the road fast.'
    ],
    tagline: 'We Come to You', sub: 'Mobile mechanic services \u2014 professional auto repair at your location.',
    cta: ['YOUR CAR DESERVES', 'A REAL MECHANIC', 'Call or text for a quote. We\u2019ll come to your home, office, or wherever your car is.'],
    pillars: [
      ['AT YOUR LOCATION', 'Home, office, parking lot \u2014 we come to wherever your car is.'],
      ['TRANSPARENT PRICING', 'You see the parts, you see the work. No mystery shop fees.'],
      ['ASE KNOWLEDGEABLE', 'Professional mechanics with real shop experience.'],
      ['SAME-DAY AVAILABLE', 'Most repairs scheduled and completed the same day you call.']
    ],
    reviews: [
      ['Oil change in my driveway in 25 minutes. Why would I ever go to a shop again?', 'TYLER M.'],
      ['My car wouldn\u2019t start at work. He came out, replaced the battery, and I was home for dinner.', 'PRIYA N.'],
      ['Honest diagnosis. Told me what I actually needed vs what a dealership would\u2019ve charged.', 'SCOTT L.']
    ],
    trust: [['&#10003;', 'Free Estimates', 'No obligation'], ['&#128666;', 'Mobile Service', 'We come to you'], ['&#128337;', 'Same-Day Available', 'Fast turnaround']],
    aboutP2: 'No waiting rooms, no shuttle rides, no $150 diagnostic fees. We come to your car with the tools and parts to fix it right there.'
  },
  'auto repair': {
    verb: 'repair', heroLabel: 'Auto Repair Shop',
    services: ['Engine Repair', 'Brake Service', 'Transmission', 'Diagnostics', 'Oil & Fluids', 'AC & Electrical'],
    svcDesc: [
      'From minor fixes to full rebuilds \u2014 we diagnose it right and fix it once.',
      'Pads, rotors, calipers, lines \u2014 your brakes done right with quality parts.',
      'Slipping, grinding, or hard shifts? We rebuild and repair transmissions in-house.',
      'Check engine light? Our scan tools pinpoint the problem \u2014 no guessing, no parts-swapping.',
      'Oil changes, coolant flushes, power steering, brake fluid \u2014 keep your car running right.',
      'AC not blowing cold? Electrical gremlins? We trace it, find it, and fix it.'
    ],
    tagline: 'Honest Work. Fair Prices.', sub: 'Your neighborhood auto repair shop \u2014 real mechanics, real repairs, no runaround.',
    cta: ['YOUR CAR DESERVES', 'A REAL SHOP', 'Call or stop by for a free estimate. No appointment needed for most services.'],
    pillars: [
      ['HONEST DIAGNOSIS', 'We show you the problem before we fix it. No surprise charges.'],
      ['QUALITY PARTS', 'OEM and name-brand parts \u2014 not the cheapest, the best value.'],
      ['EXPERIENCED TECHS', 'Real mechanics with years of hands-on shop experience.'],
      ['FAIR PRICING', 'Dealership quality without the dealership markup.']
    ],
    reviews: [
      ['Took my truck here after the dealership quoted me $2,800. These guys fixed it for $900. Same job.', 'MIKE D.'],
      ['Honest shop. Told me my brakes still had life left instead of trying to sell me new ones.', 'SARAH K.'],
      ['Been bringing all three of our family cars here for years. Wouldn\u2019t trust anyone else.', 'JAMES R.']
    ],
    trust: [['&#10003;', 'Free Estimates', 'No obligation'], ['&#9881;', 'All Makes & Models', 'Foreign & domestic'], ['&#128337;', 'Same-Day Service', 'Most repairs']],
    aboutP2: 'No corporate upsells, no unnecessary repairs. Just honest mechanics who fix cars the right way at a fair price. We treat every customer like a neighbor \u2014 because you are.'
  },
};

const DEFAULT_COPY = {
  verb: 'service', heroLabel: 'Professional Services',
  services: ['Service One', 'Service Two', 'Service Three', 'Service Four', 'Service Five', 'Service Six'],
  svcDesc: ['Professional service tailored to your needs.', 'Quality work you can count on every time.', 'Expert service with attention to detail.', 'Reliable results delivered on your schedule.', 'Trusted by homeowners and businesses alike.', 'Contact us for a free consultation.'],
  tagline: 'Quality You Can Count On', sub: 'Professional services delivered with care and expertise.',
  cta: ['YOU DESERVE', 'THE BEST', 'Get your free estimate today. We\u2019d love to hear from you.'],
  pillars: [
    ['FREE ESTIMATES', 'No obligation, no pressure. Just an honest quote.'],
    ['LICENSED & INSURED', 'Full coverage for your peace of mind.'],
    ['LOCALLY OWNED', 'A neighbor you can trust, not a corporate call center.'],
    ['SATISFACTION GUARANTEED', 'Not happy? We\u2019ll make it right.']
  ],
  reviews: [
    ['Excellent work and great communication throughout the entire project.', 'CUSTOMER A.'],
    ['Professional, on time, and the quality exceeded our expectations.', 'CUSTOMER B.'],
    ['Would highly recommend. Fair price and outstanding results.', 'CUSTOMER C.']
  ],
  trust: [['&#10003;', 'Free Estimates', 'No obligation'], ['&#9881;', 'Licensed & Insured', 'Full coverage'], ['&#9733;', 'Locally Owned', 'We live here too']],
  aboutP2: 'Every project starts with understanding what you need. No shortcuts, no excuses \u2014 just quality work delivered on time.'
};

// ── SLUG ──────────────────────────────────────────────────────────────────────
function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// ── HEX HELPERS ───────────────────────────────────────────────────────────────
function hexToRGBA(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ── REGEX ESCAPE ──────────────────────────────────────────────────────────────
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ── HTML ESCAPE ───────────────────────────────────────────────────────────────
function escHTML(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── V4 TEMPLATE ENGINE ────────────────────────────────────────────────────────
// Reads the pre-built V4 template for the industry, swaps in lead's real info.
// Layout stays locked — only business name, phone, city, and photos change.
function buildFromV4Template(lead, photos, compIntel) {
  const industry  = (lead.industry || '').toLowerCase();
  const tmpl      = V4_TEMPLATES[industry];
  if (!tmpl) return null;

  const templatePath = path.join(DEMOS_DIR, tmpl.file);
  if (!fs.existsSync(templatePath)) {
    console.log(`   ⚠️  V4 template not found: ${tmpl.file} — falling back to v3`);
    return null;
  }

  let html = fs.readFileSync(templatePath, 'utf8');
  console.log(`   📐  V4 template loaded: ${tmpl.file} (${(Buffer.byteLength(html)/1024).toFixed(1)} KB)`);

  const biz       = lead.business || lead.business_name || 'Business';
  const city      = lead.city || '';
  const state     = lead.state || 'MO';
  const phone     = lead.phone || '';
  const location  = city ? `${city}, ${state}` : state;
  const phoneClean = phone.replace(/\D/g, '');

  // 1. BUSINESS NAME — replace placeholder everywhere (case-sensitive)
  const placeholder = tmpl.placeholder;
  // Replace full name first (longest match first to avoid partial replacements)
  html = html.split(placeholder).join(biz);
  // Also replace HTML-encoded version (& → &amp;)
  const placeholderEncoded = placeholder.replace(/&/g, '&amp;');
  if (placeholderEncoded !== placeholder) {
    const bizEncoded = biz.replace(/&/g, '&amp;');
    html = html.split(placeholderEncoded).join(bizEncoded);
  }
  // Also replace UPPERCASE version used in logos
  const placeholderUpper = placeholder.toUpperCase();
  const bizUpper = biz.toUpperCase();
  html = html.split(placeholderUpper).join(bizUpper);
  const placeholderUpperEnc = placeholderUpper.replace(/&/g, '&amp;');
  if (placeholderUpperEnc !== placeholderUpper) {
    html = html.split(placeholderUpperEnc).join(bizUpper.replace(/&/g, '&amp;'));
  }
  console.log(`   ✏️  Business name: "${placeholder}" → "${biz}"`);

  // Also replace possessive forms
  html = html.split(placeholder + "'s").join(biz + "'s");
  html = html.split(placeholder + "\u2019s").join(biz + "\u2019s");

  // Replace short form of placeholder using explicit shortName mapping
  // e.g. "BrushCraft" → "Gaab", "Iron & Blade" → "Sharp Cutz", "Iron & Ink" → "Tattoos by Glendon"
  if (tmpl.shortName && tmpl.shortName !== placeholder) {
    const shortName = tmpl.shortName;
    // Build a smart short replacement from the lead's business name
    // Strip trailing punctuation, legal suffixes (LLC, Inc, Co.), then match word count
    const bizClean = biz.replace(/,?\s*(LLC|Inc\.?|Co\.?|Corp\.?)$/i, '').trim();
    const bizWords = bizClean.split(' ');
    const shortWords = shortName.split(/[\s&]+/).filter(w => w).length;
    const bizShort = bizWords.length >= shortWords
      ? bizWords.slice(0, shortWords).join(' ')
      : bizClean;
    // Replace all forms: plain, HTML-encoded, UPPERCASE, UPPERCASE HTML-encoded
    html = html.split(shortName).join(bizShort);
    const shortEncoded = shortName.replace(/&/g, '&amp;');
    if (shortEncoded !== shortName) {
      html = html.split(shortEncoded).join(bizShort.replace(/&/g, '&amp;'));
    }
    const shortUpper = shortName.toUpperCase();
    const bizShortUpper = bizShort.toUpperCase();
    html = html.split(shortUpper).join(bizShortUpper);
    const shortUpperEnc = shortUpper.replace(/&/g, '&amp;');
    if (shortUpperEnc !== shortUpper) {
      html = html.split(shortUpperEnc).join(bizShortUpper.replace(/&/g, '&amp;'));
    }
    console.log(`   ✏️  Short name: "${shortName}" → "${bizShort}"`);
  }

  // Replace single brand word (e.g. "Drip" from "DRIP Detail KC", "Fuego" from "Fuego KC")
  // This catches creative uses like "The Full Drip", "Ready to drip?", "@DRIPDETAILKC"
  // Word-boundary regex with negative lookahead so we don't break asset paths
  // (e.g. "mirror-finish-kc" stays intact even when brandWord="Mirror").
  if (tmpl.brandWord) {
    const bw = tmpl.brandWord;
    const bizClean = biz.replace(/,?\s*(LLC|Inc\.?|Co\.?|Corp\.?)$/i, '').trim();
    const bizFirst = bizClean.split(' ')[0];
    const bwEsc = escapeRegex(bw);
    // Match brandWord only when NOT followed by - or alphanumeric (excludes "mirror-finish-kc", "mirrored")
    html = html.replace(new RegExp(`\\b${bwEsc}(?![-A-Za-z0-9])`, 'g'), bizFirst);
    html = html.replace(new RegExp(`\\b${bwEsc.toUpperCase()}(?![-A-Z0-9])`, 'g'), bizFirst.toUpperCase());
    html = html.replace(new RegExp(`\\b${bwEsc.toLowerCase()}(?![-a-z0-9])`, 'g'), bizFirst.toLowerCase());
    console.log(`   ✏️  Brand word: "${bw}" → "${bizFirst}"`);
  }

  // Handle HTML-tagged logos like "DRIP <em>DETAIL</em> KC" or "LENS <em>&</em> LIGHT"
  // Only match the logo div's inner content up to its first closing </div> (non-greedy)
  html = html.replace(/<div class="[^"]*logo[^"]*">((?:(?!<\/div>).)*)<\/div>/gi, (match, inner) => {
    const bizClean = biz.replace(/,?\s*(LLC|Inc\.?|Co\.?|Corp\.?)$/i, '').trim();
    const bizUpper = bizClean.toUpperCase();
    return match.replace(inner, bizUpper);
  });

  // Replace social handles like @DRIPDETAILKC → @BIZNAME
  const bizSlugUpper = biz.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const placeholderSlug = tmpl.placeholder.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  if (placeholderSlug) {
    html = html.split('@' + placeholderSlug).join('@' + bizSlugUpper);
  }

  // 2. PHONE — replace placeholder phone with real phone (or hide if none)
  const tmplPhone = tmpl.phone;
  const tmplPhoneClean = tmplPhone.replace(/\D/g, '');
  if (phone) {
    html = html.split(tmplPhone).join(phone);
    html = html.split(tmplPhoneClean).join(phoneClean);
    console.log(`   📞  Phone: "${tmplPhone}" → "${phone}"`);
  } else {
    // No phone — replace with generic CTA text
    html = html.split(tmplPhone).join('Contact Us');
    html = html.split('tel:' + tmplPhoneClean).join('#contact');
    console.log(`   📞  No phone — replaced with "Contact Us"`);
  }

  // 3. CITY — replace "Kansas City" with lead's real city
  if (city && city !== 'Kansas City') {
    html = html.split('Kansas City').join(city);
    console.log(`   📍  City: "Kansas City" → "${city}"`);
  }

  // 4. TITLE TAG — update for SEO
  const titleMatch = html.match(/<title>[^<]+<\/title>/);
  if (titleMatch) {
    const newTitle = `<title>${escHTML(biz)} | ${escHTML(location)} — ${industry.charAt(0).toUpperCase() + industry.slice(1)}</title>`;
    html = html.replace(titleMatch[0], newTitle);
  }

  // 5. PEXELS PHOTOS — swap template photos with fresh ones for this lead
  if (photos && photos.length > 0) {
    const pexelsRegex = /https:\/\/images\.pexels\.com\/photos\/[^"'\s)]+/g;
    const templatePhotos = html.match(pexelsRegex) || [];
    // Get unique template photo URLs (preserve order)
    const uniqueTemplatePhotos = [...new Set(templatePhotos)];

    let swapped = 0;
    for (let i = 0; i < uniqueTemplatePhotos.length && i < photos.length; i++) {
      const oldUrl = uniqueTemplatePhotos[i];
      const newUrl = photos[i].url || photos[i];
      if (newUrl && newUrl !== oldUrl) {
        html = html.split(oldUrl).join(newUrl);
        swapped++;
      }
    }
    console.log(`   🖼️  Photos: swapped ${swapped}/${uniqueTemplatePhotos.length} Pexels images`);
  }

  // 6. FAKE EMAILS — replace template emails with lead's email or contact form link
  const leadEmail = (lead.email || '').trim();
  const fakeEmailRegex = /(?:hello|info|contact|book|hey)@[a-z]+(?:kc)?\.com/g;
  if (leadEmail && leadEmail !== '[no email]') {
    html = html.replace(fakeEmailRegex, leadEmail);
    console.log(`   📧  Email: template placeholder → "${leadEmail}"`);
  } else {
    html = html.replace(fakeEmailRegex, 'herrmanonlineoutlook@gmail.com');
    console.log(`   📧  No lead email — using HOO contact email`);
  }

  // 7. LOGO with HTML tags — handle cases like "LENS <em>&</em> LIGHT"
  // These break simple string replacement, so use regex to catch tagged versions
  if (tmpl.shortName) {
    const shortParts = tmpl.shortName.split(/\s*&\s*/);
    if (shortParts.length === 2) {
      const p1 = shortParts[0].toUpperCase();
      const p2 = shortParts[1].toUpperCase();
      const bizShortClean = biz.replace(/,?\s*(LLC|Inc\.?|Co\.?|Corp\.?)$/i, '').trim();
      const bizParts = bizShortClean.split(' ');
      // Replace "WORD1 <anything>& tags</anything> WORD2" patterns
      const logoRegex = new RegExp(escapeRegex(p1) + '\\s*(?:<[^>]+>)*\\s*&(?:amp;)?\\s*(?:<\\/[^>]+>)*\\s*' + escapeRegex(p2), 'g');
      const bizUpper = bizShortClean.toUpperCase();
      html = html.replace(logoRegex, bizUpper);
    }
  }

  // 8. COPYRIGHT YEAR
  html = html.replace(/© 20\d{2}/g, `© ${new Date().getFullYear()}`);

  // 9. AEO SCHEMA INJECTION
  html = injectAEOSchema(html, lead);

  console.log(`   ✅  V4 template build complete`);
  return html;
}

// ── AEO SCHEMA INJECTION ─────────────────────────────────────────────────────
// Injects JSON-LD structured data for AI search engines (Google AI Overviews,
// ChatGPT, Perplexity). Adds LocalBusiness + FAQPage + HowTo schemas.
function injectAEOSchema(html, lead) {
  const biz = lead.business || lead.business_name || 'Business';
  const phone = lead.phone || '';
  const email = lead.email || '';
  const city = lead.city || 'Kansas City';
  const state = lead.state || 'MO';
  const industry = (lead.industry || '').toLowerCase();

  const schemas = [];

  // 1. LocalBusiness schema (always)
  const localBiz = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: biz,
    telephone: phone,
    email: email || undefined,
    address: {
      '@type': 'PostalAddress',
      addressLocality: city,
      addressRegion: state,
      addressCountry: 'US'
    },
    areaServed: { '@type': 'City', name: `${city}, ${state}` },
    priceRange: '$$',
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '5.0',
      reviewCount: '50'
    }
  };
  // Remove undefined fields
  Object.keys(localBiz).forEach(k => localBiz[k] === undefined && delete localBiz[k]);
  schemas.push(localBiz);

  // 2. FAQPage schema (parse from HTML)
  const faqRegex = /<div class="faq-q">(.*?)<\/div>.*?<div class="faq-a"><p>(.*?)<\/p>/gs;
  const faqs = [];
  let faqMatch;
  while ((faqMatch = faqRegex.exec(html)) !== null) {
    const q = faqMatch[1].replace(/<[^>]+>/g, '').trim();
    const a = faqMatch[2].replace(/<[^>]+>/g, '').trim();
    if (q && a) faqs.push({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } });
  }
  if (faqs.length > 0) {
    schemas.push({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs });
  }

  // 3. HowTo schema (parse process steps)
  const stepRegex = /<div class="process-step[^"]*"[^>]*>.*?<h4>(.*?)<\/h4>\s*<p>(.*?)<\/p>/gs;
  const steps = [];
  let stepMatch, stepNum = 1;
  while ((stepMatch = stepRegex.exec(html)) !== null) {
    const name = stepMatch[1].replace(/<[^>]+>/g, '').trim();
    const text = stepMatch[2].replace(/<[^>]+>/g, '').trim();
    if (name && text) steps.push({ '@type': 'HowToStep', position: stepNum++, name, text });
  }
  if (steps.length > 0) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: `How ${biz} Works`,
      step: steps
    });
  }

  // 4. Meta robots tag for AI crawlers
  if (!html.includes('max-snippet')) {
    html = html.replace('</head>', '<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large">\n</head>');
  }

  // Inject all schemas before </head>
  if (schemas.length > 0) {
    const scriptTags = schemas.map(s =>
      `<script type="application/ld+json">\n${JSON.stringify(s, null, 2)}\n</script>`
    ).join('\n');
    html = html.replace('</head>', `${scriptTags}\n</head>`);
    console.log(`   🔍  AEO: injected ${schemas.length} JSON-LD schemas (LocalBusiness${faqs.length ? ' + FAQPage' : ''}${steps.length ? ' + HowTo' : ''})`);
  }

  return html;
}

// ── COMPETITOR INTEL SCRAPING ─────────────────────────────────────────────────
async function scrapeCompetitorIntel(industry, city, leadId) {
  let puppeteer;
  try {
    puppeteer = require('puppeteer');
  } catch {
    console.log('   \u26a0\ufe0f  Puppeteer not installed \u2014 skipping competitor intel');
    return null;
  }

  const query = encodeURIComponent(`${industry} ${city} website`);
  const searchUrl = `https://www.google.com/search?q=${query}`;
  const intel = { query: `${industry} ${city}`, competitors: [], ogImages: [], scraped_date: new Date().toISOString() };

  let browser;
  try {
    console.log(`   \ud83d\udd0d  Scraping competitors: "${industry} ${city}"...`);
    browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForSelector('body', { visible: true });

    const urls = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href]'));
      const results = [];
      for (const link of links) {
        const href = link.href;
        if (href && href.startsWith('http') && !href.includes('google.') && !href.includes('youtube.') && !href.includes('yelp.') && !href.includes('facebook.') && !href.includes('instagram.') && !href.includes('wikipedia.')) {
          try {
            const u = new URL(href);
            const domain = u.hostname;
            if (!results.find(r => r.includes(domain))) {
              results.push(href);
            }
          } catch {}
        }
        if (results.length >= 3) break;
      }
      return results;
    });

    console.log(`   \ud83d\udccb  Found ${urls.length} competitor URLs`);

    for (const url of urls.slice(0, 3)) {
      try {
        const compPage = await browser.newPage();
        await compPage.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
        await compPage.waitForSelector('body', { visible: true });

        const data = await compPage.evaluate(() => {
          const title = document.querySelector('title')?.textContent || '';
          const metaDesc = document.querySelector('meta[name="description"]')?.content || document.querySelector('meta[property="og:description"]')?.content || '';
          const ogImage = document.querySelector('meta[property="og:image"]')?.content || '';
          const hexColors = [];
          const styleText = Array.from(document.querySelectorAll('style')).map(s => s.textContent).join(' ');
          const inlineStyles = Array.from(document.querySelectorAll('[style]')).map(el => el.getAttribute('style')).join(' ');
          const allCSS = styleText + ' ' + inlineStyles;
          const hexMatches = allCSS.match(/#[0-9a-fA-F]{6}/g) || [];
          const colorCounts = {};
          for (const hex of hexMatches) {
            const h = hex.toLowerCase();
            if (h === '#000000' || h === '#ffffff' || h === '#f5f5f5' || h === '#333333') continue;
            colorCounts[h] = (colorCounts[h] || 0) + 1;
          }
          const topColors = Object.entries(colorCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([c]) => c);
          return { title: title.trim(), metaDesc: metaDesc.trim(), ogImage, topColors };
        });

        intel.competitors.push({
          url, title: data.title, meta_description: data.metaDesc,
          og_image: data.ogImage, top_colors: data.topColors,
        });
        if (data.ogImage) intel.ogImages.push(data.ogImage);
        console.log(`   \u2705  ${new URL(url).hostname}: ${data.topColors.length} colors, ${data.ogImage ? 'has og:image' : 'no og:image'}`);
        await compPage.close();
      } catch (err) {
        console.log(`   \u26a0\ufe0f  Failed to scrape ${url}: ${err.message}`);
      }
    }

    await browser.close();
  } catch (err) {
    console.log(`   \u26a0\ufe0f  Competitor scraping failed: ${err.message}`);
    if (browser) try { await browser.close(); } catch {}
  }

  if (intel.competitors.length > 0) {
    if (!fs.existsSync(INTEL_DIR)) fs.mkdirSync(INTEL_DIR, { recursive: true });
    const intelPath = path.join(INTEL_DIR, `${leadId}-color-intel.json`);
    fs.writeFileSync(intelPath, JSON.stringify(intel, null, 2), 'utf8');
    console.log(`   \ud83d\udcbe  Intel saved: outputs/prototypes/${leadId}-color-intel.json`);
  }

  return intel;
}

// ── BUILD HTML (v3 PREMIUM TEMPLATE) ─────────────────────────────────────────
function buildHTML(lead, photos, theme, compIntel) {
  const biz       = lead.business || lead.business_name || 'Business';
  const owner     = lead.owner_name || '';
  const city      = lead.city || '';
  const state     = lead.state || 'MO';
  const phone     = lead.phone || '';
  const industry  = (lead.industry || '').toLowerCase();
  const copy      = INDUSTRY_COPY[industry] || DEFAULT_COPY;
  const phoneClean = phone.replace(/\D/g, '');
  const location   = city ? `${city}, ${state}` : state;

  const t = theme;

  // Merge competitor og:images into photo pool
  let allPhotos = [...photos];
  if (compIntel && compIntel.ogImages && compIntel.ogImages.length > 0) {
    for (const ogUrl of compIntel.ogImages) {
      allPhotos.push({ url: ogUrl, alt: `${industry} reference` });
    }
  }

  // Assign photos to slots (10 photos: hero, about, 6 services, cta, spare)
  const hero  = allPhotos[0]?.url || '';
  const about = allPhotos[1]?.url || '';
  const svcPhotos = [];
  for (let i = 0; i < 6; i++) {
    svcPhotos.push(allPhotos[2 + i]?.url || allPhotos[i % Math.max(allPhotos.length, 1)]?.url || '');
  }
  const ctaBg = allPhotos[8]?.url || allPhotos[0]?.url || '';

  const heroAlt  = allPhotos[0]?.alt || `${biz} hero`;
  const aboutAlt = allPhotos[1]?.alt || `About ${biz}`;

  // Computed colors
  const glowColor   = hexToRGBA(t.primary, '.15');
  const borderFaint = 'rgba(0,0,0,.06)';

  // Split biz name for logo: "Gaab Painting" → "Gaab" + "Painting"
  const bizWords = biz.split(' ');
  const logoFirst = bizWords.slice(0, -1).join(' ') || biz;
  const logoLast  = bizWords.length > 1 ? bizWords.slice(-1)[0] : '';

  // Split tagline for hero h1 lines
  const tagParts = copy.tagline.split(/[.,!]/);
  const heroLine1 = tagParts[0].trim();
  const heroLine2 = (tagParts[1] || '').trim() || location;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escHTML(biz)} | ${escHTML(copy.tagline)} \u2014 ${escHTML(location)}</title>
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Syne:wght@400;600;700&family=Cormorant+Garamond:ital,wght@0,400;1,400&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
:root{
  --bg:${t.bg};--bg2:${t.bg2};--bg3:${t.bg3};
  --primary:${t.primary};--primary-hover:${t.primaryHover};--primary-glow:${glowColor};
  --accent:${t.accent};
  --text:${t.text};--text-dim:${t.textDim};
  --btn-text:#FFFFFF;
  --font-h:'Bebas Neue',sans-serif;--font-b:'Syne',sans-serif;--font-accent:'Cormorant Garamond',serif;
  --ease:cubic-bezier(.25,.46,.45,.94);--max:1200px;--radius:50px;--radius-sm:10px;
  --topbar-h:38px;
}
html{scroll-behavior:smooth}
body{background:var(--bg);color:var(--text);font-family:var(--font-b);line-height:1.65;overflow-x:hidden}
a{color:var(--primary);text-decoration:none;transition:color .3s var(--ease)}
a:hover{color:var(--primary-hover)}
img{max-width:100%;display:block}

/* === PROGRESS BAR === */
.ap-progress{position:fixed;top:0;left:0;height:3px;background:var(--primary);width:0;z-index:1002;will-change:width}

/* === TOP UTILITY BAR === */
.ap-topbar{position:fixed;top:0;left:0;width:100%;height:var(--topbar-h);background:var(--primary);z-index:1000;transition:transform .35s var(--ease)}
.ap-topbar.hidden{transform:translateY(-100%)}
.ap-topbar-inner{max-width:var(--max);margin:0 auto;height:100%;display:flex;align-items:center;justify-content:space-between;padding:0 24px}
.ap-topbar a{color:#fff;font-family:var(--font-h);font-size:.82rem;letter-spacing:2px;display:flex;align-items:center;gap:6px}
.ap-topbar-loc{font-size:.72rem;color:rgba(255,255,255,.85);text-transform:uppercase;letter-spacing:1.5px}
.ap-topbar-info{font-size:.72rem;color:rgba(255,255,255,.85);text-transform:uppercase;letter-spacing:1.5px}
.ap-topbar-info span{color:#fff}
.ap-topbar-sep{width:1px;height:14px;background:rgba(255,255,255,.3);margin:0 14px}

/* === NAV === */
.ap-nav{position:fixed;top:var(--topbar-h);left:0;width:100%;z-index:999;padding:14px 0;background:rgba(255,255,255,.6);backdrop-filter:blur(8px);transition:top .35s var(--ease),background .4s var(--ease),padding .4s var(--ease),box-shadow .4s var(--ease)}
.ap-nav.scrolled{top:0;background:rgba(255,255,255,.97);backdrop-filter:blur(12px);padding:10px 0;box-shadow:0 2px 20px rgba(0,0,0,.06)}
.ap-nav-inner{max-width:var(--max);margin:0 auto;display:flex;align-items:center;justify-content:space-between;padding:0 24px;position:relative}
.ap-logo{font-family:var(--font-h);font-size:clamp(1.2rem,3vw,1.6rem);letter-spacing:2px;color:var(--text);transition:font-size .35s var(--ease)}
.ap-nav.scrolled .ap-logo{font-size:clamp(1rem,2.5vw,1.3rem)}
.ap-logo span{color:var(--primary)}
.ap-nav-center{position:absolute;left:50%;transform:translateX(-50%);display:flex;gap:32px;align-items:center}
.ap-nav-center a{font-size:.78rem;color:var(--text-dim);text-transform:uppercase;letter-spacing:1.5px;transition:color .3s var(--ease)}
.ap-nav-center a:hover{color:var(--primary)}
.ap-nav-right{display:flex;align-items:center;gap:16px}
.ap-nav-cta{background:var(--primary);color:var(--btn-text);padding:11px 26px;font-family:var(--font-h);font-size:.85rem;letter-spacing:2px;border:none;cursor:pointer;transition:all .3s var(--ease);border-radius:var(--radius)}
.ap-nav-cta:hover{background:var(--primary-hover);transform:translateY(-2px);color:var(--btn-text)}
.ap-ham{display:none;flex-direction:column;gap:5px;cursor:pointer;z-index:1002}
.ap-ham span{width:26px;height:2px;background:var(--text);transition:all .3s var(--ease)}

/* === HERO — SPLIT LAYOUT === */
.ap-hero{min-height:100vh;display:grid;grid-template-columns:1fr 1fr;align-items:center;overflow:hidden;position:relative;background:var(--bg2)}
.ap-hero-text{padding:clamp(120px,14vw,180px) clamp(24px,5vw,60px) clamp(80px,10vw,120px) clamp(24px,5vw,80px);z-index:2}
.ap-hero-label{font-family:var(--font-accent);font-style:italic;color:var(--primary);font-size:clamp(1rem,2vw,1.15rem);margin-bottom:16px;opacity:0;animation:ap-up .8s var(--ease) .3s forwards;display:flex;align-items:center;gap:12px}
.ap-hero-label::before{content:'';width:2px;height:28px;background:var(--primary);display:block}
.ap-hero h1{font-family:var(--font-h);font-size:clamp(3.2rem,8vw,6.5rem);line-height:.92;letter-spacing:-0.02em;margin-bottom:28px}
.ap-hero h1 .ap-ln{display:block;overflow:hidden}
.ap-hero h1 .ap-ln-i{display:block;transform:translateY(110%);animation:ap-rev .8s var(--ease) forwards}
.ap-hero h1 .ap-ln:nth-child(1) .ap-ln-i{animation-delay:.5s}
.ap-hero h1 .ap-ln:nth-child(2) .ap-ln-i{animation-delay:.7s;color:var(--primary)}
.ap-hero-sub{font-size:clamp(.95rem,1.6vw,1.1rem);color:var(--text-dim);max-width:440px;line-height:1.75;margin-bottom:36px;opacity:0;animation:ap-up .8s var(--ease) 1.1s forwards}
.ap-hero-ctas{display:flex;gap:16px;flex-wrap:wrap;opacity:0;animation:ap-up .8s var(--ease) 1.3s forwards}
.ap-hero-ph{margin-top:28px;opacity:0;animation:ap-up .8s var(--ease) 1.5s forwards}
.ap-hero-ph a{font-family:var(--font-h);font-size:clamp(1rem,2vw,1.3rem);color:var(--primary);letter-spacing:3px}
.ap-hero-img{position:relative;height:100%;min-height:100vh;overflow:hidden}
.ap-hero-img img{width:100%;height:100%;object-fit:cover;clip-path:polygon(10% 0,100% 0,100% 100%,0 100%);animation:ap-hero-reveal 1.2s var(--ease) .2s both}
@keyframes ap-hero-reveal{from{clip-path:polygon(100% 0,100% 0,100% 100%,100% 100%)}to{clip-path:polygon(10% 0,100% 0,100% 100%,0 100%)}}

.ap-btn{background:var(--primary);color:var(--btn-text);padding:16px 40px;font-family:var(--font-h);font-size:1.1rem;letter-spacing:3px;border:none;cursor:pointer;transition:all .3s var(--ease);display:inline-flex;align-items:center;gap:8px;border-radius:var(--radius)}
.ap-btn:hover{background:var(--primary-hover);transform:translateY(-3px);box-shadow:0 14px 44px var(--primary-glow);color:var(--btn-text)}
.ap-btn-o{border:2px solid var(--primary);color:var(--primary);padding:14px 40px;font-family:var(--font-h);font-size:1.1rem;letter-spacing:3px;background:transparent;cursor:pointer;transition:all .3s var(--ease);display:inline-flex;align-items:center;gap:8px;border-radius:var(--radius)}
.ap-btn-o:hover{background:var(--primary);color:var(--btn-text);transform:translateY(-3px)}

@keyframes ap-rev{to{transform:translateY(0)}}
@keyframes ap-up{to{opacity:1;transform:translateY(0)}}

/* === SCROLL ANIMS === */
.ap-pop{opacity:0;transform:translateY(28px);transition:all .7s var(--ease)}
.ap-vis{opacity:1!important;transform:none!important}

/* === TRUST STRIP === */
.ap-trust{padding:22px 28px;background:#fff;border:1px solid ${borderFaint};border-radius:var(--radius-sm);max-width:860px;margin:-32px auto 0;position:relative;z-index:3;box-shadow:0 8px 32px rgba(0,0,0,.07)}
.ap-trust-inner{display:flex;justify-content:center;gap:clamp(20px,5vw,56px);flex-wrap:wrap}
.ap-trust-badge{display:flex;align-items:center;gap:10px}
.ap-trust-icon{width:36px;height:36px;border-radius:50%;border:2px solid var(--primary);display:flex;align-items:center;justify-content:center;font-size:1rem;color:var(--primary);flex-shrink:0}
.ap-trust-text{font-size:.75rem;text-transform:uppercase;letter-spacing:1.5px;color:var(--text-dim);line-height:1.4}
.ap-trust-text strong{color:var(--text);display:block;font-size:.82rem}

/* === SECTION COMMON === */
.ap-label{font-family:var(--font-accent);font-style:italic;color:var(--primary);font-size:1rem;margin-bottom:8px;letter-spacing:1px;display:flex;align-items:center;gap:12px}
.ap-label::before{content:'';width:2px;height:32px;background:var(--primary);display:block;flex-shrink:0}
.ap-title{font-family:var(--font-h);font-size:clamp(2rem,5vw,3.4rem);letter-spacing:1px;margin-bottom:28px}

/* === ABOUT === */
.ap-about{padding:clamp(80px,10vw,120px) 24px;max-width:var(--max);margin:0 auto}
.ap-about-grid{display:grid;grid-template-columns:1fr 1fr;gap:56px;align-items:center}
.ap-about-text p{color:var(--text-dim);margin-bottom:16px;font-size:clamp(.88rem,1.4vw,1rem);line-height:1.75}
.ap-about-text p strong{color:var(--text)}
.ap-about-sig{font-family:var(--font-accent);font-style:italic;color:var(--primary);font-size:1.3rem;margin-top:20px}
.ap-about-img{position:relative;border-radius:var(--radius-sm);overflow:hidden}
.ap-about-img img{width:100%;aspect-ratio:3/4;object-fit:cover;border-radius:var(--radius-sm)}

/* === WHY CHOOSE US — numbered === */
.ap-why{padding:clamp(80px,10vw,120px) 24px;background:var(--bg2)}
.ap-why-inner{max-width:var(--max);margin:0 auto}
.ap-why-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:36px;margin-top:40px}
.ap-why-item{position:relative;padding-top:48px}
.ap-why-num{position:absolute;top:0;left:0;font-family:var(--font-h);font-size:3.5rem;color:var(--primary);opacity:.15;line-height:1;letter-spacing:-0.02em}
.ap-why-item h3{font-family:var(--font-h);font-size:1.05rem;letter-spacing:2px;margin-bottom:10px}
.ap-why-item p{color:var(--text-dim);font-size:.82rem;line-height:1.7}

/* === SERVICES — asymmetric grid === */
.ap-svc{padding:clamp(80px,10vw,120px) 24px;background:var(--bg)}
.ap-svc-inner{max-width:var(--max);margin:0 auto}
.ap-svc-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:36px}
.ap-svc-card{position:relative;overflow:hidden;border-radius:var(--radius-sm);cursor:pointer;aspect-ratio:4/3}
.ap-svc-card img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:transform .6s var(--ease)}
.ap-svc-card:hover img{transform:scale(1.05)}
.ap-svc-card::after{content:'';position:absolute;inset:0;background:linear-gradient(0deg,rgba(0,0,0,.8) 0%,rgba(0,0,0,.15) 55%,transparent 100%);transition:background .4s var(--ease)}
.ap-svc-card:hover::after{background:linear-gradient(0deg,${hexToRGBA(t.primary, '.85')} 0%,rgba(0,0,0,.25) 55%,transparent 100%)}
.ap-svc-body{position:absolute;bottom:0;left:0;right:0;padding:24px 20px;z-index:1}
.ap-svc-card h3{font-family:var(--font-h);font-size:1.1rem;letter-spacing:2px;margin-bottom:4px;color:#fff}
.ap-svc-card p{color:rgba(255,255,255,.8);font-size:.76rem;line-height:1.6;margin-bottom:6px}
.ap-svc-more{font-family:var(--font-h);font-size:.76rem;letter-spacing:2px;color:rgba(255,255,255,.7);transition:color .3s var(--ease)}
.ap-svc-card:hover .ap-svc-more{color:#fff}
.ap-svc-card.featured{grid-row:span 2;aspect-ratio:auto}
.ap-svc-card.featured h3{font-size:1.4rem}
.ap-svc-card.featured p{font-size:.85rem}

/* === REVIEWS — staggered === */
.ap-reviews{padding:clamp(80px,10vw,120px) 24px;background:var(--bg2)}
.ap-reviews-inner{max-width:var(--max);margin:0 auto}
.ap-reviews-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;margin-top:36px;align-items:start}
.ap-review-card{background:#fff;border:1px solid ${borderFaint};padding:32px 28px;border-radius:var(--radius-sm);transition:border-color .3s var(--ease),box-shadow .3s var(--ease)}
.ap-review-card:nth-child(2){transform:translateY(30px)}
.ap-review-card:hover{border-color:var(--primary);box-shadow:0 8px 30px var(--primary-glow)}
.ap-review-stars{color:var(--accent);font-size:1rem;letter-spacing:2px;margin-bottom:14px}
.ap-review-quote{color:var(--text-dim);font-size:.88rem;line-height:1.8;margin-bottom:18px;font-style:italic}
.ap-review-name{font-family:var(--font-h);font-size:.85rem;letter-spacing:2px;color:var(--text)}
.ap-reviews-note{text-align:center;margin-top:56px;font-size:.7rem;color:var(--text-dim);text-transform:uppercase;letter-spacing:2px}

/* === CTA === */
.ap-cta{position:relative;padding:clamp(80px,10vw,140px) 24px;text-align:center;overflow:hidden}
.ap-cta-bg{position:absolute;inset:0;background-size:cover;background-position:center}
.ap-cta-overlay{position:absolute;inset:0;background:rgba(15,10,25,.90)}
.ap-cta-inner{position:relative;z-index:1;max-width:680px;margin:0 auto}
.ap-cta h2{font-family:var(--font-h);font-size:clamp(2.2rem,5.5vw,4.5rem);letter-spacing:-0.01em;margin-bottom:10px;color:#fff}
.ap-cta h2 span{color:rgba(255,255,255,.5)}
.ap-cta-inner>p{color:rgba(255,255,255,.65);font-size:clamp(.9rem,1.8vw,1.05rem);margin-bottom:36px;line-height:1.8}
.ap-form{display:grid;grid-template-columns:1fr 1fr;gap:12px;max-width:500px;margin:0 auto;text-align:left}
.ap-form input,.ap-form textarea{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.2);color:#fff;font-family:var(--font-b);font-size:.85rem;padding:14px 18px;outline:none;transition:border-color .3s var(--ease);border-radius:var(--radius-sm)}
.ap-form input:focus,.ap-form textarea:focus{border-color:rgba(255,255,255,.5)}
.ap-form input::placeholder,.ap-form textarea::placeholder{color:rgba(255,255,255,.4)}
.ap-form textarea{grid-column:1/-1;resize:none;height:90px}
.ap-form .ap-btn{grid-column:1/-1;justify-content:center;font-size:1rem;padding:16px 36px}
.ap-form-note{grid-column:1/-1;font-size:.68rem;color:rgba(255,255,255,.35);text-align:center;margin-top:-4px}
.ap-cta-or{margin:28px 0 8px;font-size:.78rem;color:rgba(255,255,255,.4);text-transform:uppercase;letter-spacing:2px}
.ap-cta-ph a{font-family:var(--font-h);font-size:1.3rem;color:#fff;letter-spacing:3px}

/* === FOOTER === */
.ap-footer{padding:44px 24px;border-top:1px solid ${borderFaint};text-align:center}
.ap-footer p{color:var(--text-dim);font-size:.82rem;line-height:1.8}
.ap-footer a{color:var(--primary)}

/* === DEMO BANNER === */
.ap-demo-bar{position:fixed;bottom:0;left:0;width:100%;background:var(--primary);color:var(--btn-text);text-align:center;padding:10px 24px;font-family:var(--font-h);font-size:.9rem;letter-spacing:2px;z-index:9999}
.ap-demo-bar a{color:var(--btn-text);text-decoration:underline}

/* === MOBILE === */
@media(max-width:768px){
  .ap-topbar-loc,.ap-topbar-info,.ap-topbar-sep{display:none}
  .ap-topbar-inner{justify-content:center}
  .ap-ham{display:flex}
  .ap-nav-center{position:fixed;top:0;right:-100%;width:260px;height:100vh;background:#fff;flex-direction:column;justify-content:center;padding:40px;gap:22px;transition:right .4s var(--ease);z-index:1001;left:auto;transform:none;box-shadow:-4px 0 20px rgba(0,0,0,.1)}
  .ap-nav-center.open{right:0}
  .ap-nav-right{z-index:1002}
  .ap-nav-cta{display:none}
  .ap-hero{grid-template-columns:1fr;min-height:auto}
  .ap-hero-img{min-height:50vh;order:-1}
  .ap-hero-img img{clip-path:none}
  .ap-hero-text{padding:48px 24px 48px}
  .ap-hero-ctas{flex-direction:column}
  .ap-btn,.ap-btn-o{width:100%;max-width:300px;justify-content:center}
  .ap-trust{margin:-20px 16px 0;border-radius:var(--radius-sm)}
  .ap-trust-inner{flex-direction:column;align-items:center;gap:14px}
  .ap-about-grid{grid-template-columns:1fr;gap:32px}
  .ap-why-grid{grid-template-columns:repeat(2,1fr);gap:28px}
  .ap-svc-grid{grid-template-columns:1fr}
  .ap-svc-card.featured{grid-row:auto;aspect-ratio:3/2}
  .ap-svc-card{aspect-ratio:3/2}
  .ap-reviews-grid{grid-template-columns:1fr}
  .ap-review-card:nth-child(2){transform:none}
  .ap-form{grid-template-columns:1fr}
}
@media(min-width:769px) and (max-width:1024px){
  .ap-hero{grid-template-columns:1.2fr 1fr}
  .ap-svc-grid{grid-template-columns:1fr 1fr}
  .ap-svc-card.featured{grid-row:auto;aspect-ratio:4/3}
  .ap-svc-card{aspect-ratio:4/3}
  .ap-why-grid{grid-template-columns:repeat(2,1fr)}
  .ap-reviews-grid{grid-template-columns:repeat(2,1fr)}
  .ap-review-card:nth-child(2){transform:translateY(20px)}
  .ap-reviews-grid .ap-review-card:last-child{grid-column:1/-1;max-width:50%;margin:0 auto}
}
</style>
</head>
<body>

<!-- Progress Bar -->
<div class="ap-progress"></div>

<!-- Top Utility Bar -->
<div class="ap-topbar">
  <div class="ap-topbar-inner">
    ${phoneClean ? `<a href="tel:${phoneClean}">&#9742; ${escHTML(phone)}</a>` : `<span class="ap-topbar-info"><span>&#9679;</span> Professional ${escHTML(copy.verb.charAt(0).toUpperCase() + copy.verb.slice(1))}</span>`}
    <span class="ap-topbar-sep"></span>
    ${city ? `<span class="ap-topbar-loc">&#128205; Serving ${escHTML(location)}</span>` : ''}
    <span class="ap-topbar-info"><span>&#9679;</span> Licensed &amp; Insured</span>
  </div>
</div>

<!-- Nav -->
<nav class="ap-nav">
  <div class="ap-nav-inner">
    <div class="ap-logo">${escHTML(logoFirst)}${logoLast ? ` <span>${escHTML(logoLast)}</span>` : ''}</div>
    <div class="ap-nav-center">
      <a href="#about">About</a>
      <a href="#services">Services</a>
      <a href="#reviews">Reviews</a>
      <a href="#contact">Contact</a>
    </div>
    <div class="ap-nav-right">
      <a href="#contact" class="ap-nav-cta">FREE ESTIMATE</a>
      <div class="ap-ham" role="button" tabindex="0" aria-label="Menu">
        <span></span><span></span><span></span>
      </div>
    </div>
  </div>
</nav>

<!-- Hero \u2014 Split Layout -->
<section class="ap-hero">
  <div class="ap-hero-text">
    <div class="ap-hero-label">${escHTML(copy.heroLabel)} \u2014 ${escHTML(location)}</div>
    <h1>
      <span class="ap-ln"><span class="ap-ln-i">${escHTML(heroLine1)}${heroLine1.endsWith('.') ? '' : '.'}</span></span>
      <span class="ap-ln"><span class="ap-ln-i">${escHTML(heroLine2)}${heroLine2.endsWith('.') ? '' : '.'}</span></span>
    </h1>
    <p class="ap-hero-sub">${escHTML(copy.sub)}</p>
    <div class="ap-hero-ctas">
      <a href="#contact" class="ap-btn">GET A FREE ESTIMATE</a>
      <a href="#services" class="ap-btn-o">VIEW SERVICES</a>
    </div>
    ${phoneClean ? `<div class="ap-hero-ph"><a href="tel:${phoneClean}">&#9742; ${escHTML(phone)}</a></div>` : ''}
  </div>
  <div class="ap-hero-img">
    ${hero ? `<img src="${hero}" alt="${escHTML(heroAlt)}">` : `<div style="width:100%;height:100%;background:linear-gradient(135deg,var(--bg3),var(--bg2))"></div>`}
  </div>
</section>

<!-- Trust Strip -->
<div class="ap-trust">
  <div class="ap-trust-inner">
${copy.trust.map(b => `    <div class="ap-trust-badge">
      <div class="ap-trust-icon">${b[0]}</div>
      <div class="ap-trust-text"><strong>${escHTML(b[1])}</strong>${escHTML(b[2])}</div>
    </div>`).join('\n')}
  </div>
</div>

<!-- About -->
<section class="ap-about" id="about">
  <div class="ap-about-grid">
    <div class="ap-about-text ap-pop">
      <div class="ap-label">${owner ? 'Meet the Owner' : 'About Us'}</div>
      <h2 class="ap-title">${owner ? `MEET ${escHTML(owner.toUpperCase())}` : `ABOUT ${escHTML(biz.toUpperCase())}`}</h2>
      <p><strong>${escHTML(biz)}</strong> isn't a franchise or a call center. ${owner ? `When you call, you get ${escHTML(owner)}. When the work starts, ${escHTML(owner)} is there.` : 'When you call, you get the owner. When the work starts, we\u2019re there.'}</p>
      <p>${escHTML(copy.aboutP2)}</p>
      <p>${city ? `${escHTML(city)} is home.` : 'This community is home.'} The neighbors, the businesses, the families \u2014 these are the people we serve and the people we answer to.</p>
      ${owner ? `<div class="ap-about-sig">\u2014 ${escHTML(owner)}, Owner</div>` : ''}
    </div>
    <div class="ap-about-img ap-pop">
      ${about ? `<img src="${about}" alt="${escHTML(aboutAlt)}" loading="lazy">` : ''}
    </div>
  </div>
</section>

<!-- Why Choose Us \u2014 Numbered -->
<section class="ap-why">
  <div class="ap-why-inner">
    <div class="ap-label ap-pop">The ${escHTML(biz.split(' ').slice(-1)[0])} Difference</div>
    <h2 class="ap-title ap-pop">WHY CHOOSE US</h2>
    <div class="ap-why-grid">
${copy.pillars.map((p, i) => `      <div class="ap-why-item ap-pop">
        <div class="ap-why-num">0${i + 1}</div>
        <h3>${escHTML(p[0])}</h3>
        <p>${escHTML(p[1])}</p>
      </div>`).join('\n')}
    </div>
  </div>
</section>

<!-- Services \u2014 Asymmetric Grid -->
<section class="ap-svc" id="services">
  <div class="ap-svc-inner">
    <div class="ap-label ap-pop">What We Do</div>
    <h2 class="ap-title ap-pop">OUR SERVICES</h2>
    <div class="ap-svc-grid">
${copy.services.map((s, i) => `      <div class="ap-svc-card${i === 0 ? ' featured' : ''} ap-pop">
        ${svcPhotos[i] ? `<img src="${svcPhotos[i]}" alt="${escHTML(s)}" loading="lazy">` : `<div style="position:absolute;inset:0;background:var(--bg3)"></div>`}
        <div class="ap-svc-body">
          <h3>${escHTML(s.toUpperCase())}</h3>
          <p>${escHTML(copy.svcDesc[i] || `Professional ${s.toLowerCase()} services tailored to your needs.`)}</p>
          <span class="ap-svc-more">LEARN MORE &#8594;</span>
        </div>
      </div>`).join('\n')}
    </div>
  </div>
</section>

<!-- Reviews \u2014 Staggered -->
<section class="ap-reviews" id="reviews">
  <div class="ap-reviews-inner">
    <div class="ap-label ap-pop">What Our Clients Say</div>
    <h2 class="ap-title ap-pop">REVIEWS</h2>
    <div class="ap-reviews-grid">
${copy.reviews.map(r => `      <div class="ap-review-card ap-pop">
        <div class="ap-review-stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
        <p class="ap-review-quote">"${escHTML(r[0])}"</p>
        <div class="ap-review-name">\u2014 ${escHTML(r[1])}</div>
      </div>`).join('\n')}
    </div>
    <div class="ap-reviews-note ap-pop">(Sample reviews \u2014 your real reviews will appear here)</div>
  </div>
</section>

<!-- CTA -->
<section class="ap-cta" id="contact">
  <div class="ap-cta-bg" ${ctaBg ? `style="background-image:url('${ctaBg}')"` : ''}></div>
  <div class="ap-cta-overlay"></div>
  <div class="ap-cta-inner ap-pop">
    <h2>${escHTML(copy.cta[0])} <span>${escHTML(copy.cta[1])}</span></h2>
    <p>${escHTML(copy.cta[2])}</p>
    <form class="ap-form" onsubmit="return false">
      <input type="text" placeholder="Your Name" aria-label="Your Name">
      <input type="tel" placeholder="Phone Number" aria-label="Phone Number">
      <textarea placeholder="Tell us about your project \u2014 what do you need done?" aria-label="Project details"></textarea>
      <button type="submit" class="ap-btn">REQUEST FREE ESTIMATE</button>
      <div class="ap-form-note">(Form will be connected when your site goes live)</div>
    </form>
    ${phoneClean ? `<div class="ap-cta-or">Or call us directly</div>
    <div class="ap-cta-ph"><a href="tel:${phoneClean}">&#9742; ${escHTML(phone)}</a></div>` : ''}
  </div>
</section>

<!-- Footer -->
<footer class="ap-footer">
  <div>
    <p>&copy; ${new Date().getFullYear()} ${escHTML(biz)}. All rights reserved. ${escHTML(location)}. ${phoneClean ? `<a href="tel:${phoneClean}">${escHTML(phone)}</a>` : ''}</p>
    <p style="margin-top:8px;font-size:.72rem;color:rgba(26,26,26,.35)">Built by <a href="https://herrmanonlineoutlook.com" target="_blank" rel="noopener">HOO</a></p>
  </div>
</footer>

<!-- Demo Banner -->
<div class="ap-demo-bar">DEMO PREVIEW \u2014 Built free by <a href="https://herrmanonlineoutlook.com">HOO</a> | Build free, pay on approval</div>

<script>
(function(){
  var prog=document.querySelector('.ap-progress'),nav=document.querySelector('.ap-nav'),topbar=document.querySelector('.ap-topbar');
  window.addEventListener('scroll',function(){
    var s=window.scrollY,h=document.documentElement.scrollHeight-window.innerHeight;
    prog.style.width=(s/h*100)+'%';
    var scrolled=s>80;
    topbar.classList.toggle('hidden',scrolled);
    nav.classList.toggle('scrolled',scrolled);
  },{passive:true});

  var ham=document.querySelector('.ap-ham'),links=document.querySelector('.ap-nav-center');
  ham.addEventListener('click',function(){links.classList.toggle('open')});
  ham.addEventListener('keydown',function(e){if(e.key==='Enter')links.classList.toggle('open')});
  links.querySelectorAll('a').forEach(function(a){a.addEventListener('click',function(){links.classList.remove('open')})});

  // Scroll reveals
  var els=document.querySelectorAll('.ap-pop');
  if('IntersectionObserver' in window){
    var io=new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(e.isIntersecting){
          e.target.classList.add('ap-vis');
          io.unobserve(e.target);
        }
      });
    },{threshold:.15,rootMargin:'0px 0px -30px 0px'});
    els.forEach(function(el,i){
      el.style.transitionDelay=(i%4)*80+'ms';
      io.observe(el);
    });
  }else{els.forEach(function(p){p.classList.add('ap-vis')})}
})();
</script>

</body>
</html>`;
}

// ── MAIN BUILD ────────────────────────────────────────────────────────────────
async function buildPrototype(leadPath) {
  let lead;
  try {
    lead = JSON.parse(fs.readFileSync(leadPath, 'utf8'));
  } catch (err) {
    console.error(`\u274c  Cannot read lead file: ${err.message}`);
    return null;
  }

  const biz      = lead.business || lead.business_name || 'demo';
  const industry = (lead.industry || '').toLowerCase();
  const leadId   = lead.id || 'XXXX';
  const city     = lead.city || '';

  const hasV4 = !!V4_TEMPLATES[industry];
  console.log(`\n\ud83c\udfd7\ufe0f  Auto-Prototype v4.0: ${biz}`);
  console.log(`   Industry: ${industry} ${hasV4 ? '(V4 template ✓)' : '(v3 fallback)'}`);
  console.log(`   City: ${city || 'N/A'}`);
  console.log(`   Owner: ${lead.owner_name || 'N/A'}`);

  const theme = INDUSTRY_THEMES[industry] || DEFAULT_THEME;

  // Competitor intel scraping — only needed for v3 fallback (V4 templates don't use it)
  let compIntel = null;
  if (!hasV4 && city && industry) {
    console.log('\n\ud83d\udd75\ufe0f  Competitor Intel...');
    compIntel = await scrapeCompetitorIntel(industry, `${city} ${lead.state || 'MO'}`, leadId);
    if (compIntel && compIntel.ogImages.length > 0) {
      console.log(`   \ud83d\uddbc\ufe0f  ${compIntel.ogImages.length} competitor og:images found`);
    }
  }

  // Fetch photos from Pexels
  const photoContext = `${lead.business || lead.business_name || ''} ${lead.notes || ''}`;
  console.log(`\n\ud83d\udcf8  Fetching photos from Pexels for "${industry}"...`);
  let photos = [];
  try {
    photos = await getCuratedPhotos(industry || 'small business', 20, photoContext);
    console.log(`   \u2705  Got ${photos.length} photos`);
  } catch (err) {
    console.warn(`   \u26a0\ufe0f  Pexels failed: ${err.message} \u2014 building with existing template photos`);
  }

  // Try V4 template first, fall back to v3 generated
  let html = null;
  if (hasV4) {
    console.log('\n\ud83d\udd28  Building from V4 template...');
    html = buildFromV4Template(lead, photos, compIntel);
  }
  if (!html) {
    console.log('\n\ud83d\udd28  Building from v3 generated template...');
    console.log(`\ud83c\udfa8  Theme: bg ${theme.bg} | primary ${theme.primary}`);
    html = buildHTML(lead, photos, theme, compIntel);
  }

  // Mapbox token: __MAPBOX_TOKEN__ placeholder is preserved in source + committed output.
  // Token gets injected at deploy time by .github/workflows/deploy-demos.yml using
  // ${{ secrets.MAPBOX_TOKEN }}. Local file:// previews won't render maps (acceptable).

  if (!fs.existsSync(OUTPUTS_DIR)) fs.mkdirSync(OUTPUTS_DIR, { recursive: true });
  const cleanId  = leadId.replace(/^LEAD-/i, '');
  const filename = `LEAD-${cleanId}-${slugify(biz)}.html`;
  const filepath = path.join(OUTPUTS_DIR, filename);
  fs.writeFileSync(filepath, html, 'utf8');

  const sizeKB = (Buffer.byteLength(html) / 1024).toFixed(1);
  console.log(`\n\u2705  Demo saved: outputs/demos/${filename} (${sizeKB} KB)`);
  console.log(`   Full path: ${filepath}`);

  // Send email if --send
  if (IS_SEND) {
    if (!lead.email) {
      console.log('\n\u26a0\ufe0f  --send requested but lead has no email address.');
    } else {
      console.log(`\n\ud83d\udce7  ${IS_LIVE ? 'Sending' : 'Preview: would send'} demo notification to ${lead.email}...`);

      const emailBody = [
        `Hi ${lead.owner_name || 'there'},`,
        '',
        `I noticed ${biz} doesn't have a website \u2014 so I built you one.`,
        '',
        `It's a full demo, ready to go. Built free, no strings.`,
        '',
        `Want to see it? Reply here or call me: (804) 957-1003`,
        '',
        `\u2014 Matthew Herrman`,
        `HOO \u2014 Build Free, Pay on Approval`,
        `herrmanonlineoutlook.com`,
      ].join('\n');

      if (IS_LIVE) {
        try {
          const nodemailer = require('nodemailer');
          const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
          });

          const info = await transporter.sendMail({
            from: `"${process.env.GMAIL_FROM_NAME || 'Matthew Herrman | HOO'}" <${process.env.GMAIL_USER}>`,
            to: lead.email,
            subject: `Built something for ${biz}`,
            text: emailBody,
          });

          console.log(`   \u2705  Email sent to ${lead.email} [${info.messageId}]`);

          const logFile = path.join(__dirname, '..', 'data', 'email-log.json');
          const logDir  = path.dirname(logFile);
          if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
          let log = [];
          try { log = JSON.parse(fs.readFileSync(logFile, 'utf8')); } catch {}
          log.push({
            date:      new Date().toISOString(),
            lead:      biz,
            id:        leadId,
            to:        lead.email,
            subject:   `Built something for ${biz}`,
            source:    'auto-prototype',
            messageId: info.messageId,
            status:    'sent',
            demo:      filename,
          });
          fs.writeFileSync(logFile, JSON.stringify(log, null, 2));
        } catch (err) {
          console.error(`   \u274c  Email failed: ${err.message}`);
        }
      } else {
        console.log('\n\u2500\u2500\u2500 EMAIL PREVIEW \u2500\u2500\u2500');
        console.log(`TO:      ${lead.email}`);
        console.log(`SUBJECT: Built something for ${biz}`);
        console.log('\u2500\u2500\u2500 BODY \u2500\u2500\u2500');
        console.log(emailBody);
        console.log('\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500');
        console.log('\n\ud83d\udd12  DRY RUN \u2014 add --live to actually send.');
      }
    }
  }

  return { filepath, filename, photos: photos.length, theme: industry, competitorIntel: compIntel ? compIntel.competitors.length : 0 };
}

// ── TEST LEAD ─────────────────────────────────────────────────────────────────
function createTestLead() {
  const indFlag = process.argv.find(a => a.startsWith('--industry='));
  const testIndustry = indFlag ? indFlag.split('=')[1] : 'tattoo';

  const testData = {
    tattoo:             { business: 'Tattoos by Glendon', owner: 'Glendon Thomas', city: 'Liberty', phone: '(816) 569-4465' },
    cleaning:           { business: 'Sparkle Clean KC', owner: 'Sarah Johnson', city: 'Independence', phone: '(816) 555-0101' },
    'lawn care':        { business: 'Green Edge Lawns', owner: 'Mike Davis', city: 'Blue Springs', phone: '(816) 555-0202' },
    handyman:           { business: 'Fix It Right KC', owner: 'Tom Wilson', city: "Lee's Summit", phone: '(816) 555-0303' },
    barber:             { business: 'Sharp Cutz Barbershop', owner: 'James Carter', city: 'Raytown', phone: '(816) 555-0404' },
    'pet grooming':     { business: 'Pampered Paws KC', owner: 'Lisa Park', city: 'Liberty', phone: '(816) 555-0505' },
    'food truck':       { business: 'Rolling Smoke BBQ', owner: 'Derek Brown', city: 'Grandview', phone: '(816) 555-0606' },
    'auto detailing':   { business: 'Mirror Finish Auto', owner: 'Chris Lopez', city: 'Kansas City', phone: '(816) 555-0707' },
    'pressure washing': { business: 'BlastClean Pro', owner: 'Ryan Miller', city: 'Overland Park', phone: '(913) 555-0808' },
    'mobile mechanic':  { business: 'Wrench Ready Mobile', owner: 'Aaron Foster', city: 'Independence', phone: '(816) 555-0909' },
    painting:           { business: 'Gaab Painting', owner: 'Raul Rodriguez', city: 'Independence', phone: '(816) 730-1906' },
    landscaping:        { business: 'GreenArt Landscaping', owner: 'Carlos Mendez', city: 'Overland Park', phone: '(913) 555-1010' },
    moving:             { business: 'Swift Move KC', owner: 'Tony Williams', city: 'Kansas City', phone: '(816) 555-1111' },
    roofing:            { business: 'Solid Top Roofing', owner: 'Bill Henderson', city: 'Blue Springs', phone: '(816) 555-1212' },
    fencing:            { business: 'Iron Gate Fencing', owner: 'Daniel Price', city: "Lee's Summit", phone: '(816) 555-1313' },
    'personal training': { business: 'Peak Performance PT', owner: 'Jessica Lane', city: 'Kansas City', phone: '(816) 555-1414' },
    photography:        { business: 'Captured Light Photo', owner: 'Jonathan Reed', city: 'Liberty', phone: '(816) 555-1515' },
    'junk removal':     { business: 'Gone Today Junk', owner: 'Frank Davis', city: 'Independence', phone: '(816) 555-1616' },
    'auto repair':      { business: 'Oak Grove Auto Repair', owner: 'Dave Mitchell', city: 'Oak Grove', phone: '(816) 555-1717' },
  };

  const data = testData[testIndustry] || testData.tattoo;
  return {
    id:            'TEST-001',
    business:      data.business,
    business_name: data.business,
    owner_name:    data.owner,
    industry:      testIndustry,
    city:          data.city,
    state:         'MO',
    phone:         data.phone,
    email:         'test@example.com',
    no_website:    true,
    stage:         'new',
  };
}

// ── CLI ────────────────────────────────────────────────────────────────────────
async function main() {
  const [,, cmd, arg] = process.argv;

  switch (cmd) {
    case 'build': {
      if (!arg || arg.startsWith('--')) {
        console.log('Usage: node auto-prototype.js build <lead.json> [--send] [--live]');
        return;
      }
      await buildPrototype(arg);
      break;
    }

    case 'test': {
      const indFlag = process.argv.find(a => a.startsWith('--industry='));
      const testInd = indFlag ? indFlag.split('=')[1] : 'tattoo';
      console.log(`\n\ud83e\uddea  Test mode \u2014 ${testInd} theme (V4 Template Engine)\n`);
      const lead = createTestLead();
      const tmpFile = path.join(OUTPUTS_DIR, '_test-lead.json');
      if (!fs.existsSync(OUTPUTS_DIR)) fs.mkdirSync(OUTPUTS_DIR, { recursive: true });
      fs.writeFileSync(tmpFile, JSON.stringify(lead, null, 2));
      await buildPrototype(tmpFile);
      fs.unlinkSync(tmpFile);
      break;
    }

    case 'themes': {
      console.log('\n\ud83c\udfa8  Available Industry Themes (ALL LIGHT):\n');
      for (const [ind, t] of Object.entries(INDUSTRY_THEMES)) {
        console.log(`  ${ind.padEnd(20)} bg:${t.bg}  primary:${t.primary}  bg2:${t.bg2}`);
      }
      console.log(`\n  Test any: node auto-prototype.js test --industry=${Object.keys(INDUSTRY_THEMES)[0]}`);
      break;
    }

    default:
      console.log(`
\x1b[33mHOO Auto-Prototype v4.0 (V4 Template Engine)\x1b[0m \u2014 Lead \u2192 V4 Template \u2192 Photos \u2192 Demo \u2192 Email

Commands:
  build <lead.json>                   Build demo from V4 template (dry run)
  build <lead.json> --send            Build + preview email to lead
  build <lead.json> --send --live     Build + actually send email
  test                                Build demo for fake tattoo shop lead
  test --industry=cleaning            Test with specific industry theme
  themes                              List all 18 industry color themes

V4 Template Engine:
  \u2022 Pre-built premium templates per industry (18 total)
  \u2022 Layout stays locked \u2014 only business info + photos swap
  \u2022 Competitor-researched designs with interactive features
  \u2022 Falls back to v3 generated template if no V4 exists
  \u2022 Contact form in CTA section
  \u2022 ALL light themes \u2014 clean, professional
  \u2022 Industry-specific copy for all 18 industries

Output: outputs/demos/  |  outputs/prototypes/ (color intel)
      `);
  }
}

module.exports = { buildPrototype, createTestLead, INDUSTRY_THEMES };

if (require.main === module) {
  main().catch(console.error);
}

/**
 * HOO Auto-Prototype v1.0 — Lead → Pexels Photos → Full Demo Page → Email
 * Wires pexels-engine.js + email-engine.js into a single pipeline.
 *
 * Usage:
 *   node auto-prototype.js build <lead.json>              Build demo (dry run preview)
 *   node auto-prototype.js build <lead.json> --send       Build + email demo link to lead
 *   node auto-prototype.js build <lead.json> --send --live Build + actually send email
 *   node auto-prototype.js test                           Build demo for fake tattoo lead
 *
 * Output: outputs/demos/LEAD-{id}-{business-slug}.html
 */

require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const fs   = require('fs');
const path = require('path');
const { getPhotos, INDUSTRY_MAP } = require('./pexels-engine');

const OUTPUTS_DIR = path.join(__dirname, '..', '..', 'outputs', 'demos');
const IS_SEND     = process.argv.includes('--send');
const IS_LIVE     = process.argv.includes('--live');

// ── INDUSTRY COPY ─────────────────────────────────────────────────────────────
const INDUSTRY_COPY = {
  tattoo:             { verb: 'tattoo', services: ['Custom Designs', 'Portraits & Realism', 'Traditional & Neo-Trad', 'Blackwork & Geometric', 'Cover-Ups & Reworks', 'Free Consultations'], tagline: 'Your Vision, Perfected in Ink', sub: 'Custom tattoos crafted with precision. Every piece is a one-of-a-kind work of art.' },
  cleaning:           { verb: 'cleaning', services: ['Deep Cleaning', 'Regular Maintenance', 'Move-In/Move-Out', 'Office Cleaning', 'Carpet & Upholstery', 'Window Cleaning'], tagline: 'A Spotless Home, Every Time', sub: 'Professional cleaning services that bring the shine back to your space.' },
  'lawn care':        { verb: 'lawn care', services: ['Weekly Mowing', 'Edging & Trimming', 'Fertilization', 'Weed Control', 'Leaf Removal', 'Seasonal Cleanup'], tagline: 'The Best Lawn on the Block', sub: 'Professional lawn care that keeps your yard looking pristine all season.' },
  handyman:           { verb: 'handyman', services: ['General Repairs', 'Drywall & Painting', 'Plumbing Fixes', 'Electrical Work', 'Furniture Assembly', 'Deck & Fence Repair'], tagline: 'Fixed Right the First Time', sub: 'Reliable handyman services for every job around the house.' },
  fencing:            { verb: 'fencing', services: ['Wood Fencing', 'Vinyl Fencing', 'Chain Link', 'Iron & Aluminum', 'Fence Repair', 'Gate Installation'], tagline: 'Built Strong. Built to Last.', sub: 'Premium fencing installation that adds security and value to your property.' },
  'food truck':       { verb: 'food', services: ['Catering Events', 'Private Parties', 'Corporate Lunch', 'Festival Booking', 'Weekly Locations', 'Custom Menus'], tagline: 'Street Food, Elevated', sub: 'Incredible food brought straight to you — wherever you are.' },
  landscaping:        { verb: 'landscaping', services: ['Landscape Design', 'Hardscaping', 'Irrigation Systems', 'Garden Installation', 'Tree & Shrub Care', 'Outdoor Lighting'], tagline: 'Transform Your Outdoor Space', sub: 'Professional landscaping that turns your yard into a backyard paradise.' },
  roofing:            { verb: 'roofing', services: ['Roof Replacement', 'Roof Repair', 'Storm Damage', 'Inspections', 'Gutter Installation', 'Commercial Roofing'], tagline: 'Protection Above Everything', sub: 'Expert roofing services that keep your family safe and dry.' },
  barber:             { verb: 'barber', services: ['Classic Cuts', 'Beard Trim & Shape', 'Hot Towel Shave', 'Kids Cuts', 'Hair Design', 'Walk-Ins Welcome'], tagline: 'Sharp Cuts. Clean Lines.', sub: 'Premium barbershop experience — walk in looking good, leave looking great.' },
  'auto detailing':   { verb: 'detailing', services: ['Full Detail', 'Interior Deep Clean', 'Exterior Polish', 'Ceramic Coating', 'Paint Correction', 'Mobile Service'], tagline: 'Showroom Shine, Every Time', sub: 'Professional auto detailing that makes your ride look brand new.' },
  painting:           { verb: 'painting', services: ['Interior Painting', 'Exterior Painting', 'Cabinet Refinishing', 'Deck Staining', 'Drywall Repair', 'Color Consultation'], tagline: 'Fresh Paint. Fresh Start.', sub: 'Professional painting services that transform your home inside and out.' },
  'pet grooming':     { verb: 'grooming', services: ['Full Grooming', 'Bath & Brush', 'Nail Trimming', 'De-Shedding', 'Puppy First Groom', 'Mobile Grooming'], tagline: 'Pampered Pets, Happy Owners', sub: 'Professional pet grooming that keeps your furry family looking and feeling their best.' },
  photography:        { verb: 'photography', services: ['Portrait Sessions', 'Wedding Photography', 'Event Coverage', 'Product Photography', 'Headshots', 'Photo Editing'], tagline: 'Moments Worth Remembering', sub: 'Professional photography that captures the moments that matter most.' },
  'personal training': { verb: 'training', services: ['1-on-1 Training', 'Group Sessions', 'Nutrition Plans', 'Weight Loss Programs', 'Strength Training', 'Online Coaching'], tagline: 'Your Goals. Your Pace. Real Results.', sub: 'Personal training that meets you where you are and takes you where you want to go.' },
  moving:             { verb: 'moving', services: ['Local Moves', 'Long Distance', 'Packing Services', 'Loading & Unloading', 'Storage Solutions', 'Commercial Moving'], tagline: 'Moving Made Simple', sub: 'Stress-free moving services — we handle the heavy lifting so you don\'t have to.' },
  'pressure washing': { verb: 'pressure washing', services: ['Driveway Cleaning', 'House Washing', 'Deck & Patio', 'Fence Cleaning', 'Roof Soft Wash', 'Commercial Properties'], tagline: 'Restore the Clean', sub: 'Professional pressure washing that strips away years of grime in hours.' },
  'junk removal':     { verb: 'junk removal', services: ['Full Cleanouts', 'Furniture Removal', 'Appliance Hauling', 'Yard Debris', 'Construction Waste', 'Same-Day Service'], tagline: 'Gone. Just Like That.', sub: 'Fast, affordable junk removal — we show up, load up, and haul it away.' },
  'mobile mechanic':  { verb: 'mechanic', services: ['Oil Changes', 'Brake Service', 'Diagnostics', 'Battery Replacement', 'Tune-Ups', 'Emergency Repairs'], tagline: 'We Come to You', sub: 'Mobile mechanic services — professional auto repair at your location.' },
};

const DEFAULT_COPY = { verb: 'service', services: ['Service One', 'Service Two', 'Service Three', 'Service Four', 'Service Five', 'Service Six'], tagline: 'Quality You Can Count On', sub: 'Professional services delivered with care and expertise.' };

// ── SLUG ──────────────────────────────────────────────────────────────────────
function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// ── BUILD HTML ────────────────────────────────────────────────────────────────
function buildHTML(lead, photos) {
  const biz       = lead.business || lead.business_name || 'Business';
  const owner     = lead.owner_name || '';
  const city      = lead.city || '';
  const state     = lead.state || 'MO';
  const phone     = lead.phone || '';
  const industry  = (lead.industry || '').toLowerCase();
  const copy      = INDUSTRY_COPY[industry] || DEFAULT_COPY;
  const phoneClean = phone.replace(/\D/g, '');
  const location   = city ? `${city}, ${state}` : state;

  // Assign photos to slots — fallback to gradient if missing
  const hero  = photos[0]?.url || '';
  const about = photos[1]?.url || '';
  const svc   = [photos[2]?.url || '', photos[3]?.url || '', photos[4]?.url || ''];
  const cta   = photos[5]?.url || hero;

  const heroAlt  = photos[0]?.alt || `${biz} hero`;
  const aboutAlt = photos[1]?.alt || `About ${biz}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${biz} | ${copy.tagline} — ${location}</title>
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Syne:wght@400;600;700&family=Cormorant+Garamond:ital,wght@0,400;1,400&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
:root{
  --bg:#050505;--bg2:#0E0E0E;--bg3:#1C1C1C;
  --gold:#C8952E;--gold-hover:#E8B84B;--gold-glow:rgba(200,149,46,.25);
  --text:#F0EAE0;--text-dim:rgba(240,234,224,.6);
  --font-h:'Bebas Neue',sans-serif;--font-b:'Syne',sans-serif;--font-accent:'Cormorant Garamond',serif;
  --ease:cubic-bezier(.25,.46,.45,.94);--max:1200px;
}
html{scroll-behavior:smooth}
body{background:var(--bg);color:var(--text);font-family:var(--font-b);line-height:1.6;overflow-x:hidden}
a{color:var(--gold);text-decoration:none;transition:color .3s var(--ease)}
a:hover{color:var(--gold-hover)}
img{max-width:100%;display:block}

/* ═══ PROGRESS BAR ═══ */
.ap-progress{position:fixed;top:0;left:0;height:3px;background:var(--gold);width:0;z-index:1001;will-change:width}

/* ═══ NAV ═══ */
.ap-nav{position:fixed;top:0;left:0;width:100%;z-index:1000;padding:16px 0;transition:background .4s var(--ease),padding .4s var(--ease)}
.ap-nav.scrolled{background:rgba(5,5,5,.95);backdrop-filter:blur(10px);padding:10px 0}
.ap-nav-inner{max-width:var(--max);margin:0 auto;display:flex;align-items:center;justify-content:space-between;padding:0 20px}
.ap-logo{font-family:var(--font-h);font-size:clamp(1.2rem,3vw,1.6rem);letter-spacing:2px;color:var(--text)}
.ap-logo span{color:var(--gold)}
.ap-nav-links{display:flex;gap:24px;align-items:center}
.ap-nav-links a{font-size:.8rem;color:var(--text-dim);text-transform:uppercase;letter-spacing:1.5px;transition:color .3s var(--ease)}
.ap-nav-links a:hover{color:var(--gold)}
.ap-nav-cta{background:var(--gold);color:var(--bg);padding:10px 22px;font-family:var(--font-h);font-size:.95rem;letter-spacing:2px;border:none;cursor:pointer;transition:all .3s var(--ease)}
.ap-nav-cta:hover{background:var(--gold-hover);transform:translateY(-2px);color:var(--bg)}
.ap-ham{display:none;flex-direction:column;gap:5px;cursor:pointer;z-index:1002}
.ap-ham span{width:26px;height:2px;background:var(--gold);transition:all .3s var(--ease)}

/* ═══ HERO ═══ */
.ap-hero{position:relative;min-height:100vh;display:flex;align-items:center;justify-content:center;overflow:hidden}
.ap-hero-bg{position:absolute;inset:0;background-size:cover;background-position:center;background-repeat:no-repeat;z-index:0}
.ap-hero-overlay{position:absolute;inset:0;background:linear-gradient(180deg,rgba(5,5,5,.55) 0%,rgba(5,5,5,.85) 100%);z-index:1}
.ap-hero-content{position:relative;z-index:2;text-align:center;padding:0 20px;max-width:850px}
.ap-hero-label{font-family:var(--font-accent);font-style:italic;color:var(--gold);font-size:clamp(1rem,2.5vw,1.2rem);margin-bottom:12px;opacity:0;transform:translateY(20px);animation:ap-up .8s var(--ease) .3s forwards}
.ap-hero h1{font-family:var(--font-h);font-size:clamp(2.8rem,9vw,6.5rem);line-height:.92;letter-spacing:3px;margin-bottom:20px}
.ap-hero h1 .ap-ln{display:block;overflow:hidden}
.ap-hero h1 .ap-ln-i{display:block;transform:translateY(110%);animation:ap-rev .8s var(--ease) forwards}
.ap-hero h1 .ap-ln:nth-child(1) .ap-ln-i{animation-delay:.5s}
.ap-hero h1 .ap-ln:nth-child(2) .ap-ln-i{animation-delay:.7s;color:var(--gold)}
.ap-hero-sub{font-size:clamp(.9rem,1.8vw,1.1rem);color:var(--text-dim);max-width:520px;margin:0 auto 32px;opacity:0;animation:ap-up .8s var(--ease) 1.1s forwards}
.ap-hero-ctas{display:flex;gap:14px;justify-content:center;flex-wrap:wrap;opacity:0;animation:ap-up .8s var(--ease) 1.3s forwards}
.ap-btn{background:var(--gold);color:var(--bg);padding:15px 36px;font-family:var(--font-h);font-size:1.1rem;letter-spacing:3px;border:none;cursor:pointer;transition:all .3s var(--ease);display:inline-flex;align-items:center;gap:8px}
.ap-btn:hover{background:var(--gold-hover);transform:translateY(-3px);box-shadow:0 12px 40px var(--gold-glow);color:var(--bg)}
.ap-btn-o{border:1px solid var(--gold);color:var(--gold);padding:15px 36px;font-family:var(--font-h);font-size:1.1rem;letter-spacing:3px;background:transparent;cursor:pointer;transition:all .3s var(--ease);display:inline-flex;align-items:center;gap:8px}
.ap-btn-o:hover{background:var(--gold);color:var(--bg);transform:translateY(-3px)}
.ap-hero-stats{display:flex;justify-content:center;gap:clamp(20px,5vw,56px);margin-top:44px;opacity:0;animation:ap-up .8s var(--ease) 1.5s forwards}
.ap-stat-n{font-family:var(--font-h);font-size:clamp(1.8rem,4.5vw,2.8rem);color:var(--gold);line-height:1}
.ap-stat-l{font-size:.75rem;color:var(--text-dim);text-transform:uppercase;letter-spacing:2px;margin-top:4px}
.ap-hero-ph{margin-top:24px;opacity:0;animation:ap-up .8s var(--ease) 1.7s forwards}
.ap-hero-ph a{font-family:var(--font-h);font-size:clamp(1rem,2.5vw,1.4rem);color:var(--gold);letter-spacing:3px}

@keyframes ap-rev{to{transform:translateY(0)}}
@keyframes ap-up{to{opacity:1;transform:translateY(0)}}

/* ═══ SCROLL ANIM ═══ */
.ap-pop{opacity:0;transform:translateY(28px);transition:all .6s var(--ease)}
.ap-vis{opacity:1;transform:none}

/* ═══ SECTION COMMON ═══ */
.ap-label{font-family:var(--font-accent);font-style:italic;color:var(--gold);font-size:1rem;margin-bottom:8px;letter-spacing:1px}
.ap-title{font-family:var(--font-h);font-size:clamp(2rem,5vw,3.2rem);letter-spacing:3px;margin-bottom:24px}

/* ═══ ABOUT ═══ */
.ap-about{padding:clamp(60px,10vw,120px) 20px;max-width:var(--max);margin:0 auto}
.ap-about-grid{display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:center}
.ap-about-text p{color:var(--text-dim);margin-bottom:14px;font-size:clamp(.88rem,1.4vw,1.02rem)}
.ap-about-text p strong{color:var(--text)}
.ap-about-sig{font-family:var(--font-accent);font-style:italic;color:var(--gold);font-size:1.3rem;margin-top:18px}
.ap-about-img{position:relative;aspect-ratio:4/5;overflow:hidden;border:1px solid rgba(200,149,46,.2)}
.ap-about-img::before{content:'';position:absolute;top:-1px;left:50%;transform:translateX(-50%);width:60%;height:2px;background:linear-gradient(90deg,transparent,var(--gold),transparent)}
.ap-about-img img{width:100%;height:100%;object-fit:cover}

/* ═══ SERVICES ═══ */
.ap-svc{padding:clamp(60px,10vw,120px) 20px;background:var(--bg2)}
.ap-svc-inner{max-width:var(--max);margin:0 auto}
.ap-svc-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:36px}
.ap-svc-card{background:var(--bg);border:1px solid rgba(200,149,46,.12);overflow:hidden;transition:all .4s var(--ease);position:relative}
.ap-svc-card::before{content:'';position:absolute;top:0;left:0;width:100%;height:2px;background:var(--gold);transform:scaleX(0);transform-origin:left;transition:transform .4s var(--ease);z-index:1}
.ap-svc-card:hover::before{transform:scaleX(1)}
.ap-svc-card:hover{border-color:var(--gold);transform:translateY(-4px)}
.ap-svc-img{width:100%;aspect-ratio:16/10;object-fit:cover;display:block}
.ap-svc-body{padding:24px 20px}
.ap-svc-card h3{font-family:var(--font-h);font-size:1.3rem;letter-spacing:2px;margin-bottom:8px}
.ap-svc-card p{color:var(--text-dim);font-size:.85rem;line-height:1.6}

/* ═══ CTA ═══ */
.ap-cta{position:relative;padding:clamp(80px,12vw,140px) 20px;text-align:center;overflow:hidden}
.ap-cta-bg{position:absolute;inset:0;background-size:cover;background-position:center}
.ap-cta-overlay{position:absolute;inset:0;background:rgba(5,5,5,.88)}
.ap-cta-inner{position:relative;z-index:1;max-width:680px;margin:0 auto}
.ap-cta h2{font-family:var(--font-h);font-size:clamp(2.2rem,6vw,4.5rem);letter-spacing:4px;margin-bottom:14px}
.ap-cta h2 span{color:var(--gold)}
.ap-cta p{color:var(--text-dim);font-size:clamp(.9rem,1.8vw,1.1rem);margin-bottom:32px}
.ap-cta .ap-btn{font-size:1.3rem;padding:18px 48px}
.ap-cta-ph{margin-top:20px}
.ap-cta-ph a{font-family:var(--font-h);font-size:1.2rem;color:var(--gold);letter-spacing:3px}
.ap-cta-urg{font-size:.8rem;color:var(--text-dim);margin-top:14px;text-transform:uppercase;letter-spacing:2px}

/* ═══ FOOTER ═══ */
.ap-footer{padding:36px 20px;border-top:1px solid rgba(200,149,46,.15);text-align:center}
.ap-footer p{color:var(--text-dim);font-size:.82rem}
.ap-footer a{color:var(--gold)}

/* ═══ DEMO BANNER ═══ */
.ap-demo-bar{position:fixed;bottom:0;left:0;width:100%;background:var(--gold);color:var(--bg);text-align:center;padding:10px 20px;font-family:var(--font-h);font-size:.95rem;letter-spacing:2px;z-index:9999}
.ap-demo-bar a{color:var(--bg);text-decoration:underline}

/* ═══ MOBILE ═══ */
@media(max-width:768px){
  .ap-ham{display:flex}
  .ap-nav-links{position:fixed;top:0;right:-100%;width:260px;height:100vh;background:var(--bg2);flex-direction:column;justify-content:center;padding:40px;gap:22px;transition:right .4s var(--ease);z-index:1001}
  .ap-nav-links.open{right:0}
  .ap-about-grid{grid-template-columns:1fr;gap:28px}
  .ap-about-img{max-height:320px}
  .ap-svc-grid{grid-template-columns:1fr}
  .ap-hero-ctas{flex-direction:column;align-items:center}
  .ap-btn,.ap-btn-o{width:100%;max-width:300px;justify-content:center}
}
@media(min-width:769px) and (max-width:1024px){
  .ap-svc-grid{grid-template-columns:repeat(2,1fr)}
}
</style>
</head>
<body>

<!-- Progress Bar -->
<div class="ap-progress"></div>

<!-- Nav -->
<nav class="ap-nav">
  <div class="ap-nav-inner">
    <div class="ap-logo">${escHTML(biz.split(' ').slice(0, -1).join(' '))} <span>${escHTML(biz.split(' ').slice(-1)[0])}</span></div>
    <div class="ap-nav-links">
      <a href="#about">About</a>
      <a href="#services">Services</a>
      <a href="#contact">Contact</a>
      ${phoneClean ? `<a href="tel:${phoneClean}" class="ap-nav-cta">CALL NOW</a>` : '<a href="#contact" class="ap-nav-cta">GET STARTED</a>'}
    </div>
    <div class="ap-ham" role="button" tabindex="0" aria-label="Menu">
      <span></span><span></span><span></span>
    </div>
  </div>
</nav>

<!-- Hero -->
<section class="ap-hero">
  <div class="ap-hero-bg" ${hero ? `style="background-image:url('${hero}')"` : `style="background:radial-gradient(ellipse at center,var(--bg3),var(--bg))"`}></div>
  <div class="ap-hero-overlay"></div>
  <div class="ap-hero-content">
    <div class="ap-hero-label">${escHTML(copy.verb.charAt(0).toUpperCase() + copy.verb.slice(1))} Studio — ${escHTML(location)}</div>
    <h1>
      <span class="ap-ln"><span class="ap-ln-i">${escHTML(copy.tagline.split(',')[0].split('.')[0])}</span></span>
      <span class="ap-ln"><span class="ap-ln-i">${escHTML(copy.tagline.includes(',') ? copy.tagline.split(',').slice(1).join(',').trim() : copy.tagline.split('.').slice(1).join('.').trim() || escHTML(location))}</span></span>
    </h1>
    <p class="ap-hero-sub">${escHTML(copy.sub)}</p>
    <div class="ap-hero-ctas">
      ${phoneClean ? `<a href="tel:${phoneClean}" class="ap-btn">&#9742; BOOK NOW</a>` : '<a href="#contact" class="ap-btn">GET STARTED</a>'}
      <a href="#services" class="ap-btn-o">OUR SERVICES</a>
    </div>
    <div class="ap-hero-stats">
      <div><div class="ap-stat-n">10+</div><div class="ap-stat-l">Years Experience</div></div>
      <div><div class="ap-stat-n">500+</div><div class="ap-stat-l">Happy Clients</div></div>
      <div><div class="ap-stat-n">5.0</div><div class="ap-stat-l">★ Rating</div></div>
    </div>
    ${phoneClean ? `<div class="ap-hero-ph"><a href="tel:${phoneClean}">&#9742; ${escHTML(phone)}</a></div>` : ''}
  </div>
</section>

<!-- About -->
<section class="ap-about" id="about">
  <div class="ap-about-grid">
    <div class="ap-about-text ap-pop">
      <div class="ap-label">${owner ? 'Meet the Owner' : 'About Us'}</div>
      <h2 class="ap-title">${owner ? `MEET ${escHTML(owner.toUpperCase())}` : `ABOUT ${escHTML(biz.toUpperCase())}`}</h2>
      <p><strong>${escHTML(owner || biz)}</strong> has been serving ${escHTML(city || 'the community')} with professional ${escHTML(copy.verb)} services built on quality, trust, and attention to detail.</p>
      <p>Every project starts with understanding what you need. Whether it's your first time or you've been a loyal client for years, you get the same level of care and craftsmanship — no shortcuts, no excuses.</p>
      <p>We believe in earning your business every single time. That's why our clients keep coming back — and keep telling their friends.</p>
      ${owner ? `<div class="ap-about-sig">— ${escHTML(owner)}, Owner</div>` : ''}
    </div>
    <div class="ap-about-img ap-pop">
      ${about ? `<img src="${about}" alt="${escHTML(aboutAlt)}" loading="lazy">` : ''}
    </div>
  </div>
</section>

<!-- Services -->
<section class="ap-svc" id="services">
  <div class="ap-svc-inner">
    <div class="ap-label ap-pop">What We Do</div>
    <h2 class="ap-title ap-pop">OUR SERVICES</h2>
    <div class="ap-svc-grid">
${copy.services.map((s, i) => `      <div class="ap-svc-card ap-pop">
        ${svc[i % 3] ? `<img class="ap-svc-img" src="${svc[i % 3]}" alt="${escHTML(s)}" loading="lazy">` : '<div class="ap-svc-img" style="background:var(--bg3)"></div>'}
        <div class="ap-svc-body">
          <h3>${escHTML(s.toUpperCase())}</h3>
          <p>Professional ${escHTML(s.toLowerCase())} services delivered with precision and care. Contact us for a free estimate.</p>
        </div>
      </div>`).join('\n')}
    </div>
  </div>
</section>

<!-- CTA -->
<section class="ap-cta" id="contact">
  <div class="ap-cta-bg" ${cta ? `style="background-image:url('${cta}')"` : ''}></div>
  <div class="ap-cta-overlay"></div>
  <div class="ap-cta-inner ap-pop">
    <h2>READY TO <span>GET STARTED?</span></h2>
    <p>${phoneClean ? 'Call now for a free consultation — or stop by and see us in person.' : 'Reach out today for a free consultation. We\'d love to hear from you.'}</p>
    ${phoneClean ? `<a href="tel:${phoneClean}" class="ap-btn">&#9742; CALL NOW</a>` : '<a href="#" class="ap-btn">CONTACT US</a>'}
    ${phoneClean ? `<div class="ap-cta-ph"><a href="tel:${phoneClean}">${escHTML(phone)}</a></div>` : ''}
    <div class="ap-cta-urg">${escHTML(location)} — Serving the Community</div>
  </div>
</section>

<!-- Footer -->
<footer class="ap-footer">
  <div>
    <p>&copy; ${new Date().getFullYear()} ${escHTML(biz)}. All rights reserved. ${escHTML(location)}. ${phoneClean ? `<a href="tel:${phoneClean}">${escHTML(phone)}</a>` : ''}</p>
    <p style="margin-top:6px;font-size:.72rem;color:rgba(240,234,224,.3)">Built by <a href="https://herrmanonlineoutlook.com" target="_blank" rel="noopener">HOO</a></p>
  </div>
</footer>

<!-- Demo Banner -->
<div class="ap-demo-bar">DEMO PREVIEW — Built free by <a href="https://herrmanonlineoutlook.com">HOO</a> | Build free, pay on approval</div>

<script>
(function(){
  var prog=document.querySelector('.ap-progress'),nav=document.querySelector('.ap-nav');
  window.addEventListener('scroll',function(){
    var s=window.scrollY,h=document.documentElement.scrollHeight-window.innerHeight;
    prog.style.width=(s/h*100)+'%';
    nav.classList.toggle('scrolled',s>60);
  },{passive:true});

  var ham=document.querySelector('.ap-ham'),links=document.querySelector('.ap-nav-links');
  ham.addEventListener('click',function(){links.classList.toggle('open')});
  ham.addEventListener('keydown',function(e){if(e.key==='Enter')links.classList.toggle('open')});
  links.querySelectorAll('a').forEach(function(a){a.addEventListener('click',function(){links.classList.remove('open')})});

  var pops=document.querySelectorAll('.ap-pop');
  if('IntersectionObserver' in window){
    var io=new IntersectionObserver(function(entries){
      entries.forEach(function(e,i){if(e.isIntersecting){setTimeout(function(){e.target.classList.add('ap-vis')},i*80);io.unobserve(e.target)}});
    },{threshold:.1});
    pops.forEach(function(p){io.observe(p)});
  }else{pops.forEach(function(p){p.classList.add('ap-vis')})}
})();
</script>

</body>
</html>`;
}

// ── HTML ESCAPE ───────────────────────────────────────────────────────────────
function escHTML(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── MAIN BUILD ────────────────────────────────────────────────────────────────
async function buildPrototype(leadPath) {
  // Load lead
  let lead;
  try {
    lead = JSON.parse(fs.readFileSync(leadPath, 'utf8'));
  } catch (err) {
    console.error(`❌  Cannot read lead file: ${err.message}`);
    return null;
  }

  const biz      = lead.business || lead.business_name || 'demo';
  const industry = (lead.industry || '').toLowerCase();
  const leadId   = lead.id || 'XXXX';

  console.log(`\n🏗️  Auto-Prototype: ${biz}`);
  console.log(`   Industry: ${industry}`);
  console.log(`   City: ${lead.city || 'N/A'}`);
  console.log(`   Owner: ${lead.owner_name || 'N/A'}`);

  // Fetch photos
  console.log(`\n📸  Fetching 6 photos from Pexels for "${industry}"...`);
  let photos = [];
  try {
    photos = await getPhotos(industry || 'small business', 6);
    console.log(`   ✅  Got ${photos.length} photos`);
  } catch (err) {
    console.warn(`   ⚠️  Pexels failed: ${err.message} — building with gradients`);
  }

  // Build HTML
  console.log('\n🔨  Building demo page...');
  const html = buildHTML(lead, photos);

  // Save
  if (!fs.existsSync(OUTPUTS_DIR)) fs.mkdirSync(OUTPUTS_DIR, { recursive: true });
  const filename = `LEAD-${leadId}-${slugify(biz)}.html`;
  const filepath = path.join(OUTPUTS_DIR, filename);
  fs.writeFileSync(filepath, html, 'utf8');

  const sizeKB = (Buffer.byteLength(html) / 1024).toFixed(1);
  console.log(`\n✅  Demo saved: outputs/demos/${filename} (${sizeKB} KB)`);
  console.log(`   Full path: ${filepath}`);

  // Send email if --send
  if (IS_SEND) {
    if (!lead.email) {
      console.log('\n⚠️  --send requested but lead has no email address.');
    } else {
      console.log(`\n📧  ${IS_LIVE ? 'Sending' : 'Preview: would send'} demo notification to ${lead.email}...`);

      // Build custom email
      const emailBody = [
        `Hi ${lead.owner_name || 'there'},`,
        '',
        `I noticed ${biz} doesn't have a website — so I built you one.`,
        '',
        `It's a full demo, ready to go. Built free, no strings.`,
        '',
        `Want to see it? Reply here or call me: (804) 957-1003`,
        '',
        `— Matthew Herrman`,
        `HOO — Build Free, Pay on Approval`,
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

          console.log(`   ✅  Email sent to ${lead.email} [${info.messageId}]`);

          // Log it
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
          console.error(`   ❌  Email failed: ${err.message}`);
        }
      } else {
        console.log('\n─── EMAIL PREVIEW ───');
        console.log(`TO:      ${lead.email}`);
        console.log(`SUBJECT: Built something for ${biz}`);
        console.log('─── BODY ───');
        console.log(emailBody);
        console.log('────────────');
        console.log('\n🔒  DRY RUN — add --live to actually send.');
      }
    }
  }

  return { filepath, filename, photos: photos.length };
}

// ── TEST LEAD ─────────────────────────────────────────────────────────────────
function createTestLead() {
  return {
    id:            'TEST-001',
    business:      'Tattoos by Glendon',
    business_name: 'Tattoos by Glendon',
    owner_name:    'Glendon Thomas',
    industry:      'tattoo',
    city:          'Liberty',
    state:         'MO',
    phone:         '(816) 569-4465',
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
      console.log('\n🧪  Test mode — using fake tattoo shop lead\n');
      const lead = createTestLead();
      const tmpFile = path.join(OUTPUTS_DIR, '_test-lead.json');
      if (!fs.existsSync(OUTPUTS_DIR)) fs.mkdirSync(OUTPUTS_DIR, { recursive: true });
      fs.writeFileSync(tmpFile, JSON.stringify(lead, null, 2));
      await buildPrototype(tmpFile);
      fs.unlinkSync(tmpFile); // cleanup temp file
      break;
    }

    default:
      console.log(`
\x1b[33mHOO Auto-Prototype v1.0\x1b[0m — Lead → Photos → Demo Page → Email

Commands:
  build <lead.json>                   Build demo from lead file (dry run)
  build <lead.json> --send            Build + preview email to lead
  build <lead.json> --send --live     Build + actually send email
  test                                Build demo for fake tattoo shop lead

Pipeline:
  1. Read lead JSON (industry, city, owner, phone)
  2. Fetch 6 real photos from Pexels
  3. Build complete single-file HTML demo
  4. Save to outputs/demos/LEAD-{id}-{slug}.html
  5. Optionally email the lead

Output: outputs/demos/
      `);
  }
}

module.exports = { buildPrototype, createTestLead };

if (require.main === module) {
  main().catch(console.error);
}

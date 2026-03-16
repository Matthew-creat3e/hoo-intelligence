#!/usr/bin/env python3
"""
HOO Lead Hunter v3.0 — Powered by Crawl4AI
Replaces Puppeteer scraping that Google blocks.
Free. No API key. No rate limits. Stealth mode built in.
50,000+ star open source project — maintained and growing.

Install once:
  pip install crawl4ai playwright
  playwright install chromium

Usage:
  python lead-hunter-v3.py hunt "cleaning" "Independence MO"
  python lead-hunter-v3.py maps "tattoo" "Liberty MO"
  python lead-hunter-v3.py batch
  python lead-hunter-v3.py scan https://example.com
  python lead-hunter-v3.py enrich LEAD-011-tattoo-liberty.json
"""

import asyncio, json, sys, re, os
from datetime import datetime
from pathlib import Path

# Fix Windows console encoding for emoji output
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

try:
    from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig
    from crawl4ai.extraction_strategy import JsonCssExtractionStrategy
except ImportError:
    print("Run: pip install crawl4ai playwright && playwright install chromium")
    sys.exit(1)

# ── CONFIG ─────────────────────────────────────────────────────────────────────
BASE        = Path(r"C:\Users\Matth\hoo-workspace")
LEADS_DIR   = BASE / "engine" / "leads"
ENRICH_DIR  = LEADS_DIR / "needs-enrichment"
LEARNING    = BASE / "engine" / "data" / "learning.json"
LEADS_DIR.mkdir(parents=True, exist_ok=True)
ENRICH_DIR.mkdir(parents=True, exist_ok=True)
(BASE / "engine" / "data").mkdir(parents=True, exist_ok=True)

CITIES = [
    "Independence MO", "Blue Springs MO", "Lee's Summit MO",
    "Grain Valley MO", "Raytown MO", "Belton MO", "Liberty MO",
    "Grandview MO", "Pleasant Hill MO", "Oak Grove MO",
    "Kansas City MO", "Kansas City KS", "Overland Park KS"
]

INDUSTRIES = [
    "cleaning", "lawn care", "handyman", "painting", "landscaping",
    "moving", "auto detailing", "pressure washing", "pet grooming",
    "tattoo", "food truck", "roofing", "fencing", "personal training",
    "barber", "photography", "junk removal", "mobile mechanic"
]

PRIORITY_COMBOS = [
    ("tattoo",           "Liberty MO"),
    ("fencing",          "Grain Valley MO"),
    ("food truck",       "Grandview MO"),
    ("cleaning",         "Independence MO"),
    ("landscaping",      "Belton MO"),
    ("lawn care",        "Blue Springs MO"),
    ("handyman",         "Lee's Summit MO"),
    ("auto detailing",   "Kansas City MO"),
    ("pressure washing", "Overland Park KS"),
    ("photography",      "Independence MO"),
    ("barber",           "Raytown MO"),
    ("pet grooming",     "Liberty MO"),
    ("roofing",          "Lee's Summit MO"),
    ("painting",         "Grain Valley MO"),
    ("junk removal",     "Kansas City MO"),
]

# ── STEALTH BROWSER ────────────────────────────────────────────────────────────
def browser_cfg():
    return BrowserConfig(
        headless=True,
        browser_type="chromium",
        viewport_width=1280,
        viewport_height=800,
        user_agent=(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/122.0.0.0 Safari/537.36"
        ),
        extra_args=[
            "--disable-blink-features=AutomationControlled",
            "--no-sandbox",
            "--disable-dev-shm-usage",
            "--disable-web-security",
        ]
    )

# ── SCORING ────────────────────────────────────────────────────────────────────
def score_lead(d: dict) -> int:
    s = 0
    if d.get("no_website"):        s += 30
    if d.get("owner_name"):        s += 20
    if d.get("phone"):             s += 20
    if d.get("email"):             s += 15
    if d.get("has_reviews"):       s += 10
    if d.get("years_established"): s += 5
    return min(s, 100)

def tier(score: int) -> str:
    if score >= 50: return "HOT"
    if score >= 30: return "WARM"
    return "COLD"

# ── INDUSTRY SPREAD ────────────────────────────────────────────────────────────
def count_leads_by_industry() -> dict:
    """Scan engine/leads/ filenames to count leads per industry."""
    counts = {ind: 0 for ind in INDUSTRIES}
    # Check both main dir and needs-enrichment subdir
    for search_dir in [LEADS_DIR, ENRICH_DIR]:
        for f in search_dir.glob("LEAD-*.json"):
            name = f.stem.lower()
            for ind in INDUSTRIES:
                slug = ind.replace(" ", "-")
                if f"-{slug}-" in name:
                    counts[ind] = counts.get(ind, 0) + 1
                    break
    return counts

def prioritize_industries() -> list:
    """Sort industries by fewest existing leads first. Underrepresented go first."""
    counts = count_leads_by_industry()
    total  = max(sum(counts.values()), 1)
    print(f"\n📊  Industry Spread (total: {total} leads)")
    sorted_inds = sorted(counts.items(), key=lambda x: x[1])
    for ind, cnt in sorted_inds:
        pct = cnt / total * 100
        bar = "█" * int(pct / 3) if pct > 0 else "░"
        cap = " ⚠️  AT CAP" if pct >= 30 else ""
        print(f"    {ind:<20} {cnt:>3} ({pct:4.1f}%) {bar}{cap}")
    return sorted_inds

def get_priority_combos() -> list:
    """Build hunt list: underrepresented industries first, skip any at 30% cap."""
    sorted_inds = prioritize_industries()
    total = max(sum(c for _, c in sorted_inds), 1)

    # Build a city rotation for each industry
    import random
    combos = []
    for ind, cnt in sorted_inds:
        pct = cnt / total * 100 if total > 0 else 0
        if pct >= 30:
            print(f"  ⏭️  Skipping {ind} — at 30% cap ({pct:.1f}%)")
            continue
        # Check if there's a hardcoded priority combo for this industry
        matched_city = None
        for pi, pc in PRIORITY_COMBOS:
            if pi == ind:
                matched_city = pc
                break
        if matched_city:
            combos.append((ind, matched_city))
        else:
            # Pick a random city
            combos.append((ind, random.choice(CITIES)))

    print(f"\n🎯  Hunt order: {len(combos)} industries (fewest leads first)")
    for i, (ind, city) in enumerate(combos[:5], 1):
        print(f"    {i}. {ind} → {city}")
    if len(combos) > 5:
        print(f"    ... +{len(combos) - 5} more")
    return combos

# ── HELPERS ────────────────────────────────────────────────────────────────────
def next_id() -> str:
    """Get next lead ID — checks both main and needs-enrichment dirs."""
    all_files = list(LEADS_DIR.glob("LEAD-*.json")) + list(ENRICH_DIR.glob("LEAD-*.json"))
    if not all_files: return "001"
    nums = [int(m.group(1)) for f in all_files if (m := re.match(r"LEAD-(\d+)", f.name))]
    return str(max(nums) + 1).zfill(3) if nums else "001"

def already_exists(name: str) -> bool:
    for search_dir in [LEADS_DIR, ENRICH_DIR]:
        for f in search_dir.glob("LEAD-*.json"):
            try:
                if json.loads(f.read_text()).get("business","").lower() == name.lower():
                    return True
            except: pass
    return False

def categorize_lead(d: dict) -> dict:
    """Categorize lead by contact info availability."""
    has_email   = bool(d.get("email"))
    has_website = bool(d.get("website_url"))

    if has_email:
        d["outreach_ready"]    = True
        d["needs_enrichment"]  = False
        d["category"]          = "ready"
    elif has_website:
        d["outreach_ready"]    = False
        d["needs_enrichment"]  = True
        d["category"]          = "has-website-no-email"
    else:
        d["outreach_ready"]    = False
        d["needs_enrichment"]  = True
        d["category"]          = "needs-contact-info"
    return d

def save_lead(d: dict) -> Path:
    lead_id  = next_id()
    d["id"]  = lead_id
    industry = d.get("industry","unknown").lower().replace(" ","-")
    city     = d.get("city","unknown").lower().replace(" ","-").replace("'","")
    fname    = f"LEAD-{lead_id}-{industry}-{city}.json"
    d["filename"]   = fname
    d["found_date"] = datetime.now().strftime("%Y-%m-%d")

    # Categorize before saving
    d = categorize_lead(d)

    # Decide save location: has email or website → main dir, neither → needs-enrichment
    has_email   = bool(d.get("email"))
    has_website = bool(d.get("website_url"))

    if has_email or has_website:
        save_dir = LEADS_DIR
        tag = "📧" if has_email else "🌐"
    else:
        save_dir = ENRICH_DIR
        tag = "📁"

    path = save_dir / fname
    path.write_text(json.dumps(d, indent=2))
    cat_label = d.get("category", "?")
    print(f"  {tag}  {fname}  [Score:{d.get('score',0)} {d.get('tier','?')}] [{cat_label}]")
    return path

# ── DEBUG LOG ─────────────────────────────────────────────────────────────────
DEBUG_LOG = BASE / "engine" / "data" / "scrape-debug.log"

def debug_log(source: str, industry: str, city: str, md: str):
    """Log first 500 chars of raw markdown for debugging empty scrapes."""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    snippet = md[:500].replace('\n', '\\n') if md else "(EMPTY)"
    entry = f"[{timestamp}] {source} | {industry} | {city} | len={len(md)} | {snippet}\n{'='*80}\n"
    try:
        with open(DEBUG_LOG, "a", encoding="utf-8") as f:
            f.write(entry)
    except: pass

# ── EXTRACT BUSINESS NAMES FROM MARKDOWN ──────────────────────────────────────
def extract_businesses_from_md(md: str, industry: str, city: str, source: str) -> list:
    """Parse business names + phone numbers from crawled markdown."""
    parts = city.split()
    state = parts[-1] if len(parts) > 1 else "MO"
    city_only = " ".join(parts[:-1]) if len(parts) > 1 else city
    leads = []
    seen_names = set()

    # Extract all phone numbers from the full text for later matching
    all_phones = re.findall(r'\(?\d{3}\)?[\s\-\.]\d{3}[\s\-\.]\d{4}', md)

    # Strategy 1: Look for numbered listings (common in Yelp/BBB markdown)
    # Patterns like "1. Business Name" or "**Business Name**" or "### Business Name"
    numbered = re.findall(r'(?:^|\n)\s*\d+\.\s*\[?([A-Z][A-Za-z\s&\'\-\.]{3,55})\]?', md)
    bolded   = re.findall(r'\*\*([A-Z][A-Za-z\s&\'\-\.]{3,55})\*\*', md)
    headered = re.findall(r'#{1,4}\s*([A-Z][A-Za-z\s&\'\-\.]{3,55})', md)

    # Strategy 2: Lines that look like business names (capitalized, reasonable length)
    line_names = []
    for line in md.split("\n"):
        line = line.strip()
        if not line or len(line) < 4 or len(line) > 70: continue
        # Strip markdown syntax
        clean = re.sub(r'\[|\]|\(.*?\)|[#*_`>]|\d+\.', '', line).strip()
        if not clean or len(clean) < 4 or len(clean) > 60: continue
        # Must start with uppercase, look like a business name
        if re.match(r'^[A-Z]', clean) and not clean.startswith(('http', 'www.', 'Search', 'Filter', 'Sort', 'Map', 'Showing', 'Page', 'Next', 'Previous', 'Log', 'Sign', 'Write', 'Categories', 'Open', 'Closed', 'Price', 'Distance', 'Rating')):
            # Skip if it's a full sentence (too many lowercase words)
            words = clean.split()
            if len(words) <= 8:
                line_names.append(clean)

    # Combine all candidates, prioritize numbered > bolded > headered > line
    all_candidates = []
    for name in numbered + bolded + headered + line_names:
        name = name.strip().rstrip('.')
        if name and name not in seen_names and len(name) > 3:
            seen_names.add(name)
            all_candidates.append(name)

    # Build lead objects
    phone_idx = 0
    for name in all_candidates:
        if already_exists(name): continue
        # Try to find a nearby phone number
        phone = ""
        if phone_idx < len(all_phones):
            phone = all_phones[phone_idx]
            phone_idx += 1

        d = {
            "business": name, "owner_name": "", "phone": phone,
            "email": "", "city": city_only, "state": state,
            "industry": industry, "no_website": True,
            "website_url": None, "has_reviews": False,
            "stage": "found", "playbook": "no-website",
            "source": source, "notes": f"{source}: {industry} {city}"
        }
        d["score"] = score_lead(d)
        d["tier"]  = tier(d["score"])
        leads.append(d)
        if len(leads) >= 10: break

    return leads

# ── PRIMARY SEARCH — YELP → GOOGLE MAPS → BBB ───────────────────────────────
async def scrape_maps(industry: str, city: str) -> list:
    """Try Yelp first, fall back to Google Maps, then BBB."""
    leads = await scrape_yelp(industry, city)
    if leads:
        return leads

    print(f"  🔄  Yelp returned 0 — trying Google Maps...")
    leads = await scrape_google_maps(industry, city)
    if leads:
        return leads

    print(f"  🔄  Google Maps returned 0 — trying BBB...")
    leads = await scrape_bbb(industry, city)
    return leads

# ── YELP SCRAPER ──────────────────────────────────────────────────────────────
async def scrape_yelp(industry: str, city: str) -> list:
    city_slug = city.replace(" ", "-").replace("'", "").replace(",","")
    url = f"https://www.yelp.com/search?find_desc={industry.replace(' ','+')}&find_loc={city_slug}"
    print(f"  🍕  Yelp: {industry} in {city}")

    cfg = CrawlerRunConfig(
        js_code="await new Promise(r => setTimeout(r, 3000))",
        delay_before_return_html=3.0,
        cache_mode="bypass",
        word_count_threshold=10
    )

    try:
        async with AsyncWebCrawler(config=browser_cfg()) as crawler:
            res = await crawler.arun(url=url, config=cfg)
            if not res.success:
                print(f"  ⚠️  Yelp crawl failed")
                debug_log("yelp-FAIL", industry, city, "")
                return []

            md = res.markdown.raw_markdown if res.markdown else ""
            debug_log("yelp", industry, city, md)

            if not md or len(md) < 100:
                print(f"  ⚠️  Yelp returned thin content ({len(md)} chars)")
                return []

            leads = extract_businesses_from_md(md, industry, city, "yelp")
            print(f"  Found {len(leads)} via Yelp")
            return leads
    except Exception as e:
        print(f"  ⚠️  Yelp error: {e}")
        debug_log("yelp-ERROR", industry, city, str(e))
        return []

# ── GOOGLE MAPS SCRAPER ──────────────────────────────────────────────────────
async def scrape_google_maps(industry: str, city: str) -> list:
    query = f"{industry}+{city.replace(' ', '+')}"
    url = f"https://www.google.com/maps/search/{query}"
    print(f"  🗺️  Google Maps: {industry} in {city}")

    cfg = CrawlerRunConfig(
        js_code="await new Promise(r => setTimeout(r, 4000))",
        delay_before_return_html=3.0,
        cache_mode="bypass",
        word_count_threshold=10
    )

    try:
        async with AsyncWebCrawler(config=browser_cfg()) as crawler:
            res = await crawler.arun(url=url, config=cfg)
            if not res.success:
                print(f"  ⚠️  Google Maps crawl failed")
                debug_log("gmaps-FAIL", industry, city, "")
                return []

            md = res.markdown.raw_markdown if res.markdown else ""
            debug_log("gmaps", industry, city, md)

            if not md or len(md) < 100:
                print(f"  ⚠️  Google Maps returned thin content ({len(md)} chars)")
                return []

            # Google Maps markdown has business names, addresses, phones, ratings
            parts = city.split()
            state = parts[-1] if len(parts) > 1 else "MO"
            city_only = " ".join(parts[:-1]) if len(parts) > 1 else city
            leads = []

            # Extract phone numbers
            phones = re.findall(r'\(?\d{3}\)?[\s\-\.]\d{3}[\s\-\.]\d{4}', md)

            # Extract business names — Maps often has them as bold or linked text
            # Also look for rating patterns like "4.5(123)" near business names
            biz_patterns = re.findall(r'(?:^|\n)\s*\[?([A-Z][A-Za-z\s&\'\-\.]{3,50})\]?(?:\s*\(?\d+\.?\d*\s*(?:star|★|\())?', md)
            # Also try extracting from structured patterns
            biz_patterns += re.findall(r'\*\*([A-Z][A-Za-z\s&\'\-\.]{3,50})\*\*', md)

            # Google Maps UI text that gets scraped as "business names"
            GMAPS_JUNK = {
                'Drag to change', 'Saved', 'Recents', 'Get app', 'Hours',
                'Rating', 'All filters', 'Open', 'Open now', 'Closed',
                'Collapse side panel', 'Close', 'Results',
                'Update results when map moves', 'Sign in',
                'Get the most out of Google Maps', 'Prices come from',
                'Some of these hotel and vacation rental search resu',
            }

            seen = set()
            phone_idx = 0
            for name in biz_patterns:
                name = name.strip().rstrip('.')
                if not name or name in seen or len(name) < 4: continue
                if name.startswith(('Search', 'Filter', 'Map', 'Google', 'Directions', 'Results', 'Prices', 'Some of')): continue
                if name in GMAPS_JUNK or any(j in name for j in GMAPS_JUNK): continue
                # Skip generic category labels (e.g. "Plumber", "Handyman", "Tattoo shop", "Pet groomer")
                generic = ['service', 'shop', 'store', 'groomer', 'supply', 'Plumber', 'Handyman',
                           'Remodeler', 'Tattoo shop', 'Pet groomer', 'Lawn care service',
                           'Tattoo and piercing', 'Tattoo removal service', 'Pet supply']
                if name in generic or name.lower() in [g.lower() for g in generic]: continue
                if already_exists(name): continue
                seen.add(name)

                phone = phones[phone_idx] if phone_idx < len(phones) else ""
                phone_idx += 1

                d = {
                    "business": name, "owner_name": "", "phone": phone,
                    "email": "", "city": city_only, "state": state,
                    "industry": industry, "no_website": True,
                    "website_url": None, "has_reviews": False,
                    "stage": "found", "playbook": "no-website",
                    "source": "google-maps", "notes": f"Google Maps: {industry} {city}"
                }
                d["score"] = score_lead(d)
                d["tier"]  = tier(d["score"])
                leads.append(d)
                if len(leads) >= 10: break

            print(f"  Found {len(leads)} via Google Maps")
            return leads
    except Exception as e:
        print(f"  ⚠️  Google Maps error: {e}")
        debug_log("gmaps-ERROR", industry, city, str(e))
        return []

# ── BBB SCRAPER ───────────────────────────────────────────────────────────────
async def scrape_bbb(industry: str, city: str) -> list:
    city_slug = city.replace(" ", "+").replace("'", "")
    url = f"https://www.bbb.org/search?find_text={industry.replace(' ', '+')}&find_loc={city_slug}"
    print(f"  🏛️  BBB: {industry} in {city}")

    cfg = CrawlerRunConfig(
        js_code="await new Promise(r => setTimeout(r, 3000))",
        delay_before_return_html=3.0,
        cache_mode="bypass",
        word_count_threshold=10
    )

    try:
        async with AsyncWebCrawler(config=browser_cfg()) as crawler:
            res = await crawler.arun(url=url, config=cfg)
            if not res.success:
                print(f"  ⚠️  BBB crawl failed")
                debug_log("bbb-FAIL", industry, city, "")
                return []

            md = res.markdown.raw_markdown if res.markdown else ""
            debug_log("bbb", industry, city, md)

            if not md or len(md) < 100:
                print(f"  ⚠️  BBB returned thin content ({len(md)} chars)")
                return []

            leads = extract_businesses_from_md(md, industry, city, "bbb")
            print(f"  Found {len(leads)} via BBB")
            return leads
    except Exception as e:
        print(f"  ⚠️  BBB error: {e}")
        debug_log("bbb-ERROR", industry, city, str(e))
        return []

# ── QUICK URL SCAN ─────────────────────────────────────────────────────────────
async def scan_url(url: str) -> dict:
    print(f"\n🔬  Scanning: {url}")
    cfg = CrawlerRunConfig(cache_mode="bypass", screenshot=False, word_count_threshold=5)
    async with AsyncWebCrawler(config=browser_cfg()) as crawler:
        res = await crawler.arun(url=url, config=cfg)
    if not res.success:
        return {"url": url, "alive": False, "score": 0, "issues": ["Unreachable"]}

    md = res.markdown.raw_markdown if res.markdown else ""
    words = len(md.split())
    issues = []
    if words < 100:      issues.append("Thin content (<100 words)")
    if not re.search(r'\(?\d{3}\)?[\s\-\.]\d{3}[\s\-\.]\d{4}', md):
        issues.append("No phone number visible")
    if "contact" not in md.lower() and "email" not in md.lower():
        issues.append("No contact info")
    cta_words = ["call now","get a quote","book","schedule","order","contact us","free estimate"]
    if not any(w in md.lower() for w in cta_words):
        issues.append("No clear CTA")
    if not any(w in md.lower() for w in ["review","stars","rated","testimonial","★"]):
        issues.append("No social proof / reviews")
    if not any(w in md.lower() for w in ["years","since","founded","experience"]):
        issues.append("No trust indicators (years, experience)")

    quality = max(0, 100 - (len(issues) * 15))
    print(f"  Words:{words} | Issues:{len(issues)} | Quality:{quality}/100")
    for i in issues: print(f"  ⚠️   {i}")
    return {
        "url": url, "alive": True, "words": words,
        "issues": issues, "quality": quality,
        "pitch_candidate": quality < 60
    }

# ── ENRICH LEAD ────────────────────────────────────────────────────────────────
async def enrich_lead(filename: str):
    path = LEADS_DIR / filename
    if not path.exists():
        # Check needs-enrichment subdir too
        matches = list(LEADS_DIR.glob(f"*{filename}*")) + list(ENRICH_DIR.glob(f"*{filename}*"))
        if not matches:
            print(f"❌  Not found: {filename}")
            return
        path = matches[0]

    data = json.loads(path.read_text())
    was_in_enrich = path.parent == ENRICH_DIR
    print(f"\n🔍  Enriching: {data['business']}")
    if was_in_enrich:
        print(f"    (currently in needs-enrichment/)")

    search = f'"{data["business"]}" {data.get("city","")}'
    query  = search.replace(" ", "+")
    url    = f"https://www.google.com/search?q={query}"
    cfg    = CrawlerRunConfig(cache_mode="bypass", screenshot=False)

    async with AsyncWebCrawler(config=browser_cfg()) as crawler:
        res = await crawler.arun(url=url, config=cfg)

    md = res.markdown.raw_markdown if (res.success and res.markdown) else ""

    phones = re.findall(r'\(?\d{3}\)?[\s\-\.]\d{3}[\s\-\.]\d{4}', md)
    if phones and not data.get("phone"):
        data["phone"] = phones[0]
        print(f"  📞  {phones[0]}")

    emails = re.findall(r'[\w.\-]+@[\w.\-]+\.\w{2,}', md)
    emails = [e for e in emails if not e.endswith(('.png','.jpg','.gif'))]
    if emails and not data.get("email"):
        data["email"] = emails[0]
        print(f"  📧  {emails[0]}")

    # Look for owner name patterns
    owner_patterns = [
        r'(?:owner|founder|president|operator)[\s:]+([A-Z][a-z]+ [A-Z][a-z]+)',
        r'(?:by|from) ([A-Z][a-z]+ [A-Z][a-z]+)',
    ]
    for pat in owner_patterns:
        m = re.search(pat, md, re.IGNORECASE)
        if m and not data.get("owner_name"):
            data["owner_name"] = m.group(1)
            print(f"  👤  {m.group(1)}")
            break

    data["score"]        = score_lead(data)
    data["tier"]         = tier(data["score"])
    data["enriched"]     = True
    data["enriched_date"]= datetime.now().strftime("%Y-%m-%d")

    # Re-categorize after enrichment
    data = categorize_lead(data)

    # If lead was in needs-enrichment but now has email or website, promote to main dir
    if was_in_enrich and (data.get("email") or data.get("website_url")):
        new_path = LEADS_DIR / path.name
        new_path.write_text(json.dumps(data, indent=2))
        path.unlink()  # remove from needs-enrichment
        path = new_path
        print(f"  📤  Promoted to engine/leads/ (now {data['category']})")
    else:
        path.write_text(json.dumps(data, indent=2))

    print(f"  ✅  Score: {data['score']} ({data['tier']}) | Category: {data['category']}")

# ── BATCH HUNT ─────────────────────────────────────────────────────────────────
async def batch_hunt():
    print("\n🚀  HOO BATCH HUNT v3.1 — Crawl4AI + Industry Spread")
    print("="*55)

    # Dynamic priority: underrepresented industries go first
    combos = get_priority_combos()
    print(f"    {len(combos)} combos queued | Yelp scraping")
    print("="*55)

    all_leads = []
    # Track counts INCLUDING existing leads for 30% cap enforcement
    existing_counts = count_leads_by_industry()
    industry_counts = dict(existing_counts)
    city_counts = {}

    total_combos = len(combos)
    for combo_idx, (industry, city) in enumerate(combos, 1):
        print(f"\n[{combo_idx}/{total_combos}] 🔍  {industry} in {city}")
        leads = await scrape_maps(industry, city)
        for lead in leads:
            ind, cit = lead["industry"], lead["city"].strip().lower()
            # Running total includes existing + new leads
            new_ind_count = industry_counts.get(ind, 0) + 1
            city_counts[cit] = city_counts.get(cit, 0) + 1
            total_all = sum(industry_counts.values()) + len(all_leads) + 1
            if new_ind_count / total_all > 0.30:
                print(f"  ⏭️  Skip {lead['business']} — industry cap ({ind}: {new_ind_count}/{total_all} = {new_ind_count/total_all*100:.0f}%)")
                continue
            if city_counts[cit] > 8:
                print(f"  ⏭️  Skip {lead['business']} — city cap ({cit}: {city_counts[cit]}/8)")
                continue
            industry_counts[ind] = new_ind_count
            all_leads.append(lead)
            save_lead(lead)
        await asyncio.sleep(2)

    print(f"\n🏁  All {total_combos} combos processed. Done.")

    hot  = sorted([l for l in all_leads if l["tier"]=="HOT"],  key=lambda x:x["score"], reverse=True)
    warm = [l for l in all_leads if l["tier"]=="WARM"]
    cold = [l for l in all_leads if l["tier"]=="COLD"]

    # Categorization summary
    ready    = [l for l in all_leads if l.get("outreach_ready")]
    enrich   = [l for l in all_leads if l.get("needs_enrichment") and l.get("website_url")]
    no_contact = [l for l in all_leads if l.get("category") == "needs-contact-info"]

    print(f"\n{'='*55}")
    print(f"✅  BATCH COMPLETE: {len(all_leads)} leads")
    print(f"    HOT:{len(hot)}  WARM:{len(warm)}  COLD:{len(cold)}")
    print(f"\n📂  CATEGORIZATION:")
    print(f"    📧 Outreach-ready (has email):     {len(ready)}")
    print(f"    🌐 Has website, needs email:        {len(enrich)}")
    print(f"    📁 Needs enrichment (no contact):   {len(no_contact)} → engine/leads/needs-enrichment/")
    print(f"\n📋  TOP 5 — MATTHEW'S CALLS:")
    for i, l in enumerate(hot[:5], 1):
        phone = l.get("phone","no phone yet")
        print(f"  {i}. {l['business']} | {l['city']} | {phone} | {l['score']}pts")
        print(f"     Hook: 'I noticed {l['business']} doesn't have a website —")
        print(f"            I built you one, free to see.'")

    _update_learning(all_leads)
    _generate_batch_sheet(hot)
    return all_leads

# ── CALL SHEET ─────────────────────────────────────────────────────────────────
def _generate_batch_sheet(hot_leads: list):
    if not hot_leads: return
    today = datetime.now().strftime("%Y-%m-%d")
    lines = [f"# HOO Call Sheet — {today}\n",
             f"Generated {len(hot_leads)} HOT leads\n\n"]
    for i, l in enumerate(hot_leads, 1):
        lines.append(f"## {i}. {l['business']}")
        lines.append(f"- **City:** {l['city']} | **Industry:** {l['industry']}")
        lines.append(f"- **Phone:** {l.get('phone','NEEDS ENRICH')}")
        lines.append(f"- **Owner:** {l.get('owner_name','unknown')}")
        lines.append(f"- **Score:** {l['score']} ({l['tier']})")
        lines.append(f"- **File:** {l.get('filename','?')}\n")
        lines.append(f"**Opening line:**")
        lines.append(f"> \"Hey, is this the owner? This is Matthew from HOO.")
        lines.append(f">  I noticed {l['business']} doesn't have a website.")
        lines.append(f">  I went ahead and built you one — completely free to see.")
        lines.append(f">  Takes two minutes. Can I send you the link?\"\n")
        lines.append("---\n")

    sheet_path = LEADS_DIR / f"BATCH-{today}-callsheet.md"
    sheet_path.write_text("\n".join(lines))
    print(f"\n📋  Call sheet saved: {sheet_path.name}")

# ── LEARNING ───────────────────────────────────────────────────────────────────
def _update_learning(leads: list):
    try:
        data = json.loads(LEARNING.read_text()) if LEARNING.exists() else {}
    except: data = {}
    today = datetime.now().strftime("%Y-%m-%d")
    if "hunts" not in data: data["hunts"] = []
    data["hunts"].append({
        "date":  today,
        "found": len(leads),
        "hot":   len([l for l in leads if l["tier"]=="HOT"]),
        "warm":  len([l for l in leads if l["tier"]=="WARM"]),
        "industries": list({l["industry"] for l in leads}),
        "cities":     list({l["city"] for l in leads}),
    })
    LEARNING.write_text(json.dumps(data, indent=2))

# ── CLI ────────────────────────────────────────────────────────────────────────
async def main():
    args = sys.argv[1:]
    if not args:
        print("HOO Lead Hunter v3.1 — Crawl4AI + Industry Spread + Lead Categorization")
        print("Commands:")
        print("  hunt [industry] [city]   Single industry hunt")
        print("  maps [industry] [city]   Alias for hunt")
        print("  batch                    Smart batch — hunts underrepresented industries first")
        print("  scan [url]               Scan a website for quality issues")
        print("  enrich [filename]        Enrich a lead with Google search data")
        print("  spread                   Show industry balance / lead counts")
        return

    cmd = args[0].lower()
    if cmd in ("hunt", "maps") and len(args) >= 3:
        industry, city = args[1], " ".join(args[2:])
        leads = await scrape_maps(industry, city)
        for l in leads: save_lead(l)
        # Summary
        ready = [l for l in leads if l.get("outreach_ready")]
        enrich = [l for l in leads if not l.get("outreach_ready")]
        print(f"\nSaved {len(leads)} leads: {len(ready)} outreach-ready, {len(enrich)} need enrichment")
    elif cmd == "batch":
        await batch_hunt()
    elif cmd == "scan" and len(args) >= 2:
        await scan_url(args[1])
    elif cmd == "enrich" and len(args) >= 2:
        await enrich_lead(args[1])
    elif cmd == "spread":
        sorted_inds = prioritize_industries()
        total = sum(c for _, c in sorted_inds)
        enrich_count = len(list(ENRICH_DIR.glob("LEAD-*.json")))
        print(f"\n    Total leads: {total}")
        print(f"    In needs-enrichment/: {enrich_count}")
        print(f"    In engine/leads/:     {total - enrich_count}")
    else:
        print("Unknown command. Run without args for help.")

if __name__ == "__main__":
    asyncio.run(main())
    sys.exit(0)

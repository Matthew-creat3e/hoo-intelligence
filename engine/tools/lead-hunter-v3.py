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

try:
    from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig
    from crawl4ai.extraction_strategy import JsonCssExtractionStrategy
except ImportError:
    print("Run: pip install crawl4ai playwright && playwright install chromium")
    sys.exit(1)

# ── CONFIG ─────────────────────────────────────────────────────────────────────
BASE        = Path(r"C:\Users\Matth\hoo-workspace")
LEADS_DIR   = BASE / "engine" / "leads"
LEARNING    = BASE / "engine" / "data" / "learning.json"
LEADS_DIR.mkdir(parents=True, exist_ok=True)
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

# ── HELPERS ────────────────────────────────────────────────────────────────────
def next_id() -> str:
    existing = list(LEADS_DIR.glob("LEAD-*.json"))
    if not existing: return "001"
    nums = [int(m.group(1)) for f in existing if (m := re.match(r"LEAD-(\d+)", f.name))]
    return str(max(nums) + 1).zfill(3) if nums else "001"

def already_exists(name: str) -> bool:
    for f in LEADS_DIR.glob("LEAD-*.json"):
        try:
            if json.loads(f.read_text()).get("business","").lower() == name.lower():
                return True
        except: pass
    return False

def save_lead(d: dict) -> Path:
    lead_id  = next_id()
    d["id"]  = lead_id
    industry = d.get("industry","unknown").lower().replace(" ","-")
    city     = d.get("city","unknown").lower().replace(" ","-").replace("'","")
    fname    = f"LEAD-{lead_id}-{industry}-{city}.json"
    d["filename"]   = fname
    d["found_date"] = datetime.now().strftime("%Y-%m-%d")
    path = LEADS_DIR / fname
    path.write_text(json.dumps(d, indent=2))
    print(f"  ✅  {fname}  [Score:{d.get('score',0)} {d.get('tier','?')}]")
    return path

# ── GOOGLE MAPS SCRAPE ─────────────────────────────────────────────────────────
async def scrape_maps(industry: str, city: str) -> list:
    query = f"{industry} {city}"
    url   = f"https://www.google.com/maps/search/{query.replace(' ','+')}"
    print(f"\n🗺️   Google Maps: {query}")

    schema = JsonCssExtractionStrategy(schema={
        "name": "businesses",
        "baseSelector": "div[data-result-index]",
        "fields": [
            {"name":"name",    "selector":".qBF1Pd",              "type":"text"},
            {"name":"rating",  "selector":".MW4etd",              "type":"text"},
            {"name":"reviews", "selector":".UY7F9",               "type":"text"},
            {"name":"address", "selector":".W4Efsd:last-child",   "type":"text"},
            {"name":"website", "selector":"a[data-item-id='authority']","type":"attribute","attribute":"href"},
            {"name":"phone",   "selector":"[data-tooltip='Copy phone number']","type":"text"},
        ]
    })

    cfg = CrawlerRunConfig(
        extraction_strategy=schema,
        wait_for="div[data-result-index]",
        delay_before_return_html=3.0,
        js_code="window.scrollTo(0, document.body.scrollHeight);",
        cache_mode="bypass"
    )

    leads = []
    async with AsyncWebCrawler(config=browser_cfg()) as crawler:
        res = await crawler.arun(url=url, config=cfg)
        if not res.success:
            print(f"  ⚠️  Maps blocked — falling back to Yelp")
            return await scrape_yelp(industry, city)
        try:
            raw = json.loads(res.extracted_content or "[]")
        except: raw = []

        city_only = city.split(" ")[0]
        for biz in raw:
            name = (biz.get("name") or "").strip()
            if not name or already_exists(name): continue
            no_site = not bool(biz.get("website"))
            d = {
                "business":   name,
                "owner_name": "",
                "phone":      (biz.get("phone") or "").strip(),
                "email":      "",
                "city":       city_only,
                "state":      city.split()[-1],
                "industry":   industry,
                "no_website": no_site,
                "website_url":biz.get("website") or None,
                "has_reviews":bool(biz.get("reviews")),
                "stage":      "found",
                "playbook":   "no-website" if no_site else "bad-website",
                "source":     "google-maps",
                "notes":      f"Found: {query}"
            }
            d["score"] = score_lead(d)
            d["tier"]  = tier(d["score"])
            if no_site or d["score"] >= 30:
                leads.append(d)
                print(f"  📍  {name} — {'NO SITE' if no_site else 'has site'} — {d['score']}pts")

    return leads

# ── YELP FALLBACK ──────────────────────────────────────────────────────────────
async def scrape_yelp(industry: str, city: str) -> list:
    city_slug = city.replace(" ", "-").replace("'", "").replace(",","")
    url = f"https://www.yelp.com/search?find_desc={industry.replace(' ','+')}&find_loc={city_slug}"
    print(f"  🍕  Yelp fallback: {industry} in {city}")

    cfg = CrawlerRunConfig(
        wait_for="div.businessName__09f24__",
        delay_before_return_html=2.0,
        cache_mode="bypass",
        word_count_threshold=20
    )

    leads = []
    async with AsyncWebCrawler(config=browser_cfg()) as crawler:
        res = await crawler.arun(url=url, config=cfg)
        if not res.success: return []
        md = res.markdown_v2.fit_markdown if res.markdown_v2 else ""
        # Extract business names from Yelp markdown
        city_only = city.split()[0]
        for line in md.split("\n"):
            line = line.strip()
            if not line or len(line) < 4: continue
            name = re.sub(r'\[|\]|\(.*?\)|[#*]', '', line).strip()
            if 3 < len(name) < 60 and not already_exists(name):
                d = {
                    "business": name, "owner_name": "", "phone": "",
                    "email": "", "city": city_only, "state": city.split()[-1],
                    "industry": industry, "no_website": True,
                    "website_url": None, "has_reviews": False,
                    "stage": "found", "playbook": "no-website",
                    "source": "yelp", "notes": f"Yelp: {industry} {city}"
                }
                d["score"] = score_lead(d)
                d["tier"]  = tier(d["score"])
                leads.append(d)
                if len(leads) >= 10: break
    print(f"  Found {len(leads)} via Yelp")
    return leads

# ── QUICK URL SCAN ─────────────────────────────────────────────────────────────
async def scan_url(url: str) -> dict:
    print(f"\n🔬  Scanning: {url}")
    cfg = CrawlerRunConfig(cache_mode="bypass", screenshot=False, word_count_threshold=5)
    async with AsyncWebCrawler(config=browser_cfg()) as crawler:
        res = await crawler.arun(url=url, config=cfg)
    if not res.success:
        return {"url": url, "alive": False, "score": 0, "issues": ["Unreachable"]}

    md = res.markdown_v2.fit_markdown if res.markdown_v2 else ""
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
        # Try to find it
        matches = list(LEADS_DIR.glob(f"*{filename}*"))
        if not matches:
            print(f"❌  Not found: {filename}")
            return
        path = matches[0]

    data = json.loads(path.read_text())
    print(f"\n🔍  Enriching: {data['business']}")

    search = f'"{data["business"]}" {data.get("city","")}'
    url    = f"https://www.google.com/search?q={search.replace(\" \", \"+\")}"
    cfg    = CrawlerRunConfig(cache_mode="bypass", screenshot=False)

    async with AsyncWebCrawler(config=browser_cfg()) as crawler:
        res = await crawler.arun(url=url, config=cfg)

    md = res.markdown_v2.fit_markdown if (res.success and res.markdown_v2) else ""

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
    path.write_text(json.dumps(data, indent=2))
    print(f"  ✅  Score: {data['score']} ({data['tier']})")

# ── BATCH HUNT ─────────────────────────────────────────────────────────────────
async def batch_hunt():
    print("\n🚀  HOO BATCH HUNT v3.0 — Crawl4AI powered")
    print(f"    {len(PRIORITY_COMBOS)} combos | Google Maps + Yelp fallback")
    print("="*55)

    all_leads = []
    industry_counts, city_counts = {}, {}

    for industry, city in PRIORITY_COMBOS:
        leads = await scrape_maps(industry, city)
        for lead in leads:
            ind, cit = lead["industry"], lead["city"]
            industry_counts[ind] = industry_counts.get(ind, 0) + 1
            city_counts[cit]     = city_counts.get(cit, 0) + 1
            total = len(all_leads) + 1
            if industry_counts[ind] / total > 0.30:
                print(f"  ⏭️  Skip {lead['business']} — industry cap ({ind})")
                continue
            if city_counts[cit] / total > 0.40:
                print(f"  ⏭️  Skip {lead['business']} — city cap ({cit})")
                continue
            all_leads.append(lead)
            save_lead(lead)
        await asyncio.sleep(2)

    hot  = sorted([l for l in all_leads if l["tier"]=="HOT"],  key=lambda x:x["score"], reverse=True)
    warm = [l for l in all_leads if l["tier"]=="WARM"]
    cold = [l for l in all_leads if l["tier"]=="COLD"]

    print(f"\n{'='*55}")
    print(f"✅  BATCH COMPLETE: {len(all_leads)} leads")
    print(f"    HOT:{len(hot)}  WARM:{len(warm)}  COLD:{len(cold)}")
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
        print("Commands: hunt [industry] [city] | maps [industry] [city] | batch | scan [url] | enrich [filename]")
        return

    cmd = args[0].lower()
    if cmd in ("hunt", "maps") and len(args) >= 3:
        industry, city = args[1], " ".join(args[2:])
        leads = await scrape_maps(industry, city)
        for l in leads: save_lead(l)
        print(f"\nSaved {len(leads)} leads")
    elif cmd == "batch":
        await batch_hunt()
    elif cmd == "scan" and len(args) >= 2:
        await scan_url(args[1])
    elif cmd == "enrich" and len(args) >= 2:
        await enrich_lead(args[1])
    else:
        print("Unknown command. Run without args for help.")

if __name__ == "__main__":
    asyncio.run(main())

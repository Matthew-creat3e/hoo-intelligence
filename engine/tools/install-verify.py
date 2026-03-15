#!/usr/bin/env python3
"""
HOO Engine v3.0 — Install & Verify Script
Run this once to set everything up and confirm it's working.

Usage: python install-verify.py
"""

import subprocess
import sys
import os
import json
from pathlib import Path

BASE = Path(r"C:\Users\Matth\hoo-workspace")

def step(msg):
    print(f"\n{'='*50}")
    print(f"  {msg}")
    print('='*50)

def ok(msg):   print(f"  ✅  {msg}")
def warn(msg): print(f"  ⚠️   {msg}")
def fail(msg): print(f"  ❌  {msg}")
def info(msg): print(f"  ℹ️   {msg}")

# ── 1. PYTHON DEPS ─────────────────────────────────────────────────────────────
step("STEP 1: Python Dependencies")
try:
    import crawl4ai
    ok("crawl4ai installed")
except ImportError:
    warn("crawl4ai not installed — installing now...")
    subprocess.run([sys.executable, "-m", "pip", "install", "crawl4ai", "playwright", "--quiet"])
    info("Run after install: playwright install chromium")

# ── 2. PLAYWRIGHT ──────────────────────────────────────────────────────────────
step("STEP 2: Playwright Browser")
chromium = Path.home() / ".cache" / "ms-playwright"
if chromium.exists():
    ok("Playwright browsers installed")
else:
    warn("Installing Chromium for Crawl4AI...")
    subprocess.run([sys.executable, "-m", "playwright", "install", "chromium"])

# ── 3. DIRECTORY STRUCTURE ────────────────────────────────────────────────────
step("STEP 3: Directory Structure")
dirs = [
    BASE / "engine" / "tools",
    BASE / "engine" / "leads",
    BASE / "engine" / "outreach" / "templates",
    BASE / "engine" / "data",
    BASE / "engine" / "playbooks",
    BASE / "n8n" / "workflows",
    BASE / "social-engine" / "queue",
    BASE / "social-engine" / "posted",
    BASE / "outputs" / "prototypes",
    BASE / "outputs" / "audits",
    BASE / "outputs" / "hoo-site",
    BASE / "outputs" / "builds",
    BASE / "outputs" / "social",
    BASE / "memory",
]
for d in dirs:
    d.mkdir(parents=True, exist_ok=True)
    ok(f"Created: {d.relative_to(BASE)}")

# ── 4. ENV FILE CHECK ─────────────────────────────────────────────────────────
step("STEP 4: Environment Variables (.env)")
env_path = BASE / "engine" / "tools" / ".env"
if env_path.exists():
    ok(".env file exists")
    content = env_path.read_text()
    if "TWILIO_ACCOUNT_SID=AC" in content:
        ok("Twilio SID configured")
    else:
        warn("Twilio SID not configured — add to .env:")
        info("  TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx")
        info("  TWILIO_AUTH_TOKEN=your_token_here")
        info("  TWILIO_PHONE=+1XXXXXXXXXX")
        info("  MATTHEW_PHONE=+18049571003")
else:
    warn(".env file not found — creating template...")
    env_path.write_text(
        "# HOO Engine Environment Variables\n"
        "# Get from twilio.com/console\n"
        "TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n"
        "TWILIO_AUTH_TOKEN=your_auth_token_here\n"
        "TWILIO_PHONE=+1XXXXXXXXXX\n"
        "MATTHEW_PHONE=+18049571003\n"
        "\n"
        "# Get from console.anthropic.com\n"
        "ANTHROPIC_API_KEY=sk-ant-xxxxxxxx\n"
    )
    warn(f"Template created: {env_path}")
    info("Edit it with your real credentials before running the engine")

# ── 5. LEARNING.JSON ──────────────────────────────────────────────────────────
step("STEP 5: Learning Data")
learning = BASE / "engine" / "data" / "learning.json"
if not learning.exists():
    learning.write_text(json.dumps({
        "hunts": [],
        "email_stats": { "sent": 0, "opened": 0, "replied": 0 },
        "sms_stats":   { "sent": 0, "delivered": 0, "replied": 0 },
        "top_industries": [],
        "top_cities": [],
        "best_templates": []
    }, indent=2))
    ok("learning.json initialized")
else:
    ok("learning.json exists")

# ── 6. SOCIAL INTEL ───────────────────────────────────────────────────────────
step("STEP 6: Social Intel")
social_intel = BASE / "memory" / "social-intel.json"
if not social_intel.exists():
    social_intel.write_text(json.dumps({
        "posts": [],
        "top_content_types": [],
        "platform_performance": {
            "facebook":  {"posts": 0, "avg_engagement": 0},
            "instagram": {"posts": 0, "avg_engagement": 0},
            "tiktok":    {"posts": 0, "avg_engagement": 0}
        }
    }, indent=2))
    ok("social-intel.json initialized")
else:
    ok("social-intel.json exists")

# ── 7. NODE DEPS ──────────────────────────────────────────────────────────────
step("STEP 7: Node.js Dependencies")
engine_tools = BASE / "engine" / "tools"
pkg = engine_tools / "package.json"
if not pkg.exists():
    pkg.write_text(json.dumps({
        "name": "hoo-engine",
        "version": "3.0.0",
        "description": "HOO Lead Engine v3 — Twilio SMS",
        "dependencies": {
            "twilio": "^4.0.0",
            "dotenv": "^16.0.0"
        }
    }, indent=2))
    info("package.json created")
    info("Run: cd " + str(engine_tools) + " && npm install")
else:
    ok("package.json exists")

# ── 8. QUICK TEST ─────────────────────────────────────────────────────────────
step("STEP 8: Quick Crawl4AI Test")
try:
    import asyncio
    from crawl4ai import AsyncWebCrawler, CrawlerRunConfig, BrowserConfig

    async def test_crawl():
        cfg = CrawlerRunConfig(cache_mode="bypass", word_count_threshold=5)
        bcfg = BrowserConfig(headless=True, browser_type="chromium")
        async with AsyncWebCrawler(config=bcfg) as crawler:
            result = await crawler.arun(url="https://example.com", config=cfg)
            return result.success

    success = asyncio.run(test_crawl())
    if success:
        ok("Crawl4AI test passed — example.com scraped successfully")
    else:
        warn("Crawl4AI test failed — check playwright install")
except Exception as e:
    warn(f"Crawl4AI test error: {e}")
    info("Run: playwright install chromium")

# ── SUMMARY ────────────────────────────────────────────────────────────────────
step("INSTALL COMPLETE")
print("""
Next steps:

1. Edit engine/tools/.env with real Twilio credentials
   Sign up free at twilio.com — get ~$15 trial credit

2. Install Node deps for SMS engine:
   cd C:\\Users\\Matth\\hoo-workspace\\engine\\tools && npm install

3. Set up n8n (optional but powerful):
   See n8n/SETUP.md — Docker install, 30 minutes, free forever

4. Apply for Shopify Partner:
   partners.shopify.com — 15 minutes, passive income forever

5. Generate your social content library:
   cd C:\\Users\\Matth\\hoo-workspace\\social-engine
   node post-manager.js library

6. Run your first batch hunt:
   cd C:\\Users\\Matth\\hoo-workspace\\engine\\tools
   python lead-hunter-v3.py batch

herrmanonlineoutlook.com — build free, pay on approval
""")

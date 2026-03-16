# LEADS WORKSPACE — Layer 2
**Loaded when:** leads / hunt / outreach / pipeline / send / email / text / follow-up / command center

---

## Inputs This Workspace Loads

| Source | File | Sections Needed |
|---|---|---|
| Pipeline state | This file | Current Pipeline section |
| Email templates | `C:\Users\Matth\hoo-workspace\lead-engine\outreach\templates.md` | Template requested |
| Lead data | `C:\Users\Matth\hoo-workspace\lead-engine\leads\LEAD-*.json` | Specific lead |
| Learning data | `C:\Users\Matth\hoo-workspace\lead-engine\data\learning.json` | Stats section |
| Industry designs | `C:\Users\Matth\hoo-workspace\tools\industry-designs.json` | Industry requested |

---

## ⚠️ SAFETY PROTOCOL — NEVER SKIP
```
ALL send/text commands default to DRY RUN.
--live flag REQUIRED to actually send.
--test-to=PHONE redirects to Matthew's number.

Pattern: preview → test-to → live (never skip steps)

If Matthew says "send it" or "fire it off":
→ Still do dry run preview first
→ Show him what will send
→ Wait for explicit confirm
→ Then send with --live
```

---

## Location
`C:\Users\Matth\hoo-workspace\lead-engine\`

---

## v3.0 ENGINE — Crawl4AI + Twilio (UPGRADED)

### Why the Upgrade
- Google blocks Puppeteer headless scraping → Crawl4AI uses stealth browser mode, handles JS rendering, built-in proxy rotation. Free. 50k+ stars. No API key.
- Carrier gateway SMS doesn't deliver → Twilio API: $0.0075/msg, reliable delivery receipts, inbound reply routing via webhook

### Lead Hunter v3 (`engine/tools/lead-hunter-v3.py`)
```bash
pip install crawl4ai playwright && playwright install chromium

python lead-hunter-v3.py hunt "cleaning" "Kansas City MO"
python lead-hunter-v3.py maps "tattoo" "Liberty MO"
python lead-hunter-v3.py batch          # all priority combos
python lead-hunter-v3.py scan https://example.com
python lead-hunter-v3.py enrich LEAD-011-tattoo-liberty.json
```
Falls back to Yelp automatically if Google Maps blocks. Generates call sheet after batch.

### SMS Engine v2 (`engine/tools/sms-engine.js`)
```bash
node sms-engine.js preview LEAD-011-tattoo-liberty.json
node sms-engine.js send LEAD-011-tattoo-liberty.json --live
node sms-engine.js send-all --live
node sms-engine.js webhook    # starts inbound reply listener port 3001
```
Requires `.env` with TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE.
Inbound replies → alerts Matthew's phone immediately + updates lead stage to "responded".

### n8n Workflows (`n8n/workflows/`)
```
gmail-reply-detector.json     — polls Gmail every minute, matches sender to lead, alerts Matthew
daily-pipeline-briefing.json  — 7am email: replies, overdue follow-ups, hot leads to call
social-content-engine.json    — webhook → Claude writes captions → email preview to Matthew
```
See `n8n/SETUP.md` for Docker install (30 min, free forever).

---

## v2.5 Tools (legacy — still work)

### 1. Lead Hunter (`tools/lead-hunter.js`)
```bash
hunt "lawn care" "Kansas City MO"   # Google/Facebook/BBB scraper
batch                                 # All priority city+industry combos
scan <url>                            # Quick HTTP site check (no Puppeteer)
enrich <lead.json>                    # Scrape Facebook for phone/email/website
```

### 2. Lead Finder (`tools/lead-finder.js`)
```bash
audit <url>                # Full Puppeteer audit + screenshots + scoring
qualify <lead.json>        # Score 0-100, assign playbook
report                     # Pipeline overview
stats                      # Learning data
```

### 3. Outreach Generator (`tools/outreach-generator.js`)
```bash
<lead.json>   # Generate personalized call/DM/email/voicemail + follow-up schedule
all           # Generate for every lead in pipeline
# Output: outreach/generated/LEAD-ID-name.md
```

### 4. Pipeline Tracker (`tools/pipeline-tracker.js`)
```bash
today                           # What needs to happen right now
overdue                         # Missed follow-ups
dashboard                       # Full visual pipeline
mrr                             # Monthly recurring revenue
move LEAD-ID stage              # Change pipeline stage
contact LEAD-ID call "note"     # Log contact attempt
win LEAD-ID plan                # Close won
lose LEAD-ID "reason"           # Close lost
```

### 5. Email Engine (`tools/email-engine.js`) — SMTP LIVE
```bash
send <lead.json>              # Send outreach (--live required)
send-all                      # All leads with emails (5s delay, --live required)
test <your-email> <lead.json> # Send to YOUR address for testing
preview <lead.json>           # Preview in console (safe)
draft <lead.json>             # Generate .eml file (safe)
text <phone> "msg" [carrier]  # SMS via carrier gateway (unreliable — use Twilio)
```
Gmail: herrmanonlineoutlook@gmail.com (App Password configured)

---

## Growth Engines v3.0 (`hoo-workspace/tools/`)

| Engine | Command | Output |
|---|---|---|
| Auto-Prototype v2 | `node auto-prototype-v2.js <lead.json>` | Custom demo homepage for lead |
| Auto-Prototype Batch | `node auto-prototype-v2.js --batch` | All leads |
| Video Demo | `node video-demo.js <lead.json>` | 6-slide animated demo |
| Lead Pipeline | `node lead-pipeline.js process <lead.json>` | Full: audit → prototype → queue |
| Pipeline Batch | `node lead-pipeline.js run-all` | All unprocessed leads |
| Audit Report | `node audit-report.js <url>` | Branded HTML audit report |
| No-Site Report | `node audit-report.js --no-site <lead.json>` | "No website" report |

**Pitch lines:**
- Auto-prototype: *"I already built your homepage. Want to see it?"*
- Audit report: *"I found 7 issues with your online presence. Here's the free report."*

---

## Automation Config
- Top 5 by score + owner name + phone → Matthew handles personal calls
- Remaining with email → automation sends Template 4 or 5
- 5s delay between sends, max 25/session
- Auto follow-up: 3 days, 7 days, 14 days
- Auto-sets pipeline stage to "contacted" on send

## Email Templates (6 total)
1. No Website (long form)
2. Bad Website with audit
3. Social Media Only
4. **Punchy Short** ← automation default (4 lines)
5. **Industry-Specific Hook** ← high-value trades
6. Follow-Up (after no response)

---

## Claude Hunting Protocol
When Matthew says "leads" or "hunt":
1. WebSearch: `site:facebook.com "{city} MO" {industry}` — run parallel, multiple industries
2. VERIFY: Always search `"{business name}" website` — NEVER assume no website without checking
3. Create lead JSONs with full data
4. Score + assign playbook
5. Generate call sheet with priority order + scripts
6. Update learning.json

## Coverage (v2.5)
**13 cities:** Independence, Blue Springs, Lee's Summit, Grain Valley, Raytown, Belton, Liberty, Grandview, Pleasant Hill, Oak Grove, Kansas City MO, Kansas City KS, Overland Park KS

**18 industries:** cleaning, lawn care, handyman, painting, landscaping, moving, auto detailing, pressure washing, pet grooming, tattoo, food truck, roofing, fencing, personal training, barber, photography, junk removal, mobile mechanic

## Diversification Rules
- Never >30% leads from same industry
- Never >40% leads from same city
- Mix service + trade + personal per batch

## Scoring & Stages
```
HOT 50+  |  WARM 30-49  |  COLD <30

Stages: found → researched → audited → approach_planned → approved → contacted → responded → meeting → building → review → closed_won / closed_lost

Note: 'approved' stage added CC v3.1 — Shelby approves from walkthrough, lead moves to Ready to Send queue
```

---

## Current Pipeline (as of 2026-03-13)
**25 total | 23 HOT | 2 WARM | 14 emailed | 11 phone-only | 2 DM-only**

### Matthew's Top 5 — Personal Calls (PRIORITY)
| ID | Business | Location | Industry | Score | Owner | Phone |
|---|---|---|---|---|---|---|
| LEAD-011 | Tattoos by Glendon | Liberty | Tattoo | 80 | Glendon Thomas | (816) 569-4465 |
| LEAD-012 | Spence's Fences | Grain Valley | Fencing | 70 | Seth | (816) 878-7631 |
| LEAD-013 | KC Soul Sistas | Grandview | Food Truck | 70 | — | (816) 678-9492 |
| LEAD-014 | Always Green Landscape | Belton | Landscaping | 70 | — | (913) 617-2936 |
| LEAD-004 | Fast Track Handyman | Independence | Handyman | 65 | Kenneth Hedges | (816) 405-7161 |

### Automation Sent (14 emails — 2026-03-13)
LEAD-004 through LEAD-014, LEAD-017, LEAD-018, LEAD-021  
**Follow-up due: 2026-03-16** (check responses, send follow-up to non-responders)

### Phone/Text Only (9 leads — no email)
LEAD-001, 002, 003, 015, 016, 019, 020, 022, 024

### DM Only (2 leads)
LEAD-023 (Lovely Vieux Cleaning) | LEAD-025 (Good Cracker Auto Detailing)

---

## 3-Touch Follow-Up (max — then move on)
- **DAY 1:** "Here's what we built. Yours to use either way. Want the full build?"
- **DAY 3:** "Noticed [specific issue]. Most [industry] sites lose customers there. Fix it free?"
- **DAY 7:** "If timing isn't right, no worries. herrmanonlineoutlook.com when you're ready."

## Lead Qualification
- **HOT:** has business + traffic, wants now → build free homepage, close on full package
- **WARM:** has business, not urgent → build one free section unsolicited
- **COLD:** early stage → give 8-step checklist, check back 30 days

## Shelby Lead Intake
She passes: business name, industry, URL, what they need, warmth read  
Outreach format: *"Hey [name], I looked at [site]. Noticed [specific problem]. We build free, pay if you love it."*

---

## Revenue Math
```
Close rate 20% (5 of 25): $1,500-4,500 one-time + $375-500/mo MRR
25 active clients: $1,875-3,750/mo MRR = $22,500-45,000/yr recurring
Goal: First $1,000/mo MRR
```

---

## Command Center (`C:\Users\Matth\hoo-workspace\dashboard\`)
| File | What It Does |
|---|---|
| `main.js` | Electron main — 24+ IPC handlers, file I/O, email (~21KB) |
| `preload.js` | Context bridge — window.hoo API (23 methods) |
| `app.html` | Full UI — 12 pages, CSS, HTML, JS (monolithic ~137KB) |
| `dist/win-unpacked/HOO Command Center.exe` | Built exe (OUTDATED — needs `npm run build`) |
| `launch.bat / launch.cmd / launch.vbs` | Launch scripts |

Data files: `dashboard/data/` → config.json, learning.json, outbox.json, rebuild-requests.json

**v3.1 addition:** Shelby approval flow — leads go to "approved" stage before Ready to Send queue

---

## Recommended External Tools (for scaling)
| Tool | Free Tier | Use |
|---|---|---|
| Outscraper | 500/mo | Google Maps scraper, filter no-website businesses |
| Apollo.io | 10K credits/mo | Contact database, email finder |
| Brevo | 300 emails/day | Email + SMS automation sequences |
| Plivo | $0.005/text | Reliable SMS API |
| Localo | Free audit | Google Business Profile auditor |
| Firecrawl MCP | 500 pages/mo | Web scraping inside Claude Code |
| GoHighLevel | $97-297/mo | White-label CRM for clients |

---

## Improvement Opportunities
1. lead-hunter.js → add Yelp/Nextdoor scraping + dedup check against existing leads
2. email-engine.js → track open rates, A/B test subject lines, auto follow-up sequences
3. pipeline-tracker.js → auto-move stale leads, integrate CC notifications
4. outreach-generator.js → learn from reply data (which hooks work per industry)
5. Fix SMS: carrier gateways unreliable → implement Twilio ($0.0075/msg)
6. Matthew's Top 5: personal calls haven't happened yet — highest priority action

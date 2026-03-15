# HOO Engines Catalog — Reference (Layer 3)
**Canonical tool index. All executables, files, dependencies, dependency graph.**

---

## LEAD ENGINE
`C:\Users\Matth\hoo-workspace\lead-engine\`

### 5 CLI Tools
| Tool | File | Key Commands |
|---|---|---|
| lead-hunter.js | `tools/lead-hunter.js` | `hunt "industry" "City ST"`, `batch`, `scan <url>`, `enrich <lead.json>` |
| lead-finder.js | `tools/lead-finder.js` | `audit <url>`, `qualify <lead.json>`, `report`, `stats` |
| outreach-generator.js | `tools/outreach-generator.js` | `<lead.json>`, `all` |
| pipeline-tracker.js | `tools/pipeline-tracker.js` | `today`, `overdue`, `dashboard`, `mrr`, `move <id> <stage>` |
| email-engine.js | `tools/email-engine.js` | `send <lead.json> --live`, `send-all --live`, `test <email> <lead.json>`, `preview` |

Dependencies: `nodemailer 8.0.2`, `puppeteer` (from tools/node_modules)

### Supporting Files
- `config.json` — HOO settings, 8 industry templates, 18 industries, 13 markets, pipeline stages
- `HUNTING-GUIDE.md` — Claude autonomous hunting protocol, search strategies, qualification scoring
- `leads/` — 25 lead JSON files (LEAD-001 to LEAD-025) + batch call sheets
- `outreach/templates.md` — Master email/call/DM templates
- `outreach/generated/` — Per-lead outreach scripts
- `approach-playbooks/` — 5 playbooks: no-website, bad-website, free-builder, new-business, social-only
- `data/learning.json` — Conversion rates, industry patterns
- `data/email-config.json` — Gmail SMTP credentials

---

## BUILD TOOLS
`C:\Users\Matth\hoo-workspace\tools\`

### Core Tools
| Tool | File | Output |
|---|---|---|
| hoo-audit.js (V2) | `tools/hoo-audit.js` | JSON reports + screenshots |
| audit-report.js | `tools/audit-report.js` | Branded HTML audit report per lead |
| auto-prototype.js (V1) | `tools/auto-prototype.js` | Demo homepage HTML |
| auto-prototype-v2.js (V2) | `tools/auto-prototype-v2.js` | Smart demo — unique design per industry |
| video-demo.js | `tools/video-demo.js` | 6-slide animated demo HTML + frames |
| lead-pipeline.js | `tools/lead-pipeline.js` | Full orchestration: hunt→audit→prototype→queue |
| customer-view.js | `tools/customer-view.js` | Customer-perspective page scraper |
| scrape-live.js | `tools/scrape-live.js` | NoReturn live site scraper (11 URLs) |

### NoReturn-Specific
- `find-free-shipping.js` — Find "free shipping" text on NoReturn
- `find-hats.js` / `find-hats2.js` — Product catalog analysis for hats
- `find-collections.js` — Enumerate all Shopify collections

### Intelligence Data
- `industry-designs.json` (~35KB) — Design tokens, animations, colors, fonts, images, CTAs per industry (covers ~8 of 18 industries — needs expansion)

Dependencies: `puppeteer 24.39.0`, `playwright 1.58.2`

---

## COMMAND CENTER
`C:\Users\Matth\hoo-workspace\dashboard\`

| File | What It Does | Size |
|---|---|---|
| `main.js` | Electron main — 24+ IPC handlers, file I/O, email | ~21KB |
| `preload.js` | Context bridge — window.hoo API (23 methods) | ~2.5KB |
| `app.html` | Full UI — 12 pages, CSS, HTML, JS (monolithic) | ~137KB |

Data files: `dashboard/data/` → config.json, learning.json, outbox.json, rebuild-requests.json  
Launch: `launch.bat` / `launch.cmd` / `launch.vbs`  
Built exe: `dist/win-unpacked/HOO Command Center.exe` (**OUTDATED — run `npm run build`**)  
Dependency: `electron 33.4.0`, `electron-builder`, `nodemailer`

---

## OUTPUTS
`C:\Users\Matth\hoo-workspace\outputs\` — 22+ subdirectories

| Directory | Contents |
|---|---|
| `audits/` | JSON audit reports |
| `audit-reports/` | Branded HTML reports per lead |
| `prototypes/` | 25 generated homepage prototypes |
| `demos/` | Animated video demos per lead |
| `screenshots/` | Customer view screenshots |
| `customer-reports/` | 12 customer-perspective reports |
| `hoo-site/` | HOO website sections (all 6) |
| `noreturn-*/` (11 dirs) | NoReturn collection pages and components |

---

## Dependency Graph
```
lead-hunter.js           → LEAD-*.json files
lead-finder.js           → hoo-audit.js → JSON reports
outreach-generator.js    → outreach/generated/LEAD-ID.md
pipeline-tracker.js      ↔ LEAD-*.json files
email-engine.js          → Gmail SMTP

auto-prototype-v2.js + industry-designs.json → prototypes/
video-demo.js            → prototypes/ + demos/
audit-report.js          → audit-reports/
lead-pipeline.js         orchestrates: hunt → enrich → audit → prototype → queue

Command Center reads:    LEAD-*.json, prototypes/, all data/ files
Command Center spawns:   hoo-audit.js, auto-prototype.js, video-demo.js
```

---

## Improvement Opportunities
1. `lead-hunter.js` — Add Yelp/Nextdoor scraping + dedup check vs existing leads
2. `email-engine.js` — Track open rates, A/B test subject lines, auto follow-up sequences
3. `pipeline-tracker.js` — Auto-move stale leads, integrate CC notifications
4. `outreach-generator.js` — Learn from reply data (which hooks work per industry)
5. `auto-prototype-v2.js` — Expand industry-designs.json from ~8 to all 18 industries
6. `video-demo.js` — Add voice-over script generation, social media sizing
7. `hoo-audit.js` — Add Lighthouse score integration, accessibility checks
8. `lead-pipeline.js` — Batch processing dashboard, progress tracking, error recovery
9. Command Center — Split monolithic app.html into modules (v4 Phase 4)
10. **Unified learning** — Connect lead-engine learning.json with dashboard learning.json
11. **Auto-pipeline** — One command: found → prototyped → demo'd → outreach ready
12. **Webhook** — Gmail reply detection → auto-update pipeline stage on reply

---

## REVENUE ENGINES (beyond build fees)

### Shopify Partner Program — Apply NOW (partners.shopify.com)
Not a tool — a business registration that stacks passive income on everything HOO already does.

| What | How | Monthly Income |
|---|---|---|
| Basic plan client ($39/mo) | 1 referral via Partner link | ~$8/mo passive forever |
| 25 clients on Basic | 25 referrals | ~$200/mo stacked on management |
| Shopify Plus client ($2K+/mo) | 1 enterprise referral | ~$400/mo per client |
| Dev stores | Unlimited free dev stores | Eliminates build cost entirely |

**No revenue threshold. No waitlist. Free to join. Takes 15 minutes.**
Every client HOO signs up WITHOUT a Partner link = lost recurring commission money, permanently.

How it works: Matthew gets a unique referral link from the Partner dashboard. When setting up any new client's Shopify store, use that link. Shopify tracks it and pays commission automatically — ~20% of their monthly plan, every month, as long as they stay on Shopify. Client never sees this. It costs them nothing extra. HOO just gets paid.

Dev store advantage: As a Partner, Matthew gets unlimited free Shopify stores to build in before the client pays a cent. This makes "build free, pay on approval" even more powerful — the store is fully functional and live for the demo. No subscription needed until client approves and Matthew transfers it.

### Future: HOO Shopify Theme (Level 3 Goal — not now)
After building 20+ stores across industries, the HOO design system could be packaged as a paid theme on the Shopify Theme Store. Themes sell for $180-350 per purchase. Every store HOO builds now is research and development for that future product.

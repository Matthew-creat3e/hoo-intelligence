# HOO Intelligence System v6.0
**The Perpetual Machine — Built to Never Die**
*Jake Van Clief architecture + Sabrina Ramonov automation stack*
*Restructured: 2026-03-15*

---

## What This Is

Three engines running simultaneously, feeding one flywheel:

```
ENGINE 1: LEAD ENGINE          ENGINE 2: SOCIAL ENGINE
Crawl4AI hunts businesses  ←→  Every build = content
Twilio texts leads              Claude writes captions
n8n tracks replies              n8n queues posts
Pipeline auto-updates           Matthew reviews + posts
                    ↓               ↓
              THE FLYWHEEL
         Leads see content
         Content drives inbound
         Inbound feeds engine 1
              (repeats forever)
```

**Monthly cost:** ~$5-15 (Twilio only) vs $81/mo for Blotato + Instantly + Outscraper + Make.

---

## File Map

```
hoo-workspace/
│
├── CLAUDE.md              ← Layer 0 — ALWAYS LOADED (~900 tokens)
├── CONTEXT.md             ← Layer 1 — Routing table
├── AGENTS.md              ← Universal (Claude Code, Cursor, Copilot, any agent)
├── README.md              ← This file
│
├── engine/                ← Lead Engine v3.0
│   ├── tools/
│   │   ├── lead-hunter-v3.py   ← Crawl4AI scraper (replaces Puppeteer)
│   │   └── sms-engine.js       ← Twilio SMS (replaces carrier gateways)
│   ├── leads/             ← LEAD-{ID}-{industry}-{city}.json files
│   ├── outreach/
│   │   └── templates/     ← Email + SMS templates
│   ├── playbooks/         ← 5 approach playbooks
│   └── data/
│       ├── learning.json  ← What works per industry (auto-updated)
│       └── sms-log.json   ← All SMS sent/received
│
├── n8n/                   ← Orchestration (self-hosted Docker, free)
│   ├── SETUP.md           ← Install guide (30 min)
│   └── workflows/
│       ├── gmail-reply-detector.json    ← Auto-detects lead replies
│       ├── daily-pipeline-briefing.json ← 7am morning briefing
│       └── social-content-engine.json  ← Build → caption → queue
│
├── social-engine/         ← Content Machine (replaces Blotato $29/mo)
│   ├── post-manager.js    ← CLI: generate, approve, track performance
│   ├── queue/             ← SOCIAL-{date}-{slug}.json (awaiting approval)
│   └── posted/            ← Approved and posted content
│
├── memory/                ← Claude's session notes (auto-updated)
│   ├── MEMORY.md          ← Index + active reminders (loaded every session)
│   ├── build-patterns.md  ← CSS/JS patterns discovered
│   ├── lead-intel.md      ← Outreach results by industry
│   └── social-intel.json  ← Post performance data
│
├── workspaces/            ← Layer 2 — loaded on demand
│   ├── build/CONTEXT.md        ← Code rules, design tokens, section templates
│   ├── leads/CONTEXT.md        ← Engine v3 + legacy v2.5, pipeline state
│   ├── stores/CONTEXT.md       ← NoReturn + TCB + HOO site status
│   ├── social/CONTEXT.md       ← Social engine, voice, templates, workflow
│   ├── learning/CONTEXT.md     ← Jake + Sabrina frameworks, Shopify ecosystem
│   ├── business/CONTEXT.md     ← Revenue goals, pricing, Shopify Partner
│   └── documents/CONTEXT.md    ← PPTX/DOCX/PDF/XLSX workflows
│
├── reference/             ← Layer 3 — canonical sources
│   ├── section-templates.md    ← HOO section patterns
│   ├── site-types.md           ← 8 industry templates
│   ├── shopify-arch.md         ← Shopify build approach
│   ├── engines-catalog.md      ← All 40+ tools + Shopify Partner revenue
│   ├── naming-conventions.md   ← Filename = queryable database
│   └── matthew-profile.md      ← Who Matthew is
│
├── .claude/skills/        ← Reusable workflows (single command)
│   ├── shopify-section/SKILL.md
│   ├── lead-hunt/SKILL.md
│   ├── store-audit/SKILL.md
│   ├── auto-prototype/SKILL.md
│   └── social-post/SKILL.md
│
├── _core/
│   ├── CONVENTIONS.md          ← 15 architectural rules
│   └── SESSION-DEBRIEF-TEMPLATE.md
│
├── tools/                 ← Legacy build tools (v2.5 — still work)
└── outputs/               ← All generated assets
    ├── prototypes/
    ├── audits/
    ├── hoo-site/
    ├── builds/
    └── social/
```

---

## Quick Start — Engine v3 Install

### 1. Crawl4AI (lead hunter)
```bash
pip install crawl4ai playwright
playwright install chromium
cd C:\Users\Matth\hoo-workspace\engine\tools
python lead-hunter-v3.py batch
```

### 2. n8n (orchestration)
```bash
# See n8n/SETUP.md for full guide
docker run -d --name n8n --restart always -p 5678:5678 \
  docker.n8n.io/n8nio/n8n
# Open http://localhost:5678
# Import workflows from n8n/workflows/
```

### 3. Twilio SMS
```bash
# Sign up twilio.com — get SID, token, phone number
# Create .env in engine/tools/:
TWILIO_ACCOUNT_SID=ACxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxx
TWILIO_PHONE=+18165551234
MATTHEW_PHONE=+18049571003

npm install twilio dotenv
node sms-engine.js test "+18049571003" "HOO SMS test" --live
```

### 4. Social Engine
```bash
cd C:\Users\Matth\hoo-workspace\social-engine
node post-manager.js library       # generate posts for all existing builds
node post-manager.js queue         # review
node post-manager.js approve SOCIAL-2026-03-15-god-quest.json
```

### 5. Shopify Partner (most important — do first)
```
1. Go to: partners.shopify.com
2. Sign up free (use herrmanonlineoutlook.com)
3. Get your referral link
4. Use it on every new client store setup
5. Passive commission starts immediately
```

---

## How the Routing Works

Say "build" → loads `workspaces/build/CONTEXT.md`
Say "leads" → loads `workspaces/leads/CONTEXT.md`
Say "post this build" → loads `workspaces/social/CONTEXT.md`

Agent reads down layers, stops when it has enough.
Never loads the whole system. Always loads exactly what's needed.

---

## What This Replaces

| Tool | Monthly Cost | HOO Alternative | Cost |
|---|---|---|---|
| Zapier / Make | $20/mo | n8n self-hosted | $0 |
| Blotato (social) | $29/mo | post-manager.js + n8n | $0 |
| Instantly.ai (email) | $37/mo | Self-learning reply tracker | $0 |
| Outscraper | $15/mo | Crawl4AI Python script | $0 |
| Carrier gateway SMS | unreliable | Twilio API | ~$5-15/mo |
| **Total** | **$101+/mo** | **HOO stack** | **~$5-15/mo** |

---

## Architecture Credit
- **Jake Van Clief** — Content-Agent-Routing-Promptbase, ICM, 60/30/10 framework (github.com/RinDig)
- **Sabrina Ramonov** — n8n automation patterns, social content system, solopreneur AI stack (sabrina.dev)
- **Crawl4AI** — 50k+ star open source LLM-ready web crawler (github.com/unclecode/crawl4ai)
- **n8n** — 179k+ star open source workflow automation (github.com/n8n-io/n8n)
- **Twilio** — SMS API with A2H open protocol for agent-to-human handoff

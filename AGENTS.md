# AGENTS.md — HOO Intelligence System v6.0
**Universal. Works with Claude Code, Cursor, Copilot, Windsurf, any AI agent.**
*Only what cannot be inferred from the project itself.*

## What This Is
HOO — Shopify web building service, Kansas City MO. Build free, client pays on approval.
Owner: Matthew Herrman | herrmanonlineoutlook@gmail.com | (804) 957-1003
Shopify Partner: Apply at partners.shopify.com — passive commissions on every client

## Non-Negotiable Safety Rules
- ALL outreach/social send commands = DRY RUN by default — `--live` flag required
- Pattern: preview → test-to → live. Never skip. Even if Matthew says "send it."
- Self-healing: on tool failure → log → retry with fallback → alert. Never stall silently.

## Build Rules (cannot be inferred)
- Vanilla HTML/CSS/JS only — no frameworks, no Liquid syntax, no schema tags
- One section per response — one copyable block for Shopify Custom Liquid
- HOO design tokens: BG #050505, Gold #C8952E/#E8B84B, Bebas Neue headlines, Syne body
- Hero always: gold particles + sticky nav + scroll progress bar + line-reveal headline
- God Quest collection page = minimum quality bar — never ship below it

## Engine Stack v3.0
- Scraping: `engine/tools/lead-hunter-v3.py` (Crawl4AI — replaces blocked Puppeteer)
- Orchestration: `n8n/` (self-hosted Docker — Gmail webhooks, daily scheduler, error recovery)
- SMS: Twilio API in `engine/tools/sms-engine.js` ($0.0075/msg, replaces carrier gateways)
- Social: `social-engine/` (Claude captions + n8n posting — replaces Blotato $29/mo)
- Site intel: Firecrawl MCP skill (brand extraction + audits inside Claude Code)

## Key Paths
- Engine: `C:\Users\Matth\hoo-workspace\engine\`
- Tools: `C:\Users\Matth\hoo-workspace\tools\`
- Outputs: `C:\Users\Matth\hoo-workspace\outputs\`
- n8n data: `C:\Users\Matth\hoo-workspace\n8n\`
- Social queue: `C:\Users\Matth\hoo-workspace\social-engine\queue\`
- Products CSV: `C:\Users\Matth\Downloads\products_export.zip`

## Naming Convention (filenames = queryable database — no spreadsheet needed)
- Leads:   `LEAD-{ID}-{industry}-{city}.json`
- Builds:  `BUILD-{store}-{section}-{YYYYMMDD}.html`
- Outputs: `OUTPUT-{type}-{client}-v{n}.html`
- Social:  `SOCIAL-{platform}-{YYYYMMDD}-{slug}.json`
- Batches: `BATCH-{YYYYMMDD}-{city}-{industry}.md`

## Navigation
Full routing: `CLAUDE.md` | Workspaces: `workspaces/*/CONTEXT.md`
Reference files: `reference/` | Skills: `.claude/skills/` | Memory: `memory/`
Engine code: `engine/tools/` | n8n workflows: `n8n/workflows/` | Social: `social-engine/`

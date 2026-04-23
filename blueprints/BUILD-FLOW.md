# V6 Demo Build Flow
**The orchestrator reads this file ONLY. Then spawns agents.**

## Trigger
"build a [industry] demo" / "demo for [lead]" / `/auto-prototype`

## Step 1: Main Claude reads (3 files)
1. This file (BUILD-FLOW.md)
2. `blueprints/industries/{industry}.md` — colors, services, copy, FAQs
3. `blueprints/photos/{industry}.md` — verified Pexels URLs

## Step 2: Create WIP folder
`outputs/demos-wip/{slug}/` — each agent writes its section here

## Step 3: Spawn section agents (parallel)
| Agent | Task File | Output |
|-------|-----------|--------|
| Nav | `agent-tasks/task-nav.md` | `nav.html` |
| Hero | `agent-tasks/task-hero.md` | `hero.html` |
| Stats | `agent-tasks/task-stats.md` | `stats.html` |
| Process | `agent-tasks/task-process.md` | `process.html` |
| Services | `agent-tasks/task-services.md` | `services.html` |
| Wizard | `agent-tasks/task-quote-wizard.md` | `wizard.html` |
| Portfolio | `agent-tasks/task-portfolio.md` | `portfolio.html` |
| Reviews | `agent-tasks/task-reviews.md` | `reviews.html` |
| About/Area | `agent-tasks/task-service-area.md` | `area.html` |
| FAQ | `agent-tasks/task-faq.md` | `faq.html` |
| Footer | `agent-tasks/task-footer.md` | `footer.html` |

## Agent prompt template (COPY THIS EXACTLY)
```
Read these files then build:
- Task: blueprints/agent-tasks/task-{section}.md
- Industry: blueprints/industries/{industry}.md
- Photos: blueprints/photos/{industry}.md
Business: "{name}", {city}, {phone}.
Write output to: outputs/demos-wip/{slug}/{section}.html
Use the Write tool. One HTML block: <style> + <section> + <script>.
```

## Step 4: Assembly
Read `agent-tasks/task-assemble.md`. Stitch all WIP sections into `demos/v6-{industry}-demo.html`.
Copy to `outputs/demos/` as well.

## Step 4.5: AEO Schema Injection
Read `agent-tasks/task-aeo.md`. Inject JSON-LD structured data into `<head>`:
- **LocalBusiness** schema (always) — from lead data
- **FAQPage** schema — auto-parsed from FAQ section HTML
- **HowTo** schema — auto-parsed from process steps HTML
- **Meta robots** tag for AI crawlers (`max-snippet:-1`)
- Use FAQ bank from `blueprints/aeo/{industry}-faqs.md` if FAQ section is thin
- Schema templates at `blueprints/templates/schema-*.json`

## Step 5: Shopify (if requested)
Read `agent-tasks/task-shopify-split.md` + `SHOPIFY-CONVERT.md`.
Output to `outputs/shopify-sections/{industry}-v6/`.

## Rules
- Use `model: "sonnet"` for photo search agents
- Use `model: "sonnet"` for assembly/copy agents  
- Reserve default model for creative sections (hero, services, wizard)
- Max 500 words per agent prompt
- All intelligence lives in the task + industry files, NOT the prompt

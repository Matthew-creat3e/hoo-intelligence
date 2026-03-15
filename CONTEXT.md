# HOO Routing Table — Layer 1
**Read on session entry. Maps intent to workspace. Load only what's needed.**

---

## Task → Workspace Map

| What Matthew Says | Go To | Loads |
|---|---|---|
| Building anything (sections, stores, pages) | `workspaces/build/CONTEXT.md` | Code rules, design tokens, section templates, Shopify arch |
| Lead hunting, outreach, pipeline, follow-up | `workspaces/leads/CONTEXT.md` | Lead engine v3 (Crawl4AI + Twilio + n8n), v2.5 legacy tools, pipeline state |
| Social content, captions, posting, content engine | `workspaces/social/CONTEXT.md` | HOO voice, caption templates, post-manager.js, n8n social workflow |
| NoReturn, TCB, HOO site, store status, audit | `workspaces/stores/CONTEXT.md` | All 3 store contexts, build status, known issues, CDN assets |
| Learning, Jake, Sabrina, courses, frameworks | `workspaces/learning/CONTEXT.md` | Both teachers' frameworks, Shopify Partner ecosystem, learning plan |
| Revenue, pricing, MRR, Shopify Partner, strategy | `workspaces/business/CONTEXT.md` | Goals, pricing, Partner program breakdown, conversion playbook |
| Proposals, pitch decks, PDFs, Word docs | `workspaces/documents/CONTEXT.md` | Office skills, PPTX/DOCX/XLSX/PDF workflows |

---

## Combination Triggers

| Scenario | Load |
|---|---|
| Build a demo for a lead | leads + build |
| Audit a client site and fix it | stores + build |
| Finished a build → create content | build + social |
| Auto-prototype for outreach | leads + build |
| Content drop on existing store | stores + build |
| Pitch deck for a new client | business + documents |

---

## Stop Rule
Agent reads down through layers and stops when it has enough.
A rendering task stops at Layer 2. A full build reads to Layer 4 (files on disk).
Never load more than the task requires.

---

## Current Session State (update at session start)
- **Date:** 2026-03-15
- **Highest priority:** Call Top 5 leads + Apply Shopify Partner
- **Follow-ups due:** 2026-03-16 (14 emailed leads)
- **Engine status:** v3 code built, needs install (Crawl4AI + Docker n8n + Twilio)
- **Social status:** Post manager built, library ready to generate

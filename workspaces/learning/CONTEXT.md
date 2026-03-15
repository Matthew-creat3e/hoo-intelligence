# LEARNING WORKSPACE — Layer 2
**Loaded when:** learn / jake / study / course / framework / improve / teach

---

## The Teachers

### Jake Van Clief — File Structure + AI Architecture
- **GitHub:** github.com/RinDig — Content-Agent-Routing-Promptbase, ICM
- **Community:** Clief Notes on Skool.com — Matthew is a member
- **Core:** Separation of concerns applied to AI context. One-way deps. Canonical sources. Selective loading.
- **HOO built on:** His 4-layer routing architecture

### Sabrina Ramonov — Automation Stack + Social Systems
- **Website:** sabrina.dev — 1,000+ free n8n templates at agents.sabrina.dev
- **Background:** Forbes 30 Under 30, sold AI startup for $10M+, built to 1M+ followers solo in 1 year
- **Core:** n8n automation, content systems, solopreneur AI stack
- **What HOO uses from her:** n8n orchestration, social content engine concept, Google Maps scraper template logic
- **Free resources:** agents.sabrina.dev — browse templates before building anything from scratch
- **Key insight:** Volume + learning is the strategy. More sends, more posts → data → better results. Same principle for HOO outreach AND social.
- **Also:** Blotato ($29/mo) = what HOO's social engine replaces. She built it with the same Claude + n8n stack we're using.

---


- **Background:** Marine veteran (6 yrs, F-18 avionics + cryptographic systems), Flagler College, University of Edinburgh AI governance researcher
- **Company:** Eduba (AI education platform)
- **Community:** "Clief Notes" on Skool.com — Matthew is a member
- **GitHub:** github.com/RinDig — Content-Agent-Routing-Promptbase, Interpreted-Context-Methodology
- **Core belief:** Structure knowledge like you structure code — separated, routed, canonical, loaded on demand

---

## Jake's Core Frameworks

### 1. Content-Agent-Routing-Promptbase (THE architecture)
Separation of concerns applied to AI context windows instead of code modules.

| Layer | Role | HOO Equivalent |
|---|---|---|
| Layer 0: CLAUDE.md | Identity + navigation (~800 tokens, always loaded) | `CLAUDE.md` |
| Layer 1: CONTEXT.md | Routing table — task → workspace (~300 tokens) | `CONTEXT.md` |
| Layer 2: Workspace CONTEXT.md | Domain knowledge, loaded on demand (200-500 tokens) | `workspaces/*/CONTEXT.md` |
| Layer 3: Reference files | Canonical sources, loaded selectively | `reference/*.md` |
| Layer 4: Content files | Raw data — leads, HTML, templates | Lead JSONs, outputs/ |

**Key principles:**
- **One-way dependencies** — workspaces point to reference files, never the reverse
- **Canonical sources** — ONE source of truth per piece of knowledge (if same rule exists in two files, they will drift)
- **Selective loading** — route to sections, not just files (load 80 lines, not 174)
- **No circular references** — A references B, B never references A back

### 2. Interpretable Context Methodology (ICM)
Folder structure as agent architecture. Numbered folders = execution stages. One stage, one job.

```
Stage 1: Research → Stage 2: Write → Stage 3: Build → Stage 4: Deliver
Each stage: CONTEXT.md (what), references/ (rules), output/ (handoff)
Every output = a file a human can open, edit, and save before next stage runs
```

**Design principles:**
- One stage, one job (research doesn't write, writing doesn't build)
- Plain text as the interface (markdown files, no binary formats)
- Layered context loading (agents stop when they have enough)
- Configure the factory, not the product (workspace set up once, used many times)

### 3. The 60/30/10 Framework
How to split time running a software/web dev business:
- **60% BUILD** — actual client work, coding, shipping (where the money is)
- **30% LEARN** — new tools, AI, frameworks, courses (what makes you better)
- **10% MARKET** — outreach, content, visibility (what brings in clients)

### 4. Model Workspace Protocol
Treat AI models like employees with dedicated workspaces. Each workspace has its own context, tools, and boundaries. Route tasks to specialized contexts — don't make one agent do everything.

---

## Jake's Key Insights

1. **Cohort > self-paced.** 85% completion vs 5-15% solo. Community accelerates learning.
2. **The AI skills gap is massive.** 89% of companies need AI skills, only 6% are upskilling. Matthew is in the 6%.
3. **Canonical sources.** ONE source of truth per piece of knowledge — the moment the same rule exists in two files, they drift.
4. **Token cost.** Every token of irrelevant context is a token of diluted attention. Most "AI isn't good enough" frustration is a context architecture problem, not a model problem.
5. **Code blueprints > prose descriptions.** Prose requires interpretation (introduces variance). Code requires translation (preserves intent).
6. **The system state IS the filesystem.** Glass-box workflows — every artifact is a plain-text file a human can read, edit, and re-run.

---

## Matthew's Learning Plan

### Phase 1: NOW
- [ ] Claude Code mastery — deeper prompt engineering
- [ ] Shopify Custom Liquid — understand theme architecture
- [ ] Lead engine automation — understand the tools, not just run them
- [ ] Jake's Clief Notes community — engage, ask questions, share HOO builds
- [ ] **Apply for Shopify Partner Program** — 15 minutes, free, starts earning immediately

### Phase 2: NEXT 30 DAYS
- [ ] Jake's Claude Code course on Skool
- [ ] Jake's Python + AI course
- [ ] Twilio integration — fix SMS outreach ($0.0075/msg)
- [ ] Study competitor builds (faith streetwear, local service sites)

### Phase 3: 90 DAYS
- [ ] Browser automation (Jake's course)
- [ ] Build auto-prototype system v3 (cover all 18 industries)
- [ ] Learn SEO deeply — add as HOO service
- [ ] Consider cohort offering

### Phase 4: 6 MONTHS
- [ ] HOO = recognized local agency in KC metro
- [ ] 10+ active monthly clients ($750-1,500/mo MRR)
- [ ] Matthew can teach what he's learned
- [ ] Consider hiring/partnering for build capacity

---

## What Matthew Already Knows
- Shopify store management and Custom Liquid sections
- Lead generation and outreach (finding Facebook-only businesses)
- Basic web design principles (learned through building)
- Client communication and sales ("build free, pay on approval" model)
- Using Claude Code effectively as a power user

## The Shopify Ecosystem Matthew Should Know Cold

### Shopify Partner Program (apply NOW — partners.shopify.com)
The program that turns every client HOO signs up into **passive recurring income forever**:
- Free to join — takes 15 minutes
- Unlimited free dev stores for building before client pays
- ~20% recurring commission on every client's monthly Shopify plan
- 10 clients = ~$80/mo extra with zero added work
- 25 clients = ~$200-400/mo stacked on top of management fees
- The "build free, pay on approval" model + dev stores = the most powerful demo tool in the industry

### Shopify Ecosystem Worth Learning
- **Shopify CLI** — push/pull theme code from terminal, version control builds
- **Shopify Admin API** — read products, collections, orders programmatically (powers the auto-prototype engine)
- **Shopify Storefront API** — headless builds for advanced clients
- **Shopify Sections Everywhere** — how to make sections available across all templates
- **Shopify Metafields** — already used for NoReturn scripture; powerful for any data you want per product/collection
- **Shopify Markets** — multi-currency, multi-language for premium clients
- **Shopify Flow** — no-code automation for client stores (upsell triggers, inventory alerts, tag-based logic)

### Why This Compounds
Every thing Matthew learns about Shopify adds to HOO's moat. Most local web agencies:
- Use WordPress (more vulnerable, more maintenance, no native commerce)
- Don't know Shopify deeply
- Charge for dev time Matthew can do in hours with AI

Matthew's edge: deep Shopify knowledge + AI speed + "build free" model + Partner commissions. That's a business no local agency can touch.

## What Matthew Is Building Toward
- Deeper web development (CSS/JS beyond paste-and-go)
- AI prompt engineering and agent architecture
- Business scaling (solo builder → agency)
- SEO and ongoing client value delivery
- Full automation (reduce manual work in lead engine)

---

## Learning Principles
1. **Learn by building.** Don't study theory — build a site, then learn what you didn't know.
2. **Document everything.** This memory system IS the learning.
3. **Community accelerates.** Jake's Skool, other builders, Claude.
4. **Mistakes are data.** Every failure teaches. Never same mistake twice.
5. **AI is a multiplier.** Matthew's taste, relationships, and local market knowledge can't be automated.

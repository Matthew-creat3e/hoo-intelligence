# HOO Auto-Memory v6.0
**Claude writes this. Matthew writes CLAUDE.md.**
**Updated every session. First 200 lines load automatically.**

---

## Active Reminders (check these every session)

| Priority | Item | Action |
|---|---|---|
| 🔴 URGENT | Apply for Shopify Partner Program | Go to partners.shopify.com — 15 min, free, passive income on every client |
| 🔴 URGENT | Call Glendon Thomas | (816) 569-4465 — #1 lead, still not called |
| 🔴 URGENT | Test demo link in email | Verify HappyYardsKc.html loads on GitHub Pages after latest push |
| 🟡 IMPORTANT | Follow-up emails overdue | 14 emails sent 2026-03-13 — 3-day mark was 2026-03-16 |
| 🟡 IMPORTANT | Post social content | Multiple posts queued in social-engine/queue/ — review & post |
| 🟡 IMPORTANT | Call Queue leads need emails | No-email leads sitting in Call Queue — get emails, then send from Command Center |
| 🟢 ENGINE | Install Crawl4AI | `pip install crawl4ai playwright && playwright install chromium` |
| 🟢 ENGINE | Configure Twilio | Sign up twilio.com, add to `.env`, run `node sms-engine.js test` |

---

## Pipeline State (as of 2026-03-16 end of session)

| Metric | Value |
|---|---|
| Total leads | 53 (LEAD-001 through LEAD-053) |
| Batches run | Cleaning, moving, detailing, barber, food/restaurant, landscaping |
| Demos built | 53 (all leads have demo HTML in outputs/demos/) |
| Demos on GitHub Pages | 53+ (demos/ directory, clean PascalCase names added this session) |
| Email format | Plain text only — "concrete worker / Local 1290" angle — live URL in body |
| Location | Kansas City, MO (updated from Independence this session) |
| Responded | 0 |
| Closed | 0 |
| MRR | $0 (pre-revenue) |

**Email flow:** Pipeline → Approval → Command Center Approvals tab (if has email) or Call Queue (if no email) → Send → plain text email with GitHub Pages demo link → auto-push demos

**Follow-up schedule:**
- OVERDUE: 14 emails from 2026-03-13 need follow-up
- New leads from 2026-03-16 batches need review in Command Center

---

## Store Build Status

### NoReturn Apparel (noreturnapparel.com)
| Section | Status |
|---|---|
| God Quest Collection | ✅ LIVE |
| Best Sellers Collection | ✅ LIVE |
| Anime Collection | ✅ LIVE |
| Fatherhood Ascended | ✅ LIVE |
| No Return Core | ⚠️ BUILT, NOT PASTED |
| Collections Landing | ⚠️ BUILT, NOT PASTED |
| Hats & Headwear | ⚠️ BUILT, NOT PASTED |
| Live or Die | ❌ NOT BUILT |
| New Arrivals | ❌ NOT BUILT |

**Known issues:** TWO marquees (one says "FREE SHIPPING"), wrong hrefs on homepage buttons, zero reviews, no email popup.

### TCB Collections (1TrueDispensery)
- ✅ Age Gate, Hero, Collections Grid
- ❌ Deals, Discounts, Rewards, Strains, About, CTA

### HOO Site (herrmanonlineoutlook.com)
- ✅ ALL 6 SECTIONS LIVE (Hero, Process, Our Work, What's Included, Pricing, Contact)
- Readability fix applied 2026-03-12 (opacity 0.5-0.78)

---

## Session Log (newest first)

| Date | What Happened |
|---|---|
| 2026-03-16 | Email rewrite: plain text only, "concrete worker / Local 1290" angle, live GitHub Pages URL (no attachments, no HTML). Clean PascalCase demo filenames (HappyYardsKc.html). Auto-push demos on send. Call Queue routing fixed (no-email leads auto-route). Approvals tab shows only pending+email. Updated all location refs from Independence to Kansas City. New batches: food/restaurant (LEAD-043-046), landscaping (LEAD-050-053). |
| 2026-03-15 | Full HOO loop: found Hammer Hands Restoration, built demo, sent email live, queued social content. Fixed n8n sandbox, dashboard bugs, auto-prototype double-LEAD prefix. Added --demo flag + Template 7 to email engine. Added Partner Dashboard btn. |
| 2026-03-15 | v6.0 built — Crawl4AI + Twilio + n8n + Social Engine. Shopify Partner added everywhere. |
| 2026-03-15 | v5.0-5.2 — Jake Van Clief 4-layer architecture, skills layer, memory folder, AGENTS.md |
| 2026-03-13 | 14 emails sent via SMTP to pipeline leads |
| 2026-03-13 | Lead engine v2.5 built with 25 leads, 5 CLI tools |

---

## Key Architecture Decisions (2026-03-16)
- **Email = plain text only.** HTML emails hit spam filters (especially Gmail→Yahoo/corporate). No attachments.
- **Demo URLs = GitHub Pages.** `https://matthew-creat3e.github.io/hoo-intelligence/demos/{PascalCaseName}.html`
- **Auto-push on send.** Both `addEmail()` in pipeline-orchestrator and `approve-lead` in dashboard/main.js copy demo to `/demos/` with clean name, then git add/commit/push.
- **Command Center routing:** Has email → Approvals tab. No email → Call Queue. Sent/rejected → Pipeline only.

---

## Topic Files (load on demand)
| File | Contents |
|---|---|
| `memory/build-patterns.md` | CSS/JS patterns, anti-patterns, Shopify gotchas |
| `memory/lead-intel.md` | Outreach results by industry, template performance |
| `memory/social-intel.json` | Social post performance data (auto-updated) |

# HOO Auto-Memory v6.0
**Claude writes this. Matthew writes CLAUDE.md.**
**Updated every session. First 200 lines load automatically.**

---

## Active Reminders (check these every session)

| Priority | Item | Action |
|---|---|---|
| 🔴 URGENT | Apply for Shopify Partner Program | Go to partners.shopify.com — 15 min, free, passive income on every client |
| 🔴 URGENT | Call Glendon Thomas | (816) 569-4465 — #1 lead, still not called |
| 🔴 URGENT | Follow up with Joe's Mobile Mechanic | Status: MAYBE — resent fixed link 2026-03-20. Follow up in 1-2 days |
| 🟡 IMPORTANT | Follow-up emails overdue | 14 emails sent 2026-03-13 — 7 days overdue |
| 🟡 IMPORTANT | Post social content | Multiple posts queued in social-engine/queue/ — review & post |
| 🟡 IMPORTANT | Call Queue: 11 leads need emails | No-email leads in Call Queue — call, get emails, send demos |
| 🟢 ENGINE | Configure Twilio | Sign up twilio.com, add to `.env` — would unlock phone-only leads |

---

## Pipeline State (as of 2026-03-20 end of session 2)

| Metric | Value |
|---|---|
| Total leads | 86 (LEAD-001 through LEAD-086) |
| Approvals | 52 files |
| Pending | 15 |
| Sent | 28 |
| Rejected | 8 |
| Maybe | 1 (Joe's Mobile Mechanic — first response!) |
| Industries | Cleaning, moving, detailing, barber, food/restaurant, landscaping, mobile mechanic |
| Email format | Plain text only — "concrete worker / Local 1290" angle — live URL in body |
| Location | Kansas City, MO |
| MRR | $0 (pre-revenue) |

**Email flow:** Pipeline → Approval → War Room Approvals tab (if has email) or Call Queue (if no email) → Send → plain text email with GitHub Pages demo link → auto-push demos

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
- ✅ ALL 6 SECTIONS LIVE

---

## Session Log (newest first)

| Date | What Happened |
|---|---|
| 2026-03-20 | Session 2: Ran cleaning batch — LEAD-079-086 (KC cleaning businesses). All demos pushed to GitHub Pages. Pipeline now at 52 approvals, 86 total leads. |
| 2026-03-20 | Session 1: Fixed War Room nodemailer path bug, added error dialogs. Fixed pipeline JSON parsing (bracket-matching), stronger prompt, max_tokens 4000, rate limit 90s. Disabled HTML in email-engine.js. Resent Joe's Mobile Mechanic — status: MAYBE. New batches: mechanics, lawn, detailing (LEAD-057-078). |
| 2026-03-16 | Email rewrite: plain text only, "concrete worker / Local 1290" angle, live GitHub Pages URL. Clean PascalCase demo filenames. Auto-push demos on send. Call Queue routing fixed. Updated location refs Independence → Kansas City. New batches: food/restaurant, landscaping. |
| 2026-03-15 | Full HOO loop: Hammer Hands demo + email. Fixed n8n sandbox, dashboard bugs. Added --demo flag + Template 7. |
| 2026-03-15 | v6.0 built — Crawl4AI + Twilio + n8n + Social Engine. Shopify Partner added. |
| 2026-03-15 | v5.0-5.2 — Jake Van Clief 4-layer architecture, skills layer, memory folder, AGENTS.md |
| 2026-03-13 | 14 emails sent via SMTP. Lead engine v2.5 built with 25 leads. |

---

## Key Architecture Decisions
- **Email = plain text only.** HTML hits spam filters. No attachments.
- **Demo URLs = GitHub Pages.** `https://matthew-creat3e.github.io/hoo-intelligence/demos/{PascalCaseName}.html`
- **Auto-push on send.** addEmail() and approve-lead both copy demo to /demos/ with clean name, git push.
- **War Room routing:** Has email → Approvals tab. No email → Call Queue. Sent/rejected → Pipeline only.
- **Pipeline JSON fix (2026-03-20):** Bracket-matching parser, stronger JSON-only prompt, 4000 max_tokens.
- **dashboard/main.js requires nodemailer from engine/tools/node_modules/** — not root node_modules.

---

## Topic Files (load on demand)
| File | Contents |
|---|---|
| `memory/build-patterns.md` | CSS/JS patterns, anti-patterns, Shopify gotchas |
| `memory/lead-intel.md` | Outreach results by industry, template performance |
| `memory/social-intel.json` | Social post performance data (auto-updated) |

# HOO Auto-Memory v6.0
**Claude writes this. Matthew writes CLAUDE.md.**
**Updated every session. First 200 lines load automatically.**

---

## Active Reminders (check these every session)

| Priority | Item | Action |
|---|---|---|
| 🔴 URGENT | Apply for Shopify Partner Program | Go to partners.shopify.com — 15 min, free, passive income on every client |
| 🔴 URGENT | Matthew call Top 5 leads | Glendon Thomas (816) 569-4465 is #1 — hasn't been called yet |
| 🟡 IMPORTANT | Follow-up emails due 2026-03-16 | 14 emails sent 2026-03-13 — 3-day mark |
| 🟡 IMPORTANT | Text/DM 11 phone-only leads | LEAD-001,002,003,015,016,019,020,022,024 — no email |
| 🟢 ENGINE | Install Crawl4AI | `pip install crawl4ai playwright && playwright install chromium` |
| 🟢 ENGINE | Set up n8n Docker | See `n8n/SETUP.md` — free, takes 30 min |
| 🟢 ENGINE | Configure Twilio | Sign up twilio.com, add to `.env`, run `node sms-engine.js test` |
| 🟢 SOCIAL | Generate content library | `node social-engine/post-manager.js library` — free, immediate |

---

## Pipeline State (as of 2026-03-15)

| Metric | Value |
|---|---|
| Total leads | 25 |
| HOT | 23 |
| WARM | 2 |
| Emailed | 14 (sent 2026-03-13) |
| Responded | 0 (too early) |
| Phone-only | 11 (need Twilio or manual call) |
| DM-only | 2 |
| Closed | 0 |
| MRR | $0 (pre-revenue) |

**Follow-up schedule:**
- 2026-03-16: Check all 14 emailed leads, send follow-up to non-responders
- 2026-03-20: Second follow-up wave (Template 6)

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
| 2026-03-15 | v6.0 built — Crawl4AI + Twilio + n8n + Social Engine. Shopify Partner added everywhere. |
| 2026-03-15 | v5.2 packaged — Shopify Partner data added to business/learning/engines-catalog |
| 2026-03-15 | v5.1 built — Skills layer, memory folder, AGENTS.md, naming conventions |
| 2026-03-15 | v5.0 built — Jake Van Clief 4-layer architecture from 23-file flat export |
| 2026-03-13 | 14 emails sent via SMTP to pipeline leads |
| 2026-03-13 | Lead engine v2.5 built with 25 leads, 5 CLI tools |

---

## Topic Files (load on demand)
| File | Contents |
|---|---|
| `memory/build-patterns.md` | CSS/JS patterns, anti-patterns, Shopify gotchas |
| `memory/lead-intel.md` | Outreach results by industry, template performance |
| `memory/social-intel.json` | Social post performance data (auto-updated) |

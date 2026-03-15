# HOO Auto-Memory v6.0
**Claude writes this. Matthew writes CLAUDE.md.**
**Updated every session. First 200 lines load automatically.**

---

## Active Reminders (check these every session)

| Priority | Item | Action |
|---|---|---|
| 🔴 URGENT | Apply for Shopify Partner Program | Go to partners.shopify.com — 15 min, free, passive income on every client |
| 🔴 URGENT | Call Glendon Thomas | (816) 569-4465 — #1 lead, still not called |
| 🔴 URGENT | Follow up with Hammer Hands Restoration | (816) 398-2644 — demo email sent 2026-03-15, call in 24-48hrs |
| 🟡 IMPORTANT | Follow-up emails due 2026-03-16 | 14 emails sent 2026-03-13 — 3-day mark tomorrow |
| 🟡 IMPORTANT | Post social content | 2 posts queued: God Quest + Hammer Hands — review & post to Facebook/IG/TikTok |
| 🟡 IMPORTANT | Text/DM 11 phone-only leads | Need Twilio or manual calls |
| 🟢 ENGINE | Install Crawl4AI | `pip install crawl4ai playwright && playwright install chromium` |
| 🟢 ENGINE | Configure Twilio | Sign up twilio.com, add to `.env`, run `node sms-engine.js test` |

---

## Pipeline State (as of 2026-03-15 end of session)

| Metric | Value |
|---|---|
| Total leads | 26 (added Hammer Hands Restoration) |
| HOT | 24 |
| WARM | 2 |
| Emailed | 16 (14 from 2026-03-13 + Glendon test + Hammer Hands demo) |
| Demos sent | 1 (Hammer Hands — Template 7 with HTML attachment) |
| Responded | 0 |
| Phone-only | 10 |
| DM-only | 2 |
| Closed | 0 |
| MRR | $0 (pre-revenue) |

**Follow-up schedule:**
- 2026-03-16: Check all 14 emailed leads, send follow-up to non-responders
- 2026-03-17: Call Hammer Hands Restoration — demo is fresh in their inbox
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

### Demos Built
- ✅ LEAD-TEST-001 — Tattoos by Glendon (tattoo, Liberty)
- ✅ LEAD-002 — Hammer Hands Restoration (handyman, Independence)

---

## Session Log (newest first)

| Date | What Happened |
|---|---|
| 2026-03-15 | Full HOO loop: found Hammer Hands Restoration, built demo, sent email live, queued social content. Fixed n8n sandbox (fs removed from 3 nodes), dashboard bugs (copyText, openLink, missing IDs), auto-prototype double-LEAD prefix. Added --demo flag + Template 7 to email engine. Added Partner Dashboard btn to War Room. |
| 2026-03-15 | v6.0 built — Crawl4AI + Twilio + n8n + Social Engine. Shopify Partner added everywhere. |
| 2026-03-15 | v5.2 packaged — Shopify Partner data added to business/learning/engines-catalog |
| 2026-03-15 | v5.1 built — Skills layer, memory folder, AGENTS.md, naming conventions |
| 2026-03-15 | v5.0 built — Jake Van Clief 4-layer architecture from 23-file flat export |
| 2026-03-13 | 14 emails sent via SMTP to pipeline leads |
| 2026-03-13 | Lead engine v2.5 built with 25 leads, 5 CLI tools |

---

## Social Queue

| File | Store | Status |
|---|---|---|
| SOCIAL-2026-03-15-god-quest-collection.json | NoReturn Apparel — God Quest | queued |
| SOCIAL-2026-03-15-hammer-hands-restoration.json | Hammer Hands Restoration — Demo | queued |

---

## Topic Files (load on demand)
| File | Contents |
|---|---|
| `memory/build-patterns.md` | CSS/JS patterns, anti-patterns, Shopify gotchas |
| `memory/lead-intel.md` | Outreach results by industry, template performance |
| `memory/social-intel.json` | Social post performance data (auto-updated) |

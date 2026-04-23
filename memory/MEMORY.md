# HOO Auto-Memory v6.0
**Claude writes this. Matthew writes CLAUDE.md.**
**Updated every session. First 200 lines load automatically.**

---

## Active Reminders (check these every session)

| Priority | Item | Action |
|---|---|---|
| 🔴 URGENT | Apply for Shopify Partner Program | Go to partners.shopify.com — 15 min, free, passive income on every client |
| 🔴 URGENT | Hunt fresh leads | Pipeline wiped clean — fill it with new v3 premium demos |
| 🟡 IMPORTANT | Post social content | Multiple posts queued in social-engine/queue/ — review & post |
| 🟡 IMPORTANT | Call Queue leads need emails | No-email leads in Call Queue — call, get emails, send demos |
| 🟢 ENGINE | Configure Twilio | Sign up twilio.com, add to `.env` — would unlock phone-only leads |

---

## Pipeline State (as of 2026-03-24)

| Metric | Value |
|---|---|
| Total leads | 0 (FRESH START — wiped old pipeline for v3 premium demos) |
| Approvals | 0 |
| Pending | 0 |
| Sent | 0 |
| Rejected | 0 |
| Replied | 0 |
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
| 2026-03-26 | **V4 DEMOS: Roofing LOCKED + Cleaning LOCKED (girly blush/rose inspection report).** Fixed barber + cleaning demos. **17 V4 demos locked total. NEXT:** Fencing (last one). Rebuilt HOO Our Work section — 14 clickable cards (12 V4 demos + 2 real stores), hero photos, "View Live Demo" links, counter strip. Added HOO protection to all 17 demos (right-click block, dev tools block, text select block, watermark, console warning). Full engine audit: fixed model ID in pipeline-orchestrator (`claude-haiku-4-5`), removed dead circular require in pexels-engine, added film grain to 8 demos missing it, fixed food truck grain opacity. All 17 demos pass 10-point quality check. Demos copied to `demos/` for GitHub Pages — **NOT YET PUSHED.** |
| 2026-03-25 | **V4 DEMOS: 7 MORE LOCKED THIS SESSION.** Handyman, Painting, Landscaping, Moving, Auto Detailing (5 iterations — dark+coral mosaic hero, Bebas+Space Grotesk), Pet Grooming (light teal+coral, DM Serif+Poppins, wellness bar, filterable gallery, competitor-modeled after Scenthound/Barkbus/Dogtopia), Personal Training (dark charcoal+red, Outfit font, result-promise hero, transformation metrics, trainer profile card). **13 V4 demos locked total. NEXT:** Pressure Washing, Food Truck, Roofing, Fencing, Photography (~5 remaining). |
| 2026-03-24 | **V4 DEMOS: AUTO REPAIR + TATTOO LOCKED.** Built Precision Auto KC (light navy/gold, split hero, instant quote, how-it-works, FAQ, location cards, counter strip, premium reviews). Built Iron & Ink Tattoo (dark red, Anton font, cinematic split hero w/ outline text, tattoo photo gallery, style cards WITH images, hexagonal artist portraits, diamond radio buttons, sharp edges — zero rounded corners). Updated HOO site "Our Work" section (`outputs/hoo-site/our-work-section.html`) — swapped 4 old generic cards for V4 demos (Auto Repair, Tattoo, Barber, Junk Removal), kept NoReturn + 1TrueDispensery. Cleaned old LEAD demo files. **6 V4 demos locked total.** **NEXT:** ~11 industries remaining (food truck, painting, pressure washing, lawn care, moving, handyman, photography, personal training, pet grooming, plumbing/HVAC, auto detailing). |
| 2026-03-24 | **V4 DESIGN SYSTEM LOCKED.** Built & approved 3 industry demos (cleaning, barber, junk removal) + NoReturn streetwear as gold standard. All demos upgraded with NoReturn premium UI: custom cursor, film grain, glassmorphic cards, clip-path reveals, parallax zoom, glow orbs. Created v4-design-system.md memory with all locked templates. |
| 2026-03-24 | v5 premium demo design approved → baked into auto-prototype v3.0 (all light themes, editorial layout, split hero, numbered pillars, staggered reviews). Photo library seeded for all 18 industries (37-58 photos each). Shopify section converter (`demo-to-shopify.js`) built and tested — splits demos into 7 paste-ready Custom Liquid sections. Tested on LEAD-081. |
| 2026-03-22 | Updated War Room dashboard: real pipeline data (105 leads, 65 approvals, 30 sent, 1 reply), updated Today's Briefing tasks, Top 5 Calls now pulls highest-score leads with phones, static fallback data refreshed with 13 real leads, industry learning stats updated. Desktop launcher confirmed pointing to workspace. |
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
- **Desktop War Room:** .bat + .html + .lnk all point to workspace dashboard/index.html — no separate copy to sync.
- **Demo design = V4 industry-specific (2026-03-24).** Each industry gets unique sections, theme, copy, photos. NoReturn premium UI on ALL demos (cursor, film grain, glassmorphic, clip-path, parallax zoom, glow orbs). 4 theme modes: light/dark/bold/premium. See `v4-design-system.md` memory for full spec.
- **V4 demos = engine templates (2026-03-26).** Engine uses locked V4 demos as base templates per industry. For each new lead it ONLY swaps: CSS custom properties (colors), font-family refs, business name/city/phone, section copy/headlines, and photos. Structure/layout/unique features stay identical. No rebuild needed per lead.
- **Photo library = curated first, API fallback.** `getCuratedPhotos()` pulls from `engine/data/photo-library.json` with 7-day recency tracking.
- **Shopify converter = `demo-to-shopify.js`.** Splits demo HTML into 7 Custom Liquid sections. No Liquid tags — pure HTML/CSS/JS.

---

## Topic Files (load on demand)
| File | Contents |
|---|---|
| `memory/build-patterns.md` | CSS/JS patterns, anti-patterns, Shopify gotchas |
| `memory/lead-intel.md` | Outreach results by industry, template performance |
| `memory/social-intel.json` | Social post performance data (auto-updated) |
| `~/.claude/.../memory/build-v5-design.md` | v5 premium demo design patterns (split hero, light themes, editorial layout) — approved by Matthew |
| `engine/data/photo-library.json` | Curated photo database — 18 industries, 37-58 photos each, keyed by industry/slot |
| `engine/tools/demo-to-shopify.js` | Splits approved demo HTML into 7 paste-ready Shopify Custom Liquid sections |
| `~/.claude/.../memory/v4-design-system.md` | **V4 locked-in demo templates** — 6 approved industry designs (cleaning, barber, junk removal, auto repair, tattoo, streetwear), theme modes, quote styles, section libraries, UI patterns |
| `outputs/hoo-site/our-work-section.html` | HOO site "Our Work" Custom Liquid section — 6 before/after carousel cards |

---

## V4 Locked Demo Templates (2026-03-24)
| Industry | File | Theme | Quote Style |
|---|---|---|---|
| Cleaning | `outputs/demos/v4-cleaning-demo.html` | Blush/rose/lavender (Playfair+Nunito+DM Mono) | Inspection report, 40-pt checklist, SVG score gauge, room bars, sparkle particles, ornamental dividers, promise strip |
| Barber | `outputs/demos/v4-barber-demo.html` | Dark gold | No quote — menu pricing |
| Junk Removal | `outputs/demos/v4-junk-removal-demo.html` | Light orange | Tier cards + truck fill |
| Auto Repair | `outputs/demos/v4-auto-repair-demo.html` | Light navy/gold | Radio-card quote + result bar |
| Tattoo | `outputs/demos/v4-tattoo-demo.html` | Dark red (Anton font) | Radio-card pricing, sharp edges |
| Streetwear | `outputs/demos/noreturn-apparel-v4-demo.html` | Dark gold | No quote — e-commerce |
| Handyman | `outputs/demos/v4-handyman-demo.html` | Rust/olive | Tool-grid hero |
| Painting | `outputs/demos/v4-painting-demo.html` | Sage/terracotta (DM Serif) | Room estimator, real B/A |
| Landscaping | `outputs/demos/v4-landscaping-demo.html` | Olive/sandstone/copper | Cinematic hero, masonry, seasonal |
| Moving | `outputs/demos/v4-moving-demo.html` | Navy/orange (Space Grotesk) | Embedded quote form, move calc |
| Auto Detailing | `outputs/demos/v4-auto-detailing-demo.html` | Dark+coral (Bebas+Space Grotesk) | Mosaic hero, topbar, quote breaks |
| Pet Grooming | `outputs/demos/v4-pet-grooming-demo.html` | Light teal+coral (DM Serif+Poppins) | Wellness bar, size selector, filterable gallery, team certs |
| Personal Training | `outputs/demos/v4-personal-training-demo.html` | Dark charcoal+red (Outfit) | Result-promise hero, transformation metrics, trainer profile, 3 programs |
| Food Truck | `outputs/demos/v4-food-truck-demo.html` | Dark chalkboard (Permanent Marker+Caveat) | Chalkboard menu board, tilted elements, dashed borders, sold-out state, photo strip |
| Photography | `outputs/demos/v4-photography-demo.html` | Dark+red viewfinder (Space Mono+Cormorant Garamond) | Camera viewfinder hero, EXIF overlays, film strip horizontal scroll, grayscale→color hover, REC indicator, exposure meter |
| Pressure Washing | `outputs/demos/v4-pressure-washing-demo.html` | Light blue+navy (Anton+Inter) | PSI counter animation, before/after slider, water mist glow, gauge stat cards, trust strip, action photo |
| Roofing | `outputs/demos/v4-roofing-demo.html` | Dark navy+cyan+orange (Rajdhani+Exo 2) | Storm tracker command center, radar sweep animation, severity meter, before/after slider, animated counters, emergency CTA |

## HOO Site Sections (Custom Liquid)
| Section | File | Status |
|---|---|---|
| Our Work | `outputs/hoo-site/our-work-section.html` | READY — 14 cards (Roofing, Cleaning, NoReturn, Tattoo, Photography, 1True, Food Truck, Personal Training, Barber, Pressure Washing, Auto Detailing, Pet Grooming, Auto Repair, Landscaping) |

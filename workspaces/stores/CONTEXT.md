# STORES WORKSPACE — Layer 2
**Loaded when:** noreturn / TCB / dispensary / HOO site / store / audit / scrape

---

## Inputs This Workspace Loads

| Source | File | Sections Needed |
|---|---|---|
| Store state | This file | Store requested |
| Build details | `workspaces/stores/noreturn-status.md` | NoReturn builds |
| Site code | `workspaces/stores/hoo-site-code.md` | HOO section code |
| Build rules | `workspaces/build/CONTEXT.md` | If doing a build |
| Product data | `C:\Users\Matth\Downloads\products_export.zip` | Products CSV |
| Global nav | `hoo-workspace/outputs/noreturn-global-nav/collection-navigator.html` | v3 nav code |

---

## Canonical CDN Base
`https://cdn.shopify.com/s/files/1/0658/1911/5587/files/`

CDN Screenshots:
- `nr-homepage-showcase.png` | `nr-god-quest-showcase.png` | `nr-best-sellers-showcase.png`
- `god-quest-fold.png` | `homepage-fold.png` | `best-sellers-fold.png`
- `preview.webp` (NoReturn before) | `preview_3.webp` (TCB after)

---

## Store 1: NoReturn Apparel

**URL:** noreturnapparel.com  
**Platform:** Shopify + Printify  
**Theme:** Xclusive v3.2.0  
**Category:** Faith streetwear  
**Voice:** Inspirational, authentic, scripture-driven  
**Rule:** Always include scripture callout on product descriptions  

### Pricing
```
Tees: $25 | Hoodies: $50 | Long Sleeves: $28 | Hats: $24 | Stickers: $8
NO free shipping — use "5% off auto-applied" bundle discount
Bundle: Hoodie+Tee = $70 (save $5) | Hoodie+Tee+Hat = $90 (save $9)
```

### Collection Handles & Accent Colors
```
/collections/best-sellers                                                 → gold    #C8952E
/collections/god-quest-hoodies                                            → purple  #6C3483
/collections/fatherhood-ascended-collection                               → gold    #C8952E
/collections/no-return®-anime-tees-dark-aesthetic-story-driven-streetwear → blue    #3b82f6
/collections/no-return®-live-or-die-collection-...                        → red     #C0392B
/collections/no-return-caps-dad-hats-streetwear-headwear-adjustable-edgy  → green   #059669
/collections/all                                                           → gold    #C8952E
```

### Collection Build Status
| Collection | File | Status |
|---|---|---|
| God Quest | `outputs/noreturn-god-quest/god-quest-collection.html` | ✅ LIVE — gold standard |
| Best Sellers | `outputs/noreturn-best-sellers/best-sellers-collection.html` | ✅ LIVE |
| Anime | `outputs/noreturn-anime/` | ✅ LIVE |
| Fatherhood Ascended | `outputs/noreturn-fatherhood-ascended/` | ✅ LIVE |
| No Return (Core) | `outputs/noreturn-no-return/no-return-collection.html` | ⚠️ BUILT, NOT PASTED |
| Collections Landing | `outputs/noreturn-collections/collections-page.html` | ⚠️ BUILT, NOT PASTED |
| Hats & Headwear | `outputs/noreturn-hats/hats-collection.html` | ⚠️ BUILT, NOT PASTED |
| Live or Die | — | ❌ NOT BUILT |
| New Arrivals | — | ❌ NOT BUILT |

### Global Sections (NoReturn)
| Section | Status |
|---|---|
| Collection Navigator v3 | ✅ LIVE on all collection pages |
| Trust Strip | ✅ LIVE — context-aware colors per collection |
| Cross-Sell (Collections page) | ✅ LIVE on homepage |
| Cross-Sell (Product page) | ✅ LIVE — Liquid-based, 3 cards |

### Missing Products (No Return Core — 4 products)
1. 404 Feelings Not Found Hoodie — not in CSV export
2. Steel Mind Hoodie — Matthew will provide
3. No Return Astronaut Cap — not found
4. Lost in This Hoodie — not found

### Known Issues (fix priority)
- ❌ Header has TWO marquees — one says "FREE SHIPPING $75+" (fix in Admin)
- ❌ Homepage "VIEW ALL COLLECTIONS" href wrong (should be `/collections`)
- ❌ Homepage "SHOP ALL PIECES" href wrong (should be `/collections`)
- ❌ Zero reviews (Judge.me installed but empty)
- ❌ No email capture popup
- ❌ No announcement bar
- ❌ Cart page has no conversion optimization

---

## Store 2: TCB Collections / 1TrueDispensery

**Platform:** Shopify  
**Category:** Premium cannabis  
**Voice:** Chill, premium, welcoming, compliant  
**Note:** DEMO STORE — presented on HOO site as real client build. NOT a real client.  

### Collections
`/flower /edibles /concentrates /vapes /accessories`

### Build Status
| Section | Status |
|---|---|
| Age Gate (21+ sessionStorage) | ✅ BUILT |
| Hero (gold particles) | ✅ BUILT |
| Collections Grid | ✅ BUILT |
| Deals | ❌ NOT BUILT |
| Discounts | ❌ NOT BUILT |
| Rewards | ❌ NOT BUILT |
| Strains Grid | ❌ NOT BUILT |
| About | ❌ NOT BUILT |
| CTA | ❌ NOT BUILT |

### Compliance Rules (never violate)
- Age gate on EVERY page load (sessionStorage persists for session only)
- Lab-tested badge on products
- Legal disclaimer visible
- No medical claims — ever

---

## Store 3: HOO (herrmanonlineoutlook.com)

**Platform:** Shopify Custom Liquid  
**Category:** Web building service  
**Voice:** Direct, results-focused, blue-collar professional  
**Stats:** 2 industries / $39/mo / $0 upfront  

### Design System
```
BG:     #050505 / #080808
Gold:   #C8952E (primary) / #E8B84B (hover)
Text:   #F0EAE0
Fonts:  Bebas Neue (headings) | Syne (body) | Cormorant Garamond (logo subtitle)
IO:     prefix-pop → prefix-vis on intersect
Tickers: 20-24s infinite linear, repeating with dots
```

### HOO Site Build Status — ALL 6 SECTIONS COMPLETE ✅
| # | File | Section ID | Status |
|---|---|---|---|
| 1 | `hoo-hero.html` | `#hoo-hero` | ✅ LIVE |
| 2 | `hoo-process.html` | `#hoo-hiw` | ✅ LIVE |
| 3 | `hoo-work.html` | `#hoo-work` | ✅ LIVE |
| 4 | `hoo-whats-included.html` | `#hoo-wyg` | ✅ LIVE |
| 5 | `hoo-pricing.html` | `#hoo-pricing` | ✅ LIVE |
| 6 | `hoo-contact-form.html` | `#hoo-cta` | ✅ LIVE |

Code location: `C:\Users\Matth\hoo-workspace\outputs\hoo-site\`

### HOO Key Details
```
Phone:     (804) 957-1003
Email:     herrmanonlineoutlook@gmail.com
Location:  Independence, MO
Formspree: xaqpwgkd
```

### Readability Fix (applied 2026-03-12)
All body text opacity: 0.5-0.78 range (was broken at 0.2-0.45)

---

## Auditor Tools

### HOO Auditor V2 — PREFERRED (works on any site)
`C:\Users\Matth\hoo-workspace\tools\hoo-audit.js`
```bash
export PATH="/c/Program Files/nodejs:$PATH"
cd C:/Users/Matth/hoo-workspace/tools
node hoo-audit.js https://example.com            # Desktop
node hoo-audit.js https://example.com --mobile    # Mobile
node hoo-audit.js https://example.com --both      # Both
```

**Detects:** above-fold content, headings hierarchy, CTAs, images+alt, trust signals, forms, performance, 10-point conversion scorecard  
**Output:** `outputs/audits/screenshots/` + `outputs/audits/*.json`

### Legacy Scraper (NoReturn only)
`C:\Users\Matth\hoo-workspace\tools\customer-view.js` — visible elements + screenshots

---

## Product Data
`C:\Users\Matth\Downloads\products_export.zip` → `products_export.csv` (2026-03-11)  
Contains: all NoReturn products, handles, titles, prices, image URLs, metafields

---

## Screenshot Protocol
1. Extract all visuals (colors, fonts, layout, CTAs, images, copy)
2. Confirm back: "I can see [X]. Match / improve / replace?"
3. Build from extraction
4. Flag unknowns — one question only

Competitor: list what they have vs client → identify gaps → offer to build missing  
Own site: audit working/broken/missing → offer fixes

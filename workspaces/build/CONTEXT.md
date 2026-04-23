# BUILD WORKSPACE — Layer 2
**Loaded when:** build / section / hero / code / CSS / design

---

## Inputs This Workspace Loads

| Source | File | Sections Needed |
|---|---|---|
| Design tokens | This file | Design Tokens section |
| Section templates | `reference/section-templates.md` | Specific section only |
| Site types | `reference/site-types.md` | Matched industry only |
| Global components | `reference/global-components.md` | Component requested |
| Shopify architecture | `reference/shopify-arch.md` | As needed |
| Specific store state | `workspaces/stores/CONTEXT.md` | Current build status |

---

## Code Structure (every section — no exceptions)
```
Google Fonts link → <style> → <section class="hoo-[name]"> → <script> in IIFE
```
One section per response. One copyable block. Paste-and-go.

---

## Hard Rules
- NO `{{ }}`, `{% %}`, schema tags, external files, or frameworks
- Vanilla CSS/JS only — Grid/Flex only (no floats, no tables)
- Code output in chat only — no file tools, no artifacts
- All links = real Shopify URLs — never `#`
- Hero always: gold particles + sticky nav + progress bar + line-reveal headline
- **V6 PREMIUM STANDARD (all new demos — non-negotiable):**
  - Reference file: `demos/v6-roofing-final-demo.html`
  - Full spec: `memory/feedback-v6-demo-direction.md`
  - Shopify sections: `outputs/shopify-sections/roofing-v6/`
  - **Hero:** Dark bg, faded industry photo, radar animation, status badges, direct form (name/phone/email/address/service), stats row
  - **Stats:** Dark section, animated counters on scroll, hover details, progress bars
  - **Services:** Tabbed interface (NOT card grid), cert badges, faded bg image, each tab = image + features + CTA + mini stats
  - **Quote Wizard:** Dark glassmorphism, 3-step tile picker (service → urgency → contact)
  - **Portfolio:** Before/after drag slider + clickable project cards
  - **Reviews:** Big score + cert badges + 3-col review cards
  - **Service Area Map:** Working Google Maps embed + city lists
  - **FAQ:** Accordion + dark CTA card with phone
  - **Nav:** Dark glass command center, radar logo, services dropdown, phone number, CTA button
  - **Images:** Real industry-specific Pexels photos (verified URLs), NOT generic stock
  - **Fonts:** Oswald headlines, Inter body — accent color per client
  - **Every demo → Shopify Custom Liquid sections** (self-contained .liquid files with schema)

---

## Design Tokens (HOO default — always use unless client overrides)
```
BG:         #050505
Gold:       #C8952E / #E8B84B (hover)
Text:       #F0EAE0
Headlines:  Bebas Neue
Body:       Syne
Logo sub:   Cormorant Garamond
```

## Color Palette (always confirm before build)
```
gold          #C8952E / #E8B84B
black         #050505
charcoal      #1C1C1C
forest green  #2D6A4F
deep green    #1A5C38
navy          #0A1628
red           #C0392B
purple        #6C3483
burnt orange  #CC5500
sky blue      #3498DB
cream         #F5F0E8
white         #F5F5F5
```
Always generate +30-40 lightened variant for hover states.

## Fonts by Industry
```
LOCAL/TRADES:   Bebas Neue, Oswald, Barlow Condensed
CANNABIS:       Rajdhani, Oswald, Bebas Neue
FAITH:          Bebas Neue, Playfair Display, Montserrat
ECOMMERCE:      Bebas Neue, Barlow Condensed, Anton
RESTAURANT:     Playfair Display, Oswald, Bebas Neue
PROFESSIONAL:   Playfair Display, Raleway, Oswald
AUTO/TRADES:    Bebas Neue, Oswald, Barlow Condensed
```

---

## Performance Rules
```
Animations:     transform/opacity only — no layout-triggering props
will-change:    on all animated elements
Canvas/rAF:     requestAnimationFrame for particles
CSS vars:       at top of <style>, scoped to section
IIFE:           wraps ALL <script> blocks
Selectors:      cache all querySelector results
```

## Responsive Breakpoints
```
Mobile  ≤768px:   1 col, clamp() for type, 44px min touch targets, 20px padding, max 2-col product grid
Tablet  769-1024: 2 col, 32px padding
Desktop 1025px+:  3-4 col, 40-60px padding, max-width centered
```

## Animation Pattern
```css
/* All scroll animations follow this pattern */
.prefix-pop { opacity: 0; transform: translateY(20px); transition: all .5s ease; }
.prefix-vis { opacity: 1; transform: none; }
/* IntersectionObserver threshold: 0.1 — adds 'prefix-vis' class on entry */
```

---

## CSS Rules
- Compact single-line properties
- CSS vars at top of `<style>` block, scoped to section
- Prefix ALL classes with section code: `hoo-` `hiw-` `hw-` `wyg-` `hp-` `hc-` `nr-gq-` `nr-fa-`
- Every section: IO scroll-pop pattern
- Premium easing: `cubic-bezier(0.25, 0.46, 0.45, 0.94)`
- Hover: border-color change on cards

---

## Section Quick-Reference

| Section | Key Elements |
|---|---|
| HERO (V6) | Sticky nav w/ logo image + phone + CTA btn, two-column: LEFT = tag + H1 + sub + stats, RIGHT = quote form (name/phone/email/service). Form ABOVE FOLD. Trust bar below hero. |
| HERO (V5/legacy) | Sticky nav, 3px gold progress bar, 60 gold particles slow drift, line-reveal H1, sub fade-in .5s, dual CTA, 3 stats, stagger animate |
| HOW IT WORKS | 3-step grid, numbered gold circles, connecting line (hidden mobile), IO slide-up |
| PRICING | 3-col Starter/Standard/Premium, middle featured gold border + MOST POPULAR, gold checks, CTA per card, stagger reveal |
| PORTFOLIO | Before/after grid, hover overlay, IO card reveals |
| PROCESS | Vertical timeline mobile, alternating desktop, numbered gold circles, vertical gold line |
| FAQ | Accordion, max-height transition, gold chevron rotates 45°, one open at a time, IO fade-in |
| CTA | Oversized headline, 2-line copy, gold glow button, urgency line, radial gold bg |
| TESTIMONIALS | 3-col cards, gold stars, quote+name+title, IO reveals |
| AGE GATE | Full viewport overlay, 21+ verify, YES/NO, sessionStorage, fade-out on YES |
| STRAINS | 3-col cards, type badge (Indica purple/Sativa green/Hybrid gold), THC%/CBD%, effect tags |

→ Full section code templates: `reference/section-templates.md`

---

## Collection Page Standard (God Quest is the gold standard — MINIMUM bar)
NEVER just a product grid. Full collection = ALL of:
1. **HERO** — glow bg + watermark icon + label + title (word colored) + sub + 3 stats + quote card
2. **STICKY TABS** — filter buttons with counts + free shipping reminder
3. **PRODUCT GRID** — 4-col desktop / 3-col tablet / 2-col mobile. Full `<a>` card, aspect-ratio:1, accent overlay, badges, stagger reveal
4. **SCRIPTURE BREAK** — between product groups, card with icon + ref + italic quote
5. **BUNDLE CTA** — gradient bg, accent border, real price math, CTA button
6. **CLOSING SCRIPTURE** — second verse
7. **SOCIAL PROOF** — avatar + stars + quote + name/title

## Card Rules
- Entire card = `<a>` tag — no nested links
- Overlay = accent color at 0.85 opacity
- Badge colors: accent=BEST SELLER, lighter accent=NEW, green=SALE
- Sale price: `<s>$65</s> $50`
- Hover: front image fades out, back image fades in (two `<img>` absolutely positioned, CSS `:has()` fallback)

---

## Image Handling
```
CDN URL provided  → embed directly
Non-CDN URL       → embed + TODO comment
No images given   → ask: solid color / gradient / particles?
Multiple images   → collect ALL URLs first, build at once
Upload path:      Shopify Admin → Settings → Files → copy CDN URL
```

---

## Shopify Architecture
- Bypass Liquid/schema entirely — pure HTML/CSS/JS → Custom Liquid section
- Content is hardcoded (no Liquid objects, no dynamic data)
- Real URLs only: `/collections/HANDLE` `/products/HANDLE` `/pages/HANDLE` `/cart`
- Add to Cart: `action="/cart/add" method="post"` + hidden variant ID input

## Store Build Phases
1. **FOUNDATION** — name, domain, industry, color, font, logo, theme (Dawn)
2. **GLOBAL** — Announcement bar, Header/Nav, Footer
3. **HOMEPAGE** — Hero, Featured Collections, Best Sellers, Brand Story, Testimonials, CTA
4. **COLLECTIONS** — Custom Liquid header per collection (product grid = Shopify native)
5. **PRODUCTS** — Description, callout, size guide, cross-sell, trust strip, mobile sticky ATC
6. **STATIC** — About, Contact, FAQ, Policy
7. **CART** — Trust badges, upsell (checkout = native, never modify)

---

## Quick Product Swap
When: "swap product" / "new drop" / "add product" / "remove product"
1. Ask: which collection, what change
2. Read existing HTML from `hoo-workspace/outputs/`
3. Edit ONLY changed card blocks
4. Update tab counts, hero stats if needed
5. Update bundle CTA math if prices changed
6. Output changed cards only

## Data-Driven Builds
- Check `C:\Users\Matth\Downloads\products_export.zip` → `products_export.csv` for real product data
- Use real CDN image URLs, real product handles, real prices
- Pull scripture metafields when available
- Save output to `hoo-workspace/outputs/<store-section>/`

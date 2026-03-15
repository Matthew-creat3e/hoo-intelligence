# Section Templates — Reference (Layer 3)
**Canonical source. Loaded selectively — load only the section you're building.**

---

## HERO (HOO default)
- Sticky nav (shrinks on scroll)
- Scroll progress bar (3px, gold, top of viewport)
- 60 gold particles — slow canvas drift (rAF)
- Line-reveal headline (Bebas Neue, stagger per word)
- Subtitle fade-in (.5s delay)
- Dual CTA buttons (primary gold, secondary ghost)
- 3 stats bar (stagger animate in)
- Full viewport height

**HOO site specific stats:** 2 industries / $39/mo / $0 upfront

---

## HOW IT WORKS
- 3-step grid
- Numbered gold circles (step indicators)
- Connecting line between steps (hidden on mobile)
- IO slide-up on each card

---

## PRICING
- 3-col: Starter / Standard / Premium
- Middle card featured: gold border + "MOST POPULAR" badge
- Gold checkmark list items
- CTA button per card
- Stagger reveal on scroll

---

## PORTFOLIO / OUR WORK
- Before/after grid
- Hover overlay with result metric
- IO card reveals on scroll
- Defaults: NoReturn + TCB transformations

---

## PROCESS (timeline)
- Vertical timeline on mobile
- Alternating left/right on desktop
- Numbered gold circles
- Vertical gold line connector
- IO slide-in per step

---

## FAQ (accordion)
- max-height transition (smooth open/close)
- Gold chevron icon — rotates 45° when open
- One item open at a time (others collapse)
- IO fade-in on page entry

---

## CTA (closing)
- Oversized Bebas Neue headline
- 2-line supporting copy
- Gold glow button (box-shadow pulse animation)
- Urgency line below button
- Radial gold gradient background

---

## TESTIMONIALS
- 3-col cards (2-col tablet, 1-col mobile)
- Gold stars (5-star default)
- Quote + name + title
- IO stagger reveal

---

## AGE GATE (cannabis only)
- Full viewport overlay (z-index highest)
- "21+ to enter" verify
- YES / NO buttons
- sessionStorage on YES (persists session, not page reload)
- Fade-out animation on YES
- Compliance: appears on every page load if sessionStorage cleared

---

## STRAINS GRID (cannabis)
- 3-col cards (2-col tablet, 1-col mobile)
- Type badge: Indica (purple) / Sativa (green) / Hybrid (gold)
- THC% / CBD% display
- Effect tags (up to 3)
- Color-coded left border per type
- Hover: card lifts, detail expands

---

## COLLECTION PAGE (God Quest gold standard — MINIMUM bar)
Full collection page always = ALL 7 of these components:

1. **HERO** — glow radial bg + watermark icon (low opacity) + category label + title (accent colored word) + sub + 3 stats + quote card
2. **STICKY TABS** — filter buttons with product counts + bundle reminder
3. **PRODUCT GRID** — 4-col desktop / 3-col tablet / 2-col mobile
   - Full `<a>` card wrapping (no nested links)
   - `aspect-ratio: 1` image container
   - Accent color overlay at 0.85 opacity on hover
   - Badges: BEST SELLER (accent) | NEW (lighter accent) | SALE (green)
   - Sale price: `<s>$65</s> $50`
   - Hover image swap: two `<img>` absolutely positioned, opacity crossfade
   - Stagger reveal via IO
4. **SCRIPTURE BREAK** — between product groups: icon + verse reference + italic quote card
5. **BUNDLE CTA** — gradient bg + accent border + "Complete the Look" + real price math + CTA
6. **CLOSING SCRIPTURE** — second verse, styled differently from first
7. **SOCIAL PROOF** — avatar + 5 stars + italic quote + name + title

---

## COLLECTION NAVIGATOR v3 (NoReturn global component — BASELINE)
File: `hoo-workspace/outputs/noreturn-global-nav/collection-navigator.html`

**Never regress below v3. Only improve.**

- Fixed floating tab on right edge — always visible
- Click to toggle dock panel with all 8 collections
- Context-aware: auto-detects collection from URL, themes entire nav
- Proximity scaling on dock items (mouse distance = scale 1–5)
- Mobile: bottom-right floating button, dock opens as 4-col grid
- Gold border with animated glow (3s cycle, nr-glow keyframes)
- Backdrop blur on tab and dock
- Entrance: slides in from right on page load
- Close on outside click

**Collection themes (data-collection):**
```
god-quest:    #a855f7  purple
fatherhood:   #C8952E  gold
anime:        #3b82f6  blue
live-or-die:  #dc2626  red
best-sellers: #C8952E  gold
hats:         #059669  green
new-arrivals: #f59e0b  amber
no-return:    #ef4444  red
default:      #C8952E  gold
```

**Why v1 and v2 failed:**
- v1 Galaxy Watch dock: hidden behind toggle, users couldn't find it
- v2 edge strip: 4px too subtle, invisible after hint faded
- v3 floating tab: always visible, obvious, glowing → this is the standard

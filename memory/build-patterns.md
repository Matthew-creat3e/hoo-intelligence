# Build Patterns — Auto-Memory Topic File
*Claude appends to this file when it discovers reusable patterns during builds.*

---

## Confirmed Working Patterns

### Readability Fix (discovered 2026-03-12)
Old opacity range (0.2-0.45) was too dark — text was unreadable.
Fixed range: 0.5-0.78 for body text. Apply to all new builds from the start.

### Gold Particle Canvas (confirmed working)
60 particles, slow drift, `requestAnimationFrame` loop.
Keep particle count at 60 — more causes jank on mobile, fewer looks sparse.
Opacity: 0.3-0.7 range per particle. Size: 1-3px random.

### Line-Reveal Headline Pattern
Split headline by word → wrap each in `<span>` → stagger `translateY(20px) → 0` with `opacity 0 → 1`.
Delay formula: `index * 0.08s`. Works best with Bebas Neue at 4-6 words per line max.

### IntersectionObserver Standard
```js
threshold: 0.1
rootMargin: '0px 0px -50px 0px'
```
Add `prefix-pop` class to hidden elements, `prefix-vis` on intersect.
Cache all `querySelectorAll` calls OUTSIDE the observer callback.

### Sticky Nav Shrink
Listen for `scroll` → if `window.scrollY > 50` → add `.scrolled` class.
`.scrolled`: reduce padding, reduce logo size, add backdrop-filter.
Use CSS transition for smooth shrink (not JS-driven height).

### Collection Navigator v3 — Context Detection
```js
const path = window.location.pathname;
const collection = path.split('/collections/')[1]?.split('/')[0] || 'default';
```
Map collection slug → accent color via object lookup. Apply via CSS custom property.

---

## Known Anti-Patterns (never do these)

- DO NOT use `display: none` to hide IO-animated elements — use `opacity: 0` + `pointer-events: none`
- DO NOT load Google Fonts on collection pages — use system font stack for speed
- DO NOT use `position: fixed` on custom section elements that need to stack with Shopify nav
- DO NOT hardcode product handles — always verify against `/products.json` or CSV export
- DO NOT use `vh` units for hero height — Shopify nav pushes content, use `min-height: calc(100vh - 80px)`

---

## Shopify Gotchas

- Shopify injects its own `<script>` tags that can conflict with IIFE variable names — always use unique prefixes
- Custom Liquid sections have a 500KB size limit — keep code lean
- Adding section via Admin sometimes requires page refresh before it appears in theme editor
- `aspect-ratio` CSS needs `overflow: hidden` on parent or images break layout on older iOS Safari

# V6 Premium Demo Standard
**Reference implementation:** `demos/v6-roofing-final-demo.html`

## Section Order (required, this exact sequence)
1. **Nav** — Dark glass, logo with signature animation, services dropdown, phone, CTA button
2. **Ticker** — Scrolling alert bar with industry-relevant urgency message
3. **Hero** — Dark bg, faded industry photo, signature animation, status badges, H1 + subtitle, stats row, direct form
4. **Stats** — Dark section, 4 animated counters, hover details, progress bars
5. **Process** — 4-step "how it works" with connected line
6. **Services** — Tabbed interface (NOT cards), cert badges, each tab: image + features + CTA + mini stats
7. **Quote Wizard** — Dark glassmorphism, 3-step tile picker, between services and portfolio
8. **Portfolio** — Before/after drag slider + clickable project cards with expandable details
9. **Reviews** — Big aggregate score + cert badges + 3 review cards
10. **About/Service Area** — Map for local biz, OR bio section for online biz
11. **FAQ** — Accordion (one open at a time) + dark CTA card with phone
12. **Footer** — 4-column: brand, services, about links, contact/social
13. **Live Feed** — Floating bottom-left notifications (activity feed)

## Global Rules
- **Fonts:** Oswald headlines, Inter body (Google Fonts link)
- **Animation:** IntersectionObserver `.rv` class, start hidden, `.vis` reveals
- **Responsive:** 768px breakpoint, clamp() for type, grid → single col
- **Performance:** transform/opacity transitions only, rAF for counters
- **Images:** Real Pexels from `blueprints/photos/{industry}.md` — NEVER placeholder
- **Protection:** Right-click disable, F12 disable, console HOO branding
- **Forms:** formspree.io/f/DEMO placeholder, onsubmit shows success
- **No frameworks.** Vanilla CSS/JS only. No Liquid. No schema.

## Per-Section CSS Scoping
Each section's CSS uses the industry color vars defined in `:root`. No class prefix needed in demos (only in Shopify .liquid files).

## Design Token Pattern
```css
:root{
  --primary: {from industry config};
  --accent: {from industry config};
  --accent-light: {from industry config};
  --accent-dark: {from industry config};
  --font-h: 'Oswald', sans-serif;
  --font-b: 'Inter', sans-serif;
  --max: 1140px;
  --radius: 12px;
}
```

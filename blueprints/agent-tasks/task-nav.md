# Task: Build Nav + Ticker
**Read this file. Read industry config. Build.**

## Nav Structure
- Fixed top, dark glass: `rgba(primary, .92)`, `backdrop-filter:blur(20px)`, accent border-bottom
- Height 64px, max-width 1140px centered
- LEFT: Logo = icon container (36px circle with accent border) + brand name in Oswald uppercase. Icon has signature animation (from industry config). Brand name: first word white, second word accent color.
- RIGHT: nav links (Programs dropdown, Results, Reviews, About, Phone, CTA button)
- CTA button: accent bg, white text, clip-path angled shape
- Phone: white, bold, with phone emoji

## Services Dropdown
- Appears on hover over "Programs/Services" link
- Dark bg, accent top border, 240px wide
- Each item: emoji icon in colored bg circle + service name
- Services list from industry config

## Mobile
- Links hidden, hamburger menu (3 spans)
- Hamburger toggles `.mob-show` class — fullscreen dark overlay with centered links

## Ticker Bar
- Below nav (margin-top:64px to clear fixed nav)
- Accent background, white text, bold uppercase
- Infinite scroll animation (tickScroll 22s linear)
- Content: 3 urgency messages repeated 2x (from industry config `ticker_messages`)
- Blinking white dot before each message

## Output
`<nav>` + `<div class="ticker">`. Include nav CSS and ticker CSS in the style block.

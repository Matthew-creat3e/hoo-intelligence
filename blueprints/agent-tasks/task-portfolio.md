# Task: Build Portfolio / Before-After Section
**Read this file. Read industry config + photos. Build.**

## Structure
Light section (`var(--off)`). Header + two-column showcase (slider left, project cards right).

## Header
- Section tag, title, subtitle (centered)
- From industry config `portfolio_heading`, `portfolio_subheading`

## Before/After Slider (left, 1.3fr)
- Container: border-radius 16px, shadow, aspect-ratio 4/3, cursor col-resize
- Two images stacked absolutely (before + after), both cover the full area
- After image: `clip-path: inset(0 0 0 50%)` (starts showing right half)
- Handle: white 4px vertical line, accent circle (44px) at center with ↔ arrow
- "Before" label bottom-left, "After" label bottom-right (dark glass pills)

## Project Cards (right, 1fr)
- Vertical stack, gap 16px
- First card has `.active` class by default
- Each card: white bg, 1.5px border, 14px radius, 20px padding
- Left accent bar (3px, hidden, shows on hover/active)
- Head row: title (Oswald) + badge pill (accent bg at 10%)
- Meta row: 3 spans with emoji + text (location/duration/highlight)
- Detail paragraph: hidden, expands on `.active` (max-height transition)

## Card Data
- 4 projects from industry config `projects` array
- Each has: title, badge, location, duration, highlight, description
- Before/after image URLs from photos file `portfolio` slots

## JS — Slider
- Track mousedown/touchstart on handle → dragging = true
- On mousemove/touchmove: calculate percentage from mouse X position relative to container
- Set handle left% and after image clip-path
- Click on container also sets position
- mouseup/touchend stops dragging

## JS — Card Switcher
- Click card: remove `.active` from all, add to clicked
- Swap slider before/after img src from card's data attributes
- Reset handle to 50%

## Mobile: single column (slider on top, cards below)

## Output
`<section class="portfolio">` with slider + switcher JS.

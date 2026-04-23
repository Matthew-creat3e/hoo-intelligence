# Task: Build Services Section (Tabbed)
**Read this file. Read industry config + photos. Build.**

## Structure
Light section (`var(--off)`) with faded industry photo bg (4% opacity, grayscale). Certification badges. Tab bar. Tab panels.

## Background
- Faded photo from photos file `services_bg` slot, 4% opacity, grayscale filter
- Subtle circular accent border decoration (top-right, 200px, 6% opacity)

## Header
- Section tag, title, subtitle (centered)
- Certification badges row: 3 badges from industry config `certifications`. Each: white bg, border, emoji + text, 8px border-radius.

## Tab Bar
- Flex row, centered, gap 6px, wraps on mobile
- Each tab: pill shape (border-radius 50px), 1.5px border, uppercase, emoji + label
- Active tab: accent bg, white text, box-shadow
- Hover: accent border + accent text
- Tab data from industry config `services` array

## Tab Panels (one per service)
- Hidden by default, `.active` shows as 2-column grid (image left, content right)
- Fade-in animation on switch (opacity + translateY)

### Panel Image (left)
- From photos file, matching service slot
- 16px border-radius, shadow, aspect-ratio 4/3
- Badge overlay: dark glass, accent dot + label text

### Panel Content (right)
- H3 title (Oswald), description paragraph
- Feature checklist: 4 items with SVG checkmark circles (accent color)
- CTA button: accent bg, uppercase, arrow
- Optional mini stats row (border-top, 2-3 stat items)

## JS
- Tab click: remove `.active` from all tabs + panels, add to clicked + matching panel
- Panel id matches tab's `data-panel` attribute

## Mobile: panels go single column, tabs shrink

## Output
`<section class="services">` with full tab switching JS.

# Task: Build Stats Section
**Read this file. Read industry config. Build.**

## Structure
Dark section (`var(--primary)`) with CSS grid overlay. Centered header + 4-column stat row.

## Header
- Section tag pill (accent-light color)
- H2 title + subtitle (white, centered)
- From industry config `stats_heading`, `stats_subheading`

## Stats Row
- 4 blocks in a bordered rounded container (`border:1px solid accent at 15%`, `border-radius:20px`)
- Glass effect: `background:rgba(255,255,255,.03)`, `backdrop-filter:blur(10px)`
- Each block separated by vertical accent border
- Blocks from industry config `stats` array (4 items)

## Per Stat Block
- Icon (emoji, 52px square rounded container with accent bg at 10%)
- Number: Oswald 3.2rem white, with suffix in accent-light
- Label: Oswald .85rem, uppercase, white at 60%
- Detail text: hidden, reveals on hover (max-height transition)
- Progress bar: 60% width, 3px, fills on count completion

## Counter Animation (JS)
- IntersectionObserver at threshold 0.3 on stats row
- On intersect: each counter animates from 0 to target
- Use requestAnimationFrame + easeOutCubic over 2 seconds
- Decimal-aware (check `data-decimal` attribute)
- On completion: add `.counted` class (triggers bar fill)

## Hover Effects
- Block lifts 4px on hover
- Icon scales 1.1 + rotates -5deg, bg fills accent
- Detail text reveals (max-height 0 → 60px)

## Mobile: 2-column grid, smaller padding

## Output
`<section class="results">` with style + markup. JS for counter in script block.

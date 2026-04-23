# Task: Build Reviews Section
**Read this file. Read industry config. Build.**

## Structure
White section. Header row (score + badges) + 3-column review grid.

## Header Row
- Flex, space-between, wraps on mobile
- LEFT: Big score number (Oswald 4rem) + stars (accent, 1.3rem) + "Based on X Google Reviews"
- RIGHT: 3 certification badge pills (accent bg at 6%, accent border at 10%, accent text)
- From industry config: `review_score`, `review_count`, `review_badges`

## Review Grid
- 3 columns, gap 16px. Single column on mobile.
- 3 review cards from industry config `reviews` array

## Per Review Card
- Off-white bg, 1px border, 16px radius, 28px padding
- Opening quote mark (decorative, large, accent at 6%, positioned top-right)
- Star row (accent colored stars)
- Review text (quoted, .88rem, 1.7 line-height)
- Author row: avatar circle (40px, gradient bg, white initials) + name + role
- Avatar gradients: card 1 = accent→accent-light, card 2 = accent-dark→red, card 3 = green→teal

## Hover: border goes accent, subtle shadow

## Mobile: single column, header stacks vertically

## Output
`<section class="proof">` with markup only (no JS needed beyond IO observer).

# Task: Build Process / How It Works Section
**Read this file. Read industry config. Build.**

## Structure
White section. Centered header + 4-column step grid.

## Header
- Section tag, title, subtitle (centered)
- From industry config `process_heading`, `process_subheading`

## Step Grid
- 4 columns, 20px gap, centered text
- Connected line behind steps: gradient line (accent → accent-light → accent → green), 2px, positioned at step number height, 15% opacity
- 4 steps from industry config `process_steps` array

## Per Step
- Number box: 56px square, white bg, 2px accent border, 16px radius, Oswald 1.3rem, accent colored, shadow
- Hover: bg fills accent, text goes white, scale 1.1 + slight rotate
- H4 title (Oswald .9rem uppercase)
- Description paragraph (.78rem, text-mid, max-width 200px, centered)

## Mobile
- 2x2 grid, 24px gap
- Connected line hidden

## Output
`<section class="process">` with markup only (no complex JS needed).

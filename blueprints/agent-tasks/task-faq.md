# Task: Build FAQ Section
**Read this file. Read industry config. Build.**

## Structure
White section. Two-column grid (FAQ left, CTA card right).

## Left Column
- Section tag "FAQ", title "Common Questions"
- 5 accordion items from industry config `faqs` array

### Accordion Item
- White bg, 1px border, 12px radius, 10px margin-bottom
- Question row: .9rem bold, flex space-between, plus icon (Oswald `+`, accent)
- Answer: hidden (max-height 0), reveals on `.open` class (max-height 200px)
- Plus rotates 45deg on open (becomes X)
- Hover: border goes accent

### JS (accordion)
- Click `.faq-q`: toggle `.open` on parent
- One open at a time: close all others first

## Right Column — CTA Card
- Dark bg (`var(--primary)`), 20px radius, 48px padding, centered
- Faded industry photo bg (8% opacity, grayscale) from photos file `hero` slot
- Big emoji icon (industry-relevant)
- H3 heading: "Ready to {action}?" (white, Oswald)
- Subtitle paragraph (white at 50%)
- Phone number button: accent bg, Oswald 1.1rem, uppercase
- Small "Or book online above" link below

## Mobile: single column

## Output
`<section id="contact">` with accordion JS.

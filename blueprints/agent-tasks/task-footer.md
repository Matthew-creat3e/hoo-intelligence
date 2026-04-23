# Task: Build Footer + Live Feed + Protection
**Read this file. Read industry config. Build.**

## Footer Structure
- Dark bg (#070B14), 48px top padding, 24px bottom
- 4-column grid (2fr 1fr 1fr 1fr), mobile: 2-column

### Column 1 (Brand)
- Logo icon (32px, accent gradient, rotated diamond shape) + brand name (Oswald)
- One-line description
- Phone link + email link

### Column 2 (Services)
- H4 "Services/Programs", list of service links from industry config

### Column 3 (About)
- H4 "About", links: about page, reviews, portfolio, FAQ

### Column 4 (Contact/Connect)
- H4 "Connect/Hours"
- If local: business hours from industry config
- If online: social handles from industry config
- CTA link to form

### Bottom Bar
- Border-top at 5% white, flex space-between
- Left: copyright 2026 + business name
- Right: "Website by HOO" with gold link to herrmanonlineoutlook.com

## Live Activity Feed (JS)
- Fixed bottom-left, z-index 90, max-width 300px
- White card with shadow, flex row: icon + text + timestamp
- 5 activity items from industry config `live_feed` array
- Shows every 12 seconds, visible for 5 seconds, fade in/out
- Close button (×) stops the feed
- Starts after 4 second delay

## Source Protection (JS)
- `contextmenu` → preventDefault
- Ctrl+U, Ctrl+S, F12 → preventDefault
- Console: styled HOO branding message

## Output
`<footer>` + live feed JS + protection JS. This is the LAST section in the HTML.

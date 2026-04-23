# Task: Assemble Demo from Section Files
**Read all section HTML files from the WIP folder. Stitch into one complete HTML file.**

## Input
All `.html` files in `outputs/demos-wip/{slug}/`

## Assembly Order
1. `<!DOCTYPE html>` + `<head>` with title, meta description, Google Fonts link
2. Open `<style>` tag — combine ALL section CSS into one block
3. Close `</style></head><body>`
4. `nav.html` content
5. `hero.html` content (section only, not duplicate styles)
6. `stats.html` content
7. `process.html` content
8. `services.html` content
9. `wizard.html` content
10. `portfolio.html` content
11. `reviews.html` content
12. `area.html` content
13. `faq.html` content
14. `footer.html` content (includes live feed + protection)
15. Open `<script>` tag — combine ALL section JS into one IIFE
16. Close `</script></body></html>`

## CSS Consolidation
- Extract all `<style>` blocks from section files
- Merge into one `<style>` tag in `<head>`
- Deduplicate shared rules (`.rv`, `.section-tag`, `.section-title`, `.form-field`, etc.)
- Keep `:root` vars from the FIRST section that defines them

## JS Consolidation
- Extract all `<script>` blocks from section files
- Wrap everything in one `(function(){ ... })();`
- Order: nav scroll → IO observer → FAQ → counters → tabs → slider → switcher → wizard → live feed → protection

## Output
- Write to `demos/v6-{industry}-demo.html`
- Copy to `outputs/demos/v6-{industry}-demo.html`

## Quality Check
- Open in browser, verify all sections render
- Check no duplicate CSS vars or JS function names
- Verify mobile responsive at 768px

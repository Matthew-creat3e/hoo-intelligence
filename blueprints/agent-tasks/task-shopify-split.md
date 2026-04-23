# Task: Convert Demo to Shopify Custom Liquid Sections
**Read this file + SHOPIFY-CONVERT.md. Read the assembled demo HTML. Split into .liquid files.**

## Input
- Assembled demo: `demos/v6-{industry}-demo.html`
- Conversion spec: `blueprints/SHOPIFY-CONVERT.md`

## Process
For each section in the demo:
1. Extract the section HTML (between comment markers or by class name)
2. Extract ONLY the CSS rules used by that section
3. Extract ONLY the JS used by that section
4. Prefix all CSS classes with `{industry}-{section}__`
5. Add Google Fonts `<link>` at top
6. Add `{% schema %}` block at bottom with editable settings
7. Write to `outputs/shopify-sections/{industry}-v6/{industry}-{section}.liquid`

## Files to Create
1. `{industry}-hero.liquid`
2. `{industry}-stats.liquid`
3. `{industry}-services.liquid`
4. `{industry}-quote-wizard.liquid`
5. `{industry}-portfolio.liquid`
6. `{industry}-reviews.liquid`
7. `{industry}-service-area.liquid` (or `{industry}-about.liquid`)
8. `{industry}-faq.liquid`

## Schema Rules
- All hardcoded text → `{{ section.settings.xxx }}`
- Repeatable items (reviews, FAQs, services, stats, projects) → blocks
- Images → `image_picker` type with Pexels URL as default
- Colors → `color` type with industry accent as default
- Include one preset per section

## Reference
See working examples: `outputs/shopify-sections/roofing-v6/`

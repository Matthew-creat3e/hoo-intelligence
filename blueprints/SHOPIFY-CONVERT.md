# Demo → Shopify Custom Liquid Conversion

## Process
1. Each section from the demo → one `.liquid` file
2. Naming: `{industry}-{section}.liquid` (e.g., `roofing-hero.liquid`)
3. Output: `outputs/shopify-sections/{industry}-v6/`

## Per-Section Rules
- Extract section HTML between `<!-- === SECTION === -->` comment markers
- Include ONLY CSS used by that section (wrap in `<style>`)
- Include ONLY JS used by that section (wrap in `<script>`)
- Add Google Fonts `<link>` at top
- Prefix ALL CSS classes with `{industry}-{section}__` (e.g., `roofing-hero__`)
- Scope CSS vars with prefix (e.g., `--rh-` for roofing-hero)

## Schema Template (bottom of every .liquid file)
```liquid
{% schema %}
{
  "name": "{Section Display Name}",
  "settings": [
    { "type": "text", "id": "heading", "label": "Heading", "default": "{default}" },
    { "type": "text", "id": "subheading", "label": "Subheading", "default": "{default}" },
    { "type": "color", "id": "accent_color", "label": "Accent Color", "default": "{hex}" },
    { "type": "image_picker", "id": "background_image", "label": "Background Image" },
    { "type": "url", "id": "form_action", "label": "Form Action URL" }
  ],
  "blocks": [],
  "presets": [{ "name": "{Section Display Name}" }]
}
{% endschema %}
```

## Use blocks for repeatable items
- Reviews → blocks type "review" (stars, text, author_name, author_role)
- FAQs → blocks type "faq" (question, answer)
- Services → blocks type "service" (tab_label, icon, image, title, description, features)
- Stats → blocks type "stat" (icon, count, suffix, label, detail)
- Projects → blocks type "project" (before_image, after_image, title, badge, description)

## Dynamic values
Replace all hardcoded text with `{{ section.settings.xxx }}` or `{{ block.settings.xxx }}`.
Keep Pexels URLs as fallbacks: `{{ section.settings.bg_image | default: 'pexels-url' }}`

## Reference implementation
`outputs/shopify-sections/roofing-v6/` — 8 working .liquid files from today's session.

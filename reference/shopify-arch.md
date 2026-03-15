# Shopify Architecture — Reference (Layer 3)
**Canonical source. HOO's approach to Shopify builds.**

---

## HOO Approach
Bypass Liquid/schema entirely. Pure HTML/CSS/JS pasted into Custom Liquid section.  
- No schema blocks
- No Liquid objects (`{{ }}`, `{% %}`)
- Content is hardcoded
- One section per file — paste-and-go

---

## URL Structure (always use real paths — never `#`)
```
/collections/all
/collections/HANDLE
/products/HANDLE
/pages/HANDLE
/cart
/account
```

## Add to Cart
```html
<form action="/cart/add" method="post">
  <input type="hidden" name="id" value="VARIANT_ID">
  <button type="submit">Add to Cart</button>
</form>
```

## Product Link
```html
<a href="/products/handle">Product Name</a>
```

---

## Store Build Phases (in order)
1. **FOUNDATION** — name, domain, industry, color, font, logo, theme (Dawn recommended)
2. **GLOBAL** — Announcement bar, Header/Nav (logo + links + cart icon), Footer (links + social + legal)
3. **HOMEPAGE** — Hero, Featured Collections, Best Sellers, Brand Story, Testimonials, CTA
4. **COLLECTIONS** — Custom Liquid header per collection (product grid = Shopify native)
5. **PRODUCTS** — Description, callout, size guide, cross-sell, trust strip, mobile sticky ATC
6. **STATIC** — About, Contact, FAQ, Policy (Shopify auto-generates policies — customize as needed)
7. **CART** — Free shipping bar, trust badges, upsell (checkout = native, never modify)

---

## Payment Checklist (after full store build)
1. Payments: activate Shopify Payments / PayPal
2. Shipping: zones + rates
3. Taxes: state settings
4. Checkout: logo + button color
5. Domains: connect custom domain
6. Preferences: meta title + meta description
7. Products: all set to Active with images
8. Navigation: main menu + footer menu correct

---

## Theme Structure (reference only — we don't edit these files)
```
assets/       → CSS, JS, image files
config/       → settings_schema.json, settings_data.json
layout/       → theme.liquid (master layout)
locales/      → translation files
sections/     → section files (where Custom Liquid lives)
snippets/     → reusable partials
templates/    → page templates
blocks/       → block definitions
```

Hierarchy: Layout → Template → Sections → Blocks

---

## Custom Liquid Section (how HOO code gets in)
1. Shopify Admin → Online Store → Themes → Customize
2. Add section → Custom Liquid
3. Paste full HTML/CSS/JS block
4. Save

Or via code editor:
1. Shopify Admin → Online Store → Themes → Edit code
2. Sections → Add new section
3. Name it, paste code, save
4. Add section to template in theme editor

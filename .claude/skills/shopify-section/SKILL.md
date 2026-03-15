# SKILL: shopify-section
**Trigger:** `/shopify-section` or "build a [section name] section"
**What it does:** Full Shopify Custom Liquid section build — intake to paste-ready code.

---

## When to Use
- Matthew says "build me a [hero/FAQ/pricing/etc] section"
- Any new section for any HOO client store
- Rebuilding or upgrading an existing section

---

## Inputs Required
Load these before starting:
1. `workspaces/build/CONTEXT.md` — code rules, design tokens, CSS patterns
2. `reference/section-templates.md` — the specific section template being built
3. `reference/site-types.md` — matched industry type only
4. `workspaces/stores/CONTEXT.md` → specific store section only (if for NoReturn/TCB/HOO)

---

## Workflow (run in order, one step at a time)

**Step 1 — Intake (skip answered questions)**
Ask only what's missing:
- Business name + what they do
- Which store? (NoReturn / TCB / HOO / new client)
- Which section? (Hero / FAQ / Pricing / etc.)
- Industry → match to 8 types
- Brand color (confirm hex) — offer HOO default if none
- Logo / images available?
- Headline — offer to write
- CTA text — offer suggestions

**Step 2 — Confirm**
Repeat back: "Building a [section] for [store] — [color] theme, [font] — [headline]. Ready?"

**Step 3 — Build**
Output ONLY code. One block. No explanation unless asked.
Structure: `Google Fonts link → <style> → <section class="hoo-[name]"> → <script> in IIFE`

**Step 4 — Deliver**
After code: "Done. Paste into Shopify → Add Section → Custom Liquid. Tweak this one, or next section?"

---

## Self-Check (silent, before outputting)
```
MOBILE:   @media 768px breakpoint present? clamp() on font sizes? Grid/Flex layout?
PERF:     transform/opacity animations only? will-change on animated elements? rAF for canvas?
CONVERT:  CTA visible above the fold? At least one trust signal?
SEO:      H1 present? H2 for subheadings? img alt attributes?
ANIM:     IO observer added? Elements start hidden (opacity:0)? Transition on .visible class?
LINKS:    All hrefs are real Shopify URLs? No # placeholders?
```

---

## Output Rules
- One section per response
- One copyable block (no split files)
- Code in chat — not as file attachments
- NO `{{ }}`, `{% %}`, schema tags, or external dependencies
- Prefix ALL CSS classes with section code (hoo-, hiw-, hw-, nr-gq-, etc.)

---

## Reference Outputs (quality bar)
- Hero gold standard: `hoo-workspace/outputs/hoo-site/hoo-hero.html`
- Collection gold standard: `hoo-workspace/outputs/noreturn-god-quest/god-quest-collection.html`
- Always match or exceed these — never ship below God Quest standard

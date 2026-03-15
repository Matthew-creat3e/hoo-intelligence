# SKILL: auto-prototype
**Trigger:** `/auto-prototype` or "build a demo for [lead]" or "prototype [business]"
**What it does:** Generates a custom demo homepage for a lead — "I already built your site. Want to see it?"

---

## When to Use
- Matthew wants to show a lead a demo before they've said yes
- Generating batch prototypes for all HOT leads
- Warming up a cold lead with a tangible proof-of-concept

---

## Inputs Required
Load before starting:
1. `workspaces/leads/CONTEXT.md` — lead data, pipeline state
2. `workspaces/build/CONTEXT.md` — section templates, design tokens
3. `reference/site-types.md` — matched industry only
4. Lead's JSON file: `C:\Users\Matth\hoo-workspace\lead-engine\leads\LEAD-{ID}.json`

---

## Workflow

**Step 1 — Load Lead Data**
Pull from lead JSON:
- Business name, owner name, city
- Industry → map to site type
- Any existing website or social media (for before/after)

**Step 2 — Select Industry Design**
Check `tools/industry-designs.json` for this industry's design config.
If industry not in file, build from scratch using `reference/site-types.md` template.

**Step 3 — Build Demo Homepage**
Single-page demo — one scrollable HTML file. Include:
1. Hero (with business name, city, industry-specific headline)
2. Services section (inferred from industry type)
3. Trust section (fake-but-realistic: "Serving [city] since [year]", "500+ jobs completed")
4. Contact/CTA ("Call Now" + phone placeholder)

**Step 4 — Run Generator (if env available)**
```bash
cd C:/Users/Matth/hoo-workspace/tools
node auto-prototype-v2.js LEAD-{ID}.json
# Output: outputs/prototypes/LEAD-{ID}-{name}/index.html
node auto-prototype-v2.js --preview LEAD-{ID}.json  # Open in browser
```

**Step 5 — Generate Pitch Message**
```
Subject: I built something for [Business Name]

Hey [Owner],

I was looking at local [industry] businesses in [city] and noticed you don't have a website.
I went ahead and built you one. Took me about an hour.

Here's a preview: [link to prototype]

It's yours to use, free. No strings. If you want the full build — 
mobile version, contact form, Google-ready — I can have it live in a week.
You only pay if you love it.

— Matthew
herrmanonlineoutlook.com
```

**Step 6 — Update Pipeline**
Move lead stage: `found` → `approach_planned`
Log to `memory/lead-intel.md`: which industry, what design was used.

---

## Output Naming Convention
```
outputs/prototypes/LEAD-{ID}-{business-slug}/
  index.html              ← the demo
  LEAD-{ID}-pitch.md      ← personalized outreach script
```

Example: `outputs/prototypes/LEAD-011-tattoos-by-glendon/index.html`

---

## Batch Mode
"Build prototypes for all HOT leads":
```bash
node auto-prototype-v2.js --batch
# Generates for every LEAD-*.json in leads/
```
Report back: "Built [N] prototypes. Top 5 ready to pitch: [list]"

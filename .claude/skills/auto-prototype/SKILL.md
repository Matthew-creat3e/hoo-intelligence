# SKILL: auto-prototype
**Trigger:** `/auto-prototype` or "build a demo for [lead]" or "prototype [business]"
**What it does:** Generates a V6 premium demo homepage for a lead.

---

## Two Paths

### Path A: V6 Template Exists for Industry
If `demos/v6-{industry}-demo.html` exists:
1. Read the template
2. String-swap business name, phone, city, email
3. Output to `outputs/demos/LEAD-{ID}-{business-slug}.html`
4. Generate pitch message

### Path B: No V6 Template — Use Blueprint System
If no V6 template exists for this industry:
1. Read `blueprints/BUILD-FLOW.md` — follow the orchestration
2. Read `blueprints/industries/{industry}.md` — if exists, use it
3. If no industry config exists, create one from `blueprints/industries/_TEMPLATE.md`
4. Spawn section agents per BUILD-FLOW.md
5. Assemble → output demo
6. Generate pitch message

### Path C: Terminal Pipeline (node auto-prototype.js)
```bash
cd engine/tools
node auto-prototype.js build LEAD-{ID}.json          # Build demo
node auto-prototype.js build LEAD-{ID}.json --send    # Build + draft email
node auto-prototype.js test --industry=roofing         # Test with fake lead
```
The JS engine reads V6 templates from `demos/` and does string replacement.

---

## Inputs Required
1. Lead JSON: `engine/leads/LEAD-{ID}.json`
2. Industry config: `blueprints/industries/{industry}.md`
3. Photos: `blueprints/photos/{industry}.md`
4. V6 Standard: `blueprints/V6-STANDARD.md`

---

## V6 Template Map (current)
| Industry | Template |
|---|---|
| roofing | `v6-roofing-final-demo.html` |
| personal training | `v6-personal-training-demo.html` |
| (others) | Fall back to V4 or build from blueprints |

As we build more V6 demos, add them here. Goal: every industry has a V6 template.

---

## Pitch Message Template
```
Subject: I built something for {Business Name}

Hey {Owner},

I was looking at local {industry} businesses in {city} and noticed 
you don't have a website. I went ahead and built you one.

Here's a preview: {link}

It's yours to use, free. No strings. If you want the full build — 
mobile version, contact form, Google-ready — I can have it live in a week.
You only pay if you love it.

— Matthew
herrmanonlineoutlook.com
```

---

## Output
```
outputs/demos/LEAD-{ID}-{business-slug}.html  ← the demo
outputs/demos/LEAD-{ID}-pitch.md              ← pitch script
```

## Pipeline Integration
After demo build: update lead stage `found` → `approach_planned`
Log to `memory/lead-intel.md`: industry, template version used

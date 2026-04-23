# SKILL: logo
**Trigger:** `/logo` or "make a logo for [business]" or "generate a logo" or "logo for [lead]"
**What it does:** Generates professional logo options via Canva MCP — pick one, export, drop into demo builds.

---

## When to Use
- Building a demo and need a placeholder logo
- Lead doesn't have a logo — make one to wow them
- Client needs a logo as part of their site build
- Auto-prototype pipeline needs a logo asset

---

## Inputs Required (ask only what's missing)
1. **Business name** — exact text for the logo
2. **Industry** — lawn care, roofing, barber, tattoo, etc.
3. **Style** — (offer options if not specified):
   - Modern/minimal
   - Bold/masculine (trades, auto, construction)
   - Elegant/script (salon, photography, boutique)
   - Playful/rounded (pet care, food, kids)
   - Classic/traditional (legal, finance, faith)
4. **Colors** — primary + accent (offer industry defaults if not specified)
5. **Icon preference** — optional: tree, wrench, scissors, paw, etc.

---

## Industry Color Defaults
If no colors specified, suggest these:
```
LAWN/LANDSCAPE:   Green #2E7D32 + Gold #C8952E
ROOFING/TRADES:   Navy #0A1628 + Orange #CC5500
BARBER/SALON:     Black #1A1A1A + Gold #C8952E
AUTO:             Red #C0392B + Charcoal #1C1C1C
CLEANING:         Blue #3498DB + White #FFFFFF
FOOD/RESTAURANT:  Red #C0392B + Cream #F5F0E8
PET CARE:         Teal #009688 + Warm Gray #8D8D8D
TATTOO:           Black #050505 + Red #C0392B
PHOTOGRAPHY:      Black #1A1A1A + White #F5F5F5
FITNESS:          Black #1A1A1A + Green #4CAF50
CANNABIS:         Purple #6C3483 + Green #2D6A4F
FAITH:            Navy #0A1628 + Gold #C8952E
FENCING:          Forest #1B5E20 + Brown #5D4037
PRESSURE WASH:    Blue #1565C0 + White #FFFFFF
PAINTING:         Navy #0D47A1 + Gold #FFC107
MOVING:           Orange #E65100 + Navy #0A1628
JUNK REMOVAL:     Green #2E7D32 + Orange #FF6F00
HANDYMAN:         Red #B71C1C + Gold #C8952E
```

---

## Workflow

**Step 1 — Gather Info**
Ask what's missing from the inputs list. One question at a time. Offer defaults.

**Step 2 — Build the Prompt**
Construct a detailed Canva prompt. Template:
```
Professional logo for "[Business Name]", a [industry] business.
Style: [style]. 
Primary color: [hex]. Accent color: [hex].
[Icon preference if given, e.g. "Include a tree icon" or "Include scissors icon"]
Clean, scalable design suitable for web and print.
The business name "[Business Name]" should be clearly readable.
Modern professional look, no clip art, no generic stock icons.
```

**Step 3 — Generate via Canva MCP**
Call `mcp__claude_ai_Canva__generate-design` with:
- `design_type`: `"logo"`
- `query`: the prompt from Step 2
- `user_intent`: "Generate logo for [business name]"

**Step 4 — Present Options**
Canva returns multiple candidates. Show them to Matthew:
"Here are your logo options. Pick your favorite and I'll save it."

**Step 5 — Save the Winner**
Call `mcp__claude_ai_Canva__create-design-from-candidate` with the chosen candidate.
Then call `mcp__claude_ai_Canva__export-design` to get a PNG.

**Step 6 — Deploy**
- If building a demo: embed the exported logo URL into the demo HTML
- If for a lead: save to `outputs/logos/[business-slug]/`
- If for auto-prototype: pass the URL to the prototype builder

---

## Integration with Other Skills

### Auto-Prototype Pipeline
When `/auto-prototype` runs and the lead has no logo:
1. Auto-trigger `/logo` with lead data
2. Generate logo → export PNG
3. Inject into demo hero nav-logo

### Shopify Section Builds
When building a header/nav and client has no logo:
1. Ask: "Want me to generate a logo?"
2. If yes → run this workflow
3. Use exported PNG as nav logo image

---

## Output
After completion:
"Logo created. Saved to your Canva account. [Link to design]. Export ready for web use."

---

## Quality Rules
- Logo must include the FULL business name (readable)
- No generic clip art — every logo should feel custom
- Test: would this look good at 200px wide in a nav bar? If not, regenerate.
- Prefer icon + text lockup over text-only when an icon is specified
- Keep it simple — logos that work at small sizes win

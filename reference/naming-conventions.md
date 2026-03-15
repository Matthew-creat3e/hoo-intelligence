# Naming Conventions — Reference (Layer 3)
**Canonical source. Filenames ARE the database. No separate tracking needed.**
*Inspired by Jake Van Clief: "naming conventions replace databases"*

---

## Core Principle
A well-named file is its own query system.
`LEAD-011-tattoo-liberty.json` answers: What ID? What industry? What city?
No spreadsheet, no database, no lookup table needed.

---

## Lead Files
```
Pattern:  LEAD-{ID}-{industry}-{city}.json
Examples:
  LEAD-011-tattoo-liberty.json
  LEAD-004-handyman-independence.json
  LEAD-023-cleaning-grandview.json

Rules:
  - ID: 3-digit zero-padded (001-999)
  - Industry: single word, lowercase, no spaces
  - City: single word, lowercase, no spaces (use primary city)
  - Always stored in: lead-engine/leads/
```

## Build Output Files (HTML sections)
```
Pattern:  BUILD-{store}-{section}-{YYYYMMDD}.html
Examples:
  BUILD-noreturn-god-quest-20260315.html
  BUILD-tcb-hero-20260310.html
  BUILD-hoo-pricing-20260301.html

Rules:
  - Store: noreturn | tcb | hoo | client-slug
  - Section: hero | pricing | faq | etc.
  - Date: YYYYMMDD (no dashes)
  - Always stored in: outputs/{store-section}/
```

## Output Files (audit reports, prototypes, demos)
```
Pattern:  OUTPUT-{type}-{client-slug}-v{n}.html
Examples:
  OUTPUT-audit-spences-fences-v1.html
  OUTPUT-prototype-tattoos-glendon-v1.html
  OUTPUT-demo-kc-soul-sistas-v2.html

Rules:
  - Type: audit | prototype | demo | report | proposal
  - Client: hyphenated business name slug
  - Version: v1, v2, v3 (increment on revision)
  - Always stored in: outputs/{type}s/
```

## Batch Call Sheets
```
Pattern:  BATCH-{YYYYMMDD}-{city}-{industry}.md
Examples:
  BATCH-20260315-independence-cleaning.md
  BATCH-20260316-liberty-tattoo.md

Rules:
  - Date: date the batch was generated
  - City + industry: what was hunted
  - Always stored in: lead-engine/leads/
```

## Outreach Scripts (per lead)
```
Pattern:  LEAD-{ID}-{industry}-{city}-outreach.md
Examples:
  LEAD-011-tattoo-liberty-outreach.md

Rules:
  - Matches lead JSON filename + "-outreach" suffix
  - Always stored in: lead-engine/outreach/generated/
```

## Prototype Directories
```
Pattern:  LEAD-{ID}-{business-slug}/
Examples:
  LEAD-011-tattoos-by-glendon/
    index.html
    LEAD-011-tattoo-liberty-outreach.md

Rules:
  - Directory name matches lead ID + business name slug
  - Always stored in: outputs/prototypes/
```

---

## Query Examples (using filenames as a database)
```
"Show me all tattoo leads"
→ list lead-engine/leads/LEAD-*-tattoo-*.json

"What did we build for NoReturn last week?"
→ list outputs/ | grep BUILD-noreturn | grep 2026031

"Which leads have prototypes built?"
→ list outputs/prototypes/ | extract IDs | cross-reference leads/

"Find all v1 audit reports"
→ list outputs/ | grep OUTPUT-audit-*-v1
```

---

## Consistency Rules
- Lowercase always (no CamelCase, no Title Case)
- Hyphens between words (no underscores, no spaces)
- Never abbreviate business names (use full slug)
- Date format: YYYYMMDD (sortable, no ambiguity)
- Version numbers: v1 not v01 (keep it short)

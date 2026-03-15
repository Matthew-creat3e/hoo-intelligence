# SKILL: lead-hunt
**Trigger:** `/lead-hunt` or "find leads" or "let's hunt"
**What it does:** Full autonomous lead hunting workflow — search to qualified JSON to call sheet.

---

## When to Use
- Matthew says "find leads" / "let's hunt" / "I need more leads"
- Starting a new batch hunt for a specific city or industry
- Importing and qualifying leads from Outscraper CSV

---

## Inputs Required
Load before starting:
1. `workspaces/leads/CONTEXT.md` — full leads workspace (pipeline, coverage, scoring)
2. Current pipeline state (check leads/CONTEXT.md "Current Pipeline" section)

---

## Safety Protocol (load before ANYTHING else)
```
ALL send/text commands default to DRY RUN.
--live flag REQUIRED to actually send.
Pattern: preview → test-to → live. Never skip.
```

---

## Workflow

**Step 1 — Scope**
Ask: "Which city? Which industry? Or batch all priority combos?"
If batch: run all 18 industries × top 5 cities simultaneously.

**Step 2 — Hunt**
Use Claude's WebSearch (Puppeteer blocked by Google):
```
Search: site:facebook.com "{city} MO" {industry}
Search: "{business name}" website  ← ALWAYS verify no-website claim
Search: "{business name}" {city} phone
```
Run searches in parallel. Minimum 5 results per industry/city combo.

**Step 3 — Verify**
For every business found:
- Confirm no website (or bad website worth auditing)
- Find owner name (Facebook About, BBB, Google Maps)
- Find phone number
- Check for existing email (Facebook, website contact, Google Maps)

**Step 4 — Score**
Score 0-100:
- +20: established business (2+ years)
- +20: owner name found
- +20: phone verified
- +15: email found
- +10: competitors in same city have websites
- +15: strong social media presence (active = worth it)
HOT 50+ | WARM 30-49 | COLD <30

**Step 5 — Diversification Check**
Before adding: never >30% same industry, never >40% same city in batch.

**Step 6 — Create Lead JSON**
```json
{
  "id": "LEAD-{next_number}",
  "filename": "LEAD-{ID}-{industry}-{city}.json",
  "business": "Business Name",
  "owner": "First Last",
  "phone": "(XXX) XXX-XXXX",
  "email": "email@domain.com",
  "city": "City",
  "state": "MO",
  "industry": "industry",
  "score": 0,
  "tier": "HOT/WARM/COLD",
  "stage": "found",
  "no_website": true,
  "website_url": null,
  "playbook": "no-website",
  "notes": "Specific observation about this business",
  "found_date": "2026-MM-DD"
}
```

**Step 7 — Generate Call Sheet**
Format top leads as a numbered call sheet with:
- Business name, owner name, phone
- One-sentence hook ("Their competitor [X] has a website — they don't")
- Opening line script

**Step 8 — Update Pipeline**
Report: "Found [N] leads. [X] HOT, [Y] WARM, [Z] COLD. Top 5 for Matthew's calls: [list]"
Update `workspaces/leads/CONTEXT.md` → Current Pipeline section.
Update `memory/MEMORY.md` → Active Reminders if pipeline state changed.

---

## Output Format
Deliver leads as:
1. Summary table (ID, Business, Score, Tier, Phone, Has Email?)
2. Full JSON blocks for each HOT lead
3. Call sheet for Matthew's Top 5

---

## Note on Scraping
Google blocks headless Puppeteer. Claude's WebSearch is the PRIMARY method.
Outscraper (free 500/mo) is the secondary — import CSV via `lead-pipeline.js outscraper-import`.

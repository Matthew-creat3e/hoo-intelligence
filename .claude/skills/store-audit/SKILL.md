# SKILL: store-audit
**Trigger:** `/store-audit` or "audit [url]" or "what's wrong with [store]"
**What it does:** Full site audit — conversion scorecard, issue list, prioritized fix plan.

---

## When to Use
- Matthew wants to audit a client's existing site before pitching
- Auditing NoReturn, TCB, or HOO for known issues
- Generating a cold outreach audit report for a lead

---

## Inputs Required
Load before starting:
1. `workspaces/stores/CONTEXT.md` — if auditing NoReturn/TCB/HOO (known issues already logged)
2. `workspaces/build/CONTEXT.md` — build rules to assess code quality
3. `workspaces/leads/CONTEXT.md` → pipeline section — if audit is for a lead

---

## Workflow

**For a client/lead site:**

**Step 1 — Run Tool Audit**
```bash
cd C:/Users/Matth/hoo-workspace/tools
node hoo-audit.js {url}            # Desktop
node hoo-audit.js {url} --mobile   # Mobile
node hoo-audit.js {url} --both     # Both
```
Output: `outputs/audits/` JSON + screenshots

**Step 2 — 10-Point Conversion Scorecard**
Score each item PASS / FAIL / PARTIAL:
1. Above-fold CTA visible on desktop
2. Above-fold CTA visible on mobile
3. H1 present and descriptive
4. Phone number visible (local service sites)
5. Trust signals present (reviews, years in business, licenses)
6. Images load fast (< 3s) and have alt text
7. Mobile responsive (no horizontal scroll)
8. Contact method easy to find
9. Clear value proposition in first 5 seconds
10. No dead links or 404s

**Step 3 — Issue Classification**
- 🔴 CRITICAL: Kills conversions (no CTA, broken mobile, no contact info)
- 🟡 IMPORTANT: Hurts trust (no reviews, slow images, broken links)
- 🟢 NICE TO HAVE: Optimization opportunities (SEO, copy improvements)

**Step 4 — HOO Pitch Angle**
Generate one-sentence pitch per critical issue:
"[Business] is losing [specific type] customers because [specific problem]."

**Step 5 — Generate Report (for cold outreach)**
```bash
node audit-report.js {url}
# Output: outputs/audit-reports/LEAD-ID-name/report.html
```
Branded HOO audit report for emailing to lead.

---

**For NoReturn/TCB/HOO (known stores):**

Skip tool audit — issues already logged in `workspaces/stores/CONTEXT.md`.
Output a prioritized fix list directly:
1. List all known issues with severity
2. Recommend order to fix them
3. Offer to build the fix

---

## Output Format

**Scorecard:**
```
CONVERSION SCORECARD: [Business Name] ([url])
Date: YYYY-MM-DD

✅ PASS  Above-fold CTA (desktop)
❌ FAIL  Above-fold CTA (mobile) — CTA below 800px fold
✅ PASS  H1 present
❌ FAIL  Phone number visible — not found above fold
⚠️ PARTIAL  Trust signals — "Since 2018" in footer only
...

SCORE: X/10
CRITICAL ISSUES: N
```

**Fix Priority:**
```
🔴 CRITICAL (fix now):
1. [Issue] — [one-sentence impact] — [HOO can fix this in one section]

🟡 IMPORTANT:
2. [Issue] — [impact]

🟢 NICE TO HAVE:
3. [Issue] — [impact]
```

**HOO Pitch (for outreach):**
```
"I audited [business]. Found [N] issues costing you customers.
Biggest: [specific critical issue]. We can fix it free — you only pay if you love it."
```

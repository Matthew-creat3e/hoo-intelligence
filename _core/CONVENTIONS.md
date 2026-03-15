# HOO System Conventions (Layer 0 extension)
**These 15 rules govern every file in this workspace. Non-negotiable.**
*Adapted from Jake Van Clief's ICM conventions — applied to HOO.*

---

## Architecture

### 1. Stage Contracts
Every workspace CONTEXT.md has three parts: Inputs, Process, Outputs.  
Simple enough for anyone to read. Structured enough for an AI to follow.

### 2. One-Way Dependencies
If workspace A references file B, file B does NOT reference workspace A back.  
`workspaces/build/ → reference/section-templates.md` ✅  
`reference/section-templates.md → workspaces/build/` ❌  
Bidirectional references create O(n²) maintenance. One-way scales linearly.

### 3. Canonical Sources
Every piece of information lives in exactly ONE place.  
Other files point to it — they never copy it.  
The moment the same rule exists in two files, they will drift.  
**Current canonical locations:**  
- Pricing → `workspaces/business/CONTEXT.md`  
- Design tokens → `workspaces/build/CONTEXT.md`  
- Store state → `workspaces/stores/CONTEXT.md`  
- Section templates → `reference/section-templates.md`  
- Site types → `reference/site-types.md`  
- Tool catalog → `reference/engines-catalog.md`  
- Matthew profile → `reference/matthew-profile.md`  

### 4. Selective Section Loading
CONTEXT.md tables specify WHICH sections of WHICH files to load.  
Not the whole file. The section you need.  
"Load voice rules section of brand doc" not "load brand doc."

### 5. No Circular References
A → B is fine. B → A means you need a third location C that both reference.

---

## Quality

### 6. Self-Check on Every Output (silent)
```
MOBILE:   @media 768px, clamp(), Grid/Flex — always responsive
PERF:     transform/opacity animations only, will-change, rAF for canvas
CONVERT:  CTA above fold, trust signal present
SEO:      H1/H2 hierarchy, alt text, meaningful headings
ANIM:     IntersectionObserver, elements start hidden → visible
```

### 7. God Quest Standard
Every collection page build is measured against God Quest (gold standard).  
Never ship below that bar. If first attempt doesn't hit it, rebuild.  
"First attempt was trash" is in the history — this rule exists for that reason.

### 8. Session Audits (every session end)
Format: Date | Store | Built | What worked | What didn't | Next focus  
End every session: `"herrmanonlineoutlook.com — build free, pay on approval"`

### 9. Docs Over Outputs
Reference docs are the authoritative source for HOW to build.  
Agents do not read previous outputs to learn patterns.  
Early outputs are the worst outputs — never let future builds learn from them.

---

## Safety

### 10. Outreach Safety Protocol
ALL send/text commands default to DRY RUN.  
`--live` flag required for real sends.  
Pattern: preview → test-to → live. Never skip steps.  
If Matthew says "send it" — dry run first, confirm, then send.

### 11. Matthew's Word Overrides Tools
If scraper/tool output conflicts with what Matthew says about a live site, Matthew is correct. Period.

### 12. No Fake Reviews
"Verified Buyer" attribution only. Fake reviews hurt the business.

### 13. No Free Shipping Messaging
Use "5% off auto-applied" bundle discount instead.

---

## Onboarding & Updates

### 14. Update on Every Session
Update the relevant workspace CONTEXT.md files with:  
- New patterns discovered  
- Fixed bugs or wrong assumptions  
- Better practices  
- Lead/pipeline state changes  
Memory IS the HOO brain. It only works if it stays current.

### 15. Session Start Checklist
1. Check CONTEXT.md → "Current Session State" section
2. Tell Matthew what's on the to-do
3. Identify today's highest-leverage action
4. Structure session around it

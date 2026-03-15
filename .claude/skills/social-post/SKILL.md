# SKILL: social-post
**Trigger:** `/social-post` | "post this build" | "create content" | "write a caption"
**What it does:** Turns any HOO build into platform-specific social posts instantly.

---

## When to Use
- Matthew finishes a section or full store build
- Any before/after worth showing
- Pitching a specific industry or city for inbound leads
- Behind-the-scenes build content

---

## Inputs Required
Load before starting:
1. `workspaces/social/CONTEXT.md` — voice, tone, templates, platform guidelines
2. `workspaces/stores/CONTEXT.md` → CDN assets section — for screenshot URLs

---

## Workflow

**Step 1 — Identify Content**
Ask only what's missing:
- What was built? (store + section)
- Before image URL? (CDN or skip)
- After image URL? (CDN or skip)
- Client industry + city? (for pitch posts)

**Step 2 — Write 3 Captions**
Generate platform-specific versions:
- Facebook (3-4 sentences, conversational, local)
- Instagram (punchy, 5 relevant hashtags)
- TikTok (1-2 sentences, hook first)

All three include:
- "Build free, pay on approval" reference
- herrmanonlineoutlook.com
- HOO voice: raw, real, builder energy

**Step 3 — Save to Queue**
```bash
cd C:\Users\Matth\hoo-workspace\social-engine
node post-manager.js generate "[store]" "[section]" [type]
```
Or fire n8n webhook automatically.

**Step 4 — Deliver**
Output all 3 captions in chat for Matthew to review.
"Want me to queue these, or do you want to tweak the tone first?"

---

## HOO Voice Quick Reference
- Short punchy sentences
- Blue collar builder from Independence MO
- Dad. Grinder. Late nights. Real work.
- Never corporate. Never fake excitement.
- Always mention "build free, pay on approval"
- Always end with herrmanonlineoutlook.com
- Local references: KC, Independence, Missouri

---

## Template Quick-Fire

**Before/After:**
> Built [store]'s [section] — completely free for them to see first.
> They paid nothing until they saw it live and loved it.
> That's HOO. Build free. Pay on approval.
> herrmanonlineoutlook.com

**No-Website Pitch:**
> [Industry] businesses in [city] are losing jobs to competitors who have websites.
> I'll build you one free. You see it live. Pay only if you love it.
> herrmanonlineoutlook.com

**Build Story:**
> [Store] had [problem]. Now they have [result].
> Built free. They paid when they were ready.
> herrmanonlineoutlook.com — build free, pay on approval

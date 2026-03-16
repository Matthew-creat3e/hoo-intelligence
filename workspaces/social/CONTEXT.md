# SOCIAL WORKSPACE — Layer 2
**Loaded when:** social / post / content / facebook / tiktok / instagram / caption / build story

---

## What This Engine Does
Every build Matthew finishes becomes social content automatically.
No extra work. No Blotato subscription ($29/mo saved).
Claude writes the caption. n8n queues it. Matthew reviews. Done.

## Inputs This Workspace Loads
| Source | File | Section |
|---|---|---|
| Content queue | `social-engine/queue/` | All queued posts |
| Performance data | `memory/social-intel.json` | Top content types |
| CDN assets | `workspaces/stores/CONTEXT.md` | Screenshot URLs |
| HOO voice | This file | Voice + tone rules |

---

## HOO Social Voice
**Who Matthew is:** Blue collar Journeyman Laborer from Kansas City MO who learned AI and now builds premium websites. Dad. Grinder. Faith in the work. Built his businesses at 2am between concrete jobs.

**What makes HOO different:** "Build free, pay on approval" — zero risk to the client. No other local agency does this.

**Tone:** Raw. Real. Earned. Short sentences. Builder energy. Local pride. No corporate fluff.

**Always include:**
- The "build free, pay on approval" model
- herrmanonlineoutlook.com
- Local reference (KC, Kansas City, Missouri) when relevant

**Never:** Generic marketing speak. Fake excitement. Promises that sound like ads.

---

## Content Types

### 1. Before/After Build Showcase (highest performing)
Show the transformation. Let the work speak.
- Facebook: 3-4 sentences, conversational
- Instagram: punchy + hashtags
- TikTok: 1-2 sentence hook

### 2. No-Website Pitch (drives inbound leads)
Speak directly to business owners who don't have a site yet.
Name the industry. Name the city. Make it local and specific.

### 3. Build Story (builds trust + authority)
Tell what changed and why it matters for the client's business.
More copy, more depth — works well on Facebook.

### 4. Process/Behind the Scenes
"Here's how I built this in [time]..." — builds credibility.

---

## Existing Content Library (use these for first posts)

### NoReturn Apparel Builds
- Before: `https://cdn.shopify.com/s/files/1/0658/1911/5587/files/preview.webp`
- After homepage: `https://cdn.shopify.com/s/files/1/0658/1911/5587/files/nr-homepage-showcase.png`
- After God Quest: `https://cdn.shopify.com/s/files/1/0658/1911/5587/files/nr-god-quest-showcase.png`
- After Best Sellers: `https://cdn.shopify.com/s/files/1/0658/1911/5587/files/nr-best-sellers-showcase.png`
- God Quest fold: `https://cdn.shopify.com/s/files/1/0658/1911/5587/files/god-quest-fold.png`

### TCB Collections Build
- After: `https://cdn.shopify.com/s/files/1/0658/1911/5587/files/preview_3.webp`

### Build Stories Available
1. NoReturn — generic product grid → scripture-driven faith streetwear brand with custom collection pages, size guides, cross-sell, sticky ATC
2. TCB — nothing → compliant premium dispensary with age gate, gold particles, collections grid
3. HOO site — blank → full 6-section service site with particles, pricing, Formspree contact form

---

## Social Engine Workflow

### When Matthew Finishes a Build:
```bash
# Quick way — triggers n8n webhook → Claude writes caption → Matthew gets email preview
curl -X POST http://localhost:5678/webhook/hoo-social-trigger \
  -d '{"store":"NoReturn","section":"God Quest","type":"before_after"}'

# Or direct — generate caption without n8n
cd C:\Users\Matth\hoo-workspace\social-engine
node post-manager.js generate "NoReturn Apparel" "God Quest Collection" before_after
```

### Review and Approve:
```bash
node post-manager.js queue             # See all queued posts
node post-manager.js approve SOCIAL-2026-03-15-god-quest.json
```

### Generate Full Library (first time):
```bash
node post-manager.js library           # Creates posts for all existing HOO builds
```

### Track What Works:
```bash
node post-manager.js log-result SOCIAL-2026-03-15-god-quest.json facebook 47 12
node post-manager.js stats
```

---

## Posting Schedule (goal)
- 3-5x per week minimum
- Mix: 2 build showcases + 1 local pitch + 1 behind-the-scenes
- Best times: Facebook 7-9am or 7-9pm CST | Instagram 11am-1pm CST | TikTok 7-9pm CST

## Platforms (priority order)
1. **Facebook** — local business owners in KC metro are here. Primary platform for HOO leads.
2. **Instagram** — visual work shows well. Second priority.
3. **TikTok** — growing. Blue-collar builder story works here.
4. **LinkedIn** — eventually, for larger commercial clients.

---

## Phase 2: Auto-Posting (future)
Once 20+ posts are live and Matthew has approved the voice:
1. Connect Facebook Graph API (free) → auto-post from n8n
2. Connect Instagram Basic Display API → auto-post
3. Social engine becomes fully automated — zero manual posting

For now: Claude writes, Matthew approves, Matthew posts. Takes 2 minutes per post.

---

## Self-Learning
After every post, log performance:
```
node post-manager.js log-result [filename] [platform] [likes] [comments]
```
`memory/social-intel.json` tracks what content type, what copy style, what platform performs best.
After 20 posts the data tells Matthew exactly what to keep making.

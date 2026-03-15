# HOO Approach Playbooks — Canonical Source
**5 playbooks. One per lead type. Assigned during qualification.**

---

## Playbook 1: NO-WEBSITE
*Assigned when: `no_website: true`*
*Score boost: +30 points*

### The Angle
They have a business, likely have Facebook, and are losing every Google search to competitors who have websites. This is the easiest pitch — the problem is obvious and the solution is immediate.

### Sequence
1. **Day 0 — Email** Template 4 (Punchy Short) or Template 1 (Long Form if score 70+)
2. **Day 0 — Build** Don't wait for reply. Build a demo homepage right now.
3. **Day 3 — Follow-up** Template 6 if no reply. Reference the demo.
4. **Day 7 — Final touch** One last follow-up. Then move on.

### Phone Script (Matthew's Top 5)
> "Hey, is this [owner name]? This is Matthew from HOO — I build websites for [industry] businesses here in [city]. I noticed [business name] doesn't have a website, so I went ahead and built you one for free. Literally takes two minutes to see. Can I send you the link?"

If they say yes → send demo link immediately.
If they say not interested → "No worries at all. If that changes, herrmanonlineoutlook.com."
If voicemail → leave max 20 seconds, mention "built you something free."

### Pitch Lines
- "Your competitor [name] has a website and shows up on Google. You don't — yet."
- "One job that comes through your website pays for the whole year."
- "I'll build it free. You only pay if you love it. Zero risk."

---

## Playbook 2: BAD-WEBSITE
*Assigned when: website exists but quality score < 60*
*Score boost: +15 points*

### The Angle
They made the investment in a website but it's not working for them. Lead with the audit — concrete, specific, not salesy. The audit IS the sales tool.

### Sequence
1. **Day 0 — Run Audit** `node hoo-audit.js [url] --both`
2. **Day 0 — Generate Report** `node audit-report.js [url]`
3. **Day 0 — Email** Template 2 with specific issues from audit
4. **Day 3 — Follow-up** Template 6

### Phone Script
> "Hey [owner], this is Matthew from HOO — I build websites for [industry] businesses. I did a quick audit on [business name]'s site and found [N] things that are probably costing you customers. The biggest one is [specific issue]. I put together a free report — mind if I send it over?"

### Pitch Lines
- "Your site has [specific issue] — most [industry] customers leave in 8 seconds if they can't find the phone number."
- "I can rebuild the whole thing free. You see it live first. Pay only if it's better."

---

## Playbook 3: FREE-BUILDER
*Assigned when: business mentions "my nephew/friend is building it" or has a DIY Wix/Squarespace*

### The Angle
Don't compete with the nephew. Position HOO as the backup/upgrade. Be patient. These often convert weeks later when the nephew flakes.

### Sequence
1. **Day 0 — Email** Short, friendly, no pressure
2. **Day 7 — Follow-up** One time only. Then park.
3. **30 days — Re-engage** "How's the site coming along?"

### Pitch Lines
- "If that doesn't work out, HOO is here — build free, pay on approval."
- "No pressure at all. Just know we're here when you're ready."

---

## Playbook 4: NEW-BUSINESS
*Assigned when: business is < 6 months old, score < 30*

### The Angle
Too early for a full sell. Give them something useful — the 8-step checklist. Check back in 30 days. These become warmer leads over time.

### Sequence
1. **Day 0 — Email** Short intro + free checklist offer
2. **30 days — Check-in** "How's the business going?"
3. **60 days — Pitch** If still no website, go to Playbook 1

### Give-Away
> "Here's an 8-step checklist for getting your [industry] business found online — free to keep."
1. Google Business Profile (free)
2. Facebook Business Page
3. Basic website with phone + address
4. 5 Google reviews
5. Consistent name/phone/address across all platforms
6. Photos of your work
7. Service area pages for local search
8. Simple contact form

---

## Playbook 5: SOCIAL-ONLY
*Assigned when: only Facebook/Instagram, no website, active social presence*

### The Angle
They're already doing marketing — they just don't have the Google piece. This is a compliment to their hustle, not a criticism.

### Sequence
1. **Day 0 — Email** Template 3 (Social Media Only)
2. **Day 3 — Follow-up** Template 6
3. **Day 7 — Final** One line. Done.

### Pitch Lines
- "Your Facebook looks great — let's make sure Google sends people there too."
- "Facebook is great for people who already know you. A website catches everyone else."
- "You're doing the work. A website just makes sure people can find it."

---

## Playbook Assignment Logic
```
if no_website and score >= 50:  → Playbook 1 (No Website)
if no_website and score < 50:   → Playbook 1 (No Website) — enrich first
if has website and quality < 60: → Playbook 2 (Bad Website)
if mentions nephew/DIY:          → Playbook 3 (Free Builder)
if business < 6 months:          → Playbook 4 (New Business)
if social_only (FB/IG only):     → Playbook 5 (Social Only)
default:                         → Playbook 1
```

# HOO Email Templates — Canonical Source
**6 templates. Never duplicate these anywhere else. Reference this file.**

---

## Template 1 — No Website (Long Form)
*Use for: Businesses with zero web presence. Full pitch.*

```
Subject: {business_name} doesn't have a website — I built you one

Hi {owner_name or "there"},

I'm Matthew from HOO — I build websites for {industry} businesses in {city}.

I noticed {business_name} doesn't have a website yet, so I went ahead and built you one.
It's live right now. You can see the full thing before you pay a cent.

That's how HOO works: I build it free. You see it live.
You pay only if you love it.

Want to see it? Takes 2 minutes.

I also found a few things your competitors in {city} are doing online that you're not —
happy to walk you through that on a quick call.

Either way, the site is yours.

— Matthew Herrman
HOO — Build Free, Pay on Approval
herrmanonlineoutlook.com
(804) 957-1003
```

---

## Template 2 — Bad Website (With Audit)
*Use for: Businesses that have a site but it's hurting them.*

```
Subject: Found {N} issues with {business_name}'s website

Hi {owner_name or "there"},

I ran a quick audit on {business_name}'s website and found {N} things
that are probably costing you customers.

Biggest one: {specific_issue_from_audit}.

I put together a free report — no strings, just the data.

And if you want it fixed, HOO works like this:
I rebuild it free. You see it live. You pay only if you love it.

Want the report? Reply here or call me: (804) 957-1003

— Matthew Herrman
HOO — Build Free, Pay on Approval
herrmanonlineoutlook.com
```

---

## Template 3 — Social Media Only
*Use for: Facebook/Instagram-only businesses with no website.*

```
Subject: {business_name} is losing Google customers

Hi {owner_name or "there"},

{business_name} has great {platform} presence — but customers searching Google
for {industry} in {city} can't find you.

That's traffic going to competitors who have websites.

I built {business_name} a website. Free to see.

HOO model: I build it. You see it live. You pay only if you love it.

— Matthew
herrmanonlineoutlook.com | (804) 957-1003
```

---

## Template 4 — Punchy Short (AUTOMATION DEFAULT)
*Use for: All automated sends. 4 lines max. High deliverability.*

```
Subject: Built something for {business_name}

Hi {owner_name or "there"},

I build websites for {industry} businesses in {city} — free first, pay only if you love it.

Noticed {business_name} doesn't have one. Went ahead and built you something.

Want to see it? herrmanonlineoutlook.com or reply here.

— Matthew, HOO
```

---

## Template 5 — Industry-Specific Hook (HIGH-VALUE TRADES)
*Use for: Tattoo, fencing, landscaping, auto — trades with high job values.*

```
Subject: One call through Google pays for a year of website

Hi {owner_name or "there"},

{industry} businesses in {city} — one customer from Google search
is worth ${estimated_job_value}+.

If {business_name} doesn't have a website, that customer is going
to whoever does.

I'll build you one free. You see it live. Pay only if you love it.
Zero risk. One call from Google pays for the whole year.

— Matthew
HOO | herrmanonlineoutlook.com | (804) 957-1003
```

---

## Template 6 — Follow-Up (After No Response)
*Use for: Day 3 or Day 7 follow-up to non-responders.*

```
Subject: Re: {business_name} website

Hey {owner_name or "there"},

Just following up — sent you a note a few days ago about building
{business_name} a free website.

No pressure at all. If the timing isn't right, totally understand.

The demo is still there whenever you're ready:
herrmanonlineoutlook.com

And if you know another {industry} business owner who needs a site,
I'd appreciate the referral. Same deal — build free, pay on approval.

— Matthew
(804) 957-1003
```

---

## Template Variables Reference
| Variable | Source |
|---|---|
| `{owner_name}` | Lead JSON `owner_name` field |
| `{business_name}` | Lead JSON `business` field |
| `{industry}` | Lead JSON `industry` field |
| `{city}` | Lead JSON `city` field |
| `{platform}` | Lead JSON `source` field (facebook, yelp, etc.) |
| `{N}` | Count from audit report |
| `{specific_issue}` | Audit report top issue |
| `{estimated_job_value}` | Industry averages: tattoo=$200-800, fencing=$2000-8000, landscaping=$500-3000 |

## Subject Line Rules
- Under 50 characters (mobile preview)
- Specific to the business or issue found
- Never use "FREE" in subject (spam filter risk)
- Never use all caps
- Numbers perform well: "Found 7 issues" > "Found issues"

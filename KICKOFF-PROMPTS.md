# HOO Kickoff Prompts
# These are the exact prompts to run when first loading the system into Studio Vision or Claude Projects.
# Run them in order. Each one wakes up a different part of the machine.

---

## PROMPT 1 — COLD START (run this first, every single time)

```
Read memory/MEMORY.md completely. Then tell me:
1. What is the current state of HOO — leads, pipeline, stores, MRR
2. What are my top 3 priorities right now
3. What did we accomplish last session
4. What needs to happen today

Be specific. Use the actual numbers. Don't summarize — give me the real data.
```

---

## PROMPT 2 — FIRST SESSION EVER (run this once when setting up)

```
You are now the HOO Intelligence System. Read every file in this workspace starting with CLAUDE.md, then CONTEXT.md, then memory/MEMORY.md, then scan the workspaces/ and reference/ folders.

When you're done reading, introduce yourself as HOO Build Intelligence and tell me:
- Who Matthew Herrman is and what HOO does
- The three engines and what each one does
- The current pipeline state
- The single most important action Matthew should take today
- What this system is designed to do that no other system does

Then ask: "What are we building today?"
```

---

## PROMPT 3 — LEAD ENGINE KICKOFF

```
Let's run the lead engine. 

First tell me:
- How many leads are currently in the pipeline by tier (HOT/WARM/COLD)
- Which leads have been emailed and when
- Which leads still need to be contacted
- What the follow-up schedule looks like this week

Then ask me: do I want to hunt for new leads, work the existing pipeline, or both?
```

---

## PROMPT 4 — SOCIAL ENGINE KICKOFF

```
I want to start generating social content for HOO.

Tell me:
- What existing builds we have that can be turned into content right now
- What the HOO social voice is
- Which platforms we're targeting and why
- What the first 5 posts should be

Then generate the first Facebook post for the God Quest before/after using the HOO voice. Show me the post, the Instagram version, and the TikTok version.
```

---

## PROMPT 5 — BUILD SESSION KICKOFF

```
I'm ready to build. 

Ask me the intake questions one at a time — start with the business name and what they do. Don't give me all the questions at once. Ask one, wait for my answer, then ask the next.

When you have everything you need, build the section in one clean paste-ready block.
```

---

## PROMPT 6 — STORE STATUS CHECK

```
Give me a complete status report on all three stores:

1. NoReturn Apparel — what's live, what's built but not pasted, what's not built, what the known issues are
2. TCB Collections — what's built, what's missing
3. HOO site — confirm all 6 sections are live, any known issues

For each store, tell me the single most important next action.

Then ask: which store do you want to work on?
```

---

## PROMPT 7 — BUSINESS STRATEGY SESSION

```
Let's talk business strategy.

Tell me:
- Where HOO is right now (revenue, pipeline, stores)
- What the realistic path to first $1,000/mo MRR looks like based on current pipeline
- What Shopify Partner commissions add to that math
- What the social engine adds once it's running
- What Matthew should be doing differently right now

Don't sugarcoat. Give me the real assessment.
```

---

## PROMPT 8 — ENGINE SETUP (run when installing for first time)

```
I need to set up the HOO engine v3.0 from scratch on my Windows machine.

Walk me through the entire install in order:
1. Crawl4AI and Playwright
2. The .env file for Twilio
3. Node dependencies for the SMS engine
4. Docker and n8n
5. Importing the n8n workflows
6. Testing each component

Give me the exact commands to run at each step. Check if there are any known Windows-specific issues with any of these tools and warn me upfront.
```

---

## PROMPT 9 — GITHUB REPO SETUP

```
I want to set up the HOO Intelligence System as a private GitHub repo.

Walk me through:
1. Creating the repo on GitHub
2. What to put in .gitignore (sensitive files, outputs, lead JSONs, env files)
3. The initial commit structure
4. How to use it with Claude Code going forward
5. How to commit session updates (memory changes, new patterns, pipeline updates)

Make the .gitignore file for me right now.
```

---

## PROMPT 10 — DAILY DRIVER (run this every morning)

```
Morning briefing.

What happened since last session:
- Any email replies from leads?
- Any follow-ups due today?
- Any overdue pipeline stages?
- What's the highest leverage thing I can do in the next 2 hours?

Give me a numbered action list. Most important first. No more than 5 items.

End with what I should build today.
```

---

## PROMPT 11 — SHOPIFY PARTNER (run this right now)

```
Walk me through applying for the Shopify Partner Program step by step.

What information do I need ready, what does the application ask for, how long does it take, and what do I get access to immediately after approval?

Then tell me exactly how to use the referral link when setting up a new client's Shopify store — what's the process, where does the link go, how do I track the commissions.
```

---

## PROMPT 12 — SESSION WRAP (run at end of every session)

```
End session.

Tell me:
1. What we built or accomplished today
2. What changed in the pipeline
3. Any new patterns or insights to remember
4. Update memory/MEMORY.md with today's session log entry
5. Top 3 priorities for next session

End with: "herrmanonlineoutlook.com — build free, pay on approval"
```

---

## HOW TO USE THESE

**First time ever:** Run Prompt 2, then Prompt 8, then Prompt 9.

**Every morning:** Run Prompt 10 (or Prompt 1 if you want more detail).

**Building a site:** Run Prompt 5.

**Working leads:** Run Prompt 3.

**Posting content:** Run Prompt 4.

**Business check-in:** Run Prompt 7 weekly.

**End of session:** Run Prompt 12.

**These aren't one-time prompts.** They're how you talk to the system. The more you run them, the more the memory builds, the smarter the engine gets, the closer HOO gets to the life Matthew is building toward.

# n8n Setup Guide — HOO Perpetual Engine
**Self-hosted Docker. Free. Unlimited workflows. No execution limits.**
*Based on Sabrina Ramonov's n8n tutorials — built for Matthew's Windows machine.*

---

## What n8n Replaces for HOO
- Zapier ($20/mo) → $0
- Make.com ($10/mo) → $0
- Manual Gmail checking → automatic
- Manual pipeline updates → automatic
- Blotato social engine ($29/mo) → $0 (built in `social-content-engine.json`)

---

## Install (Windows — one time)

### Step 1: Install Docker Desktop
Download from docker.com/products/docker-desktop
Install, restart, make sure it's running (whale icon in system tray)

### Step 2: Run n8n
Open Command Prompt or PowerShell and paste:

```bash
docker volume create n8n_data

docker run -d \
  --name n8n \
  --restart always \
  -p 5678:5678 \
  -v n8n_data:/home/node/.n8n \
  -e N8N_BASIC_AUTH_ACTIVE=true \
  -e N8N_BASIC_AUTH_USER=matthew \
  -e N8N_BASIC_AUTH_PASSWORD=hoo2026 \
  -e GENERIC_TIMEZONE=America/Chicago \
  docker.n8n.io/n8nio/n8n
```

### Step 3: Open n8n
Browser → http://localhost:5678
Login: matthew / hoo2026

### Step 4: Connect Gmail
1. In n8n → Settings → Credentials → New
2. Choose "Gmail OAuth2"
3. Follow Google OAuth flow — connect herrmanonlineoutlook@gmail.com
4. Name it "HOO Gmail"

### Step 5: Add Anthropic API Key (for social engine)
1. Settings → Credentials → New
2. Choose "HTTP Header Auth"
3. Name: "Anthropic API"
4. Header Name: x-api-key
5. Value: your Claude API key from console.anthropic.com

---

## Import the HOO Workflows

For each .json file in `n8n/workflows/`:

1. n8n → Workflows → New → Import from File
2. Select the .json file
3. Open the workflow
4. Fix any credential references (connect to "HOO Gmail")
5. Activate the toggle (top right)

### Workflow Load Order
1. `gmail-reply-detector.json` — most important, run first
2. `daily-pipeline-briefing.json` — morning briefing
3. `social-content-engine.json` — content engine

---

## Trigger the Social Engine (manual for now)

When Matthew finishes a build, run this from terminal:

```bash
curl -X POST http://localhost:5678/webhook/hoo-social-trigger \
  -H "Content-Type: application/json" \
  -d '{
    "store": "NoReturn Apparel",
    "section": "God Quest Collection Page",
    "before_img": "https://cdn.shopify.com/.../preview.webp",
    "after_img": "https://cdn.shopify.com/.../nr-god-quest-showcase.png",
    "client_type": "faith streetwear brand",
    "headline": "Took their collection from a basic grid to a full story-driven experience"
  }'
```

Or create a simple desktop shortcut / batch file that fires this.

---

## Verify It's Working

After setup:
1. Send yourself a test email from any other account → gmail-reply-detector should log it
2. Check 7am the next morning → daily-pipeline-briefing should email Matthew
3. Hit the social webhook → email preview should arrive within 30 seconds

---

## Staying Up
n8n runs in the background as long as Docker is running.
Docker auto-starts with Windows (if installed that way).
If n8n stops: `docker start n8n`
View logs: `docker logs n8n --tail 50`

---

## Cost
Docker Desktop: Free (personal use)
n8n self-hosted: Free forever (unlimited workflows, unlimited executions)
Gmail API: Free (OAuth)
Anthropic API for social captions: ~$0.001 per post generated

**Total: ~$0/mo** vs $59/mo for Zapier + Blotato + Make

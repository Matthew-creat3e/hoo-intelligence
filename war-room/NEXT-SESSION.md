# LION'S DEN — Next Session Kickoff
**Goal: Make it FUNCTIONAL. Every button must DO something.**

---

## Start Here (every session)

### 1. Start both servers
```bash
cd /c/Users/Matth/hoo-workspace/war-room
npm run server   # backend :3001 — terminal 1
npm run dev      # frontend :5173 — terminal 2
```

### 2. Open http://localhost:5173

### 3. Confirm it loads — you should see:
- Top bar: red "LION'S DEN ONLINE" + yellow "OLLAMA DIRECT" + green "BACKEND LIVE"
- 6 engines in left sidebar
- 3 real leads in THE HUNT view
- Real demo counts in THE FORGE view

---

## The Core Problem to Solve

The dashboard DISPLAYS. It doesn't DO. That's the whole job for next session.

Matthew's words: *"this thing needs to be live — this isn't a game, this is my livelihood"*

## Build Order (actions first, then UI)

### Phase 1: Action Endpoints (backend)
Add POST endpoints to `server.js`:

- `POST /api/hunt/run` — body: `{industry, city}` → executes `/hunt` skill via child_process, writes results to vault, returns new leads
- `POST /api/lead/:filename/stage` — body: `{stage}` → updates pipeline stage in the .md file
- `POST /api/outreach/draft` — body: `{leadId, templateId}` → returns drafted email
- `POST /api/outreach/send` — body: `{leadId, email}` → triggers n8n webhook to send via Gmail
- `POST /api/audit/run` — body: `{url}` → executes `/aeo-audit` skill, returns score + report
- `POST /api/build/start` — body: `{industry, businessName}` → starts demo build
- `POST /api/command` — body: `{cmd}` → routes command to appropriate skill

### Phase 2: Wire Frontend to Actions
Update `WarRoom.jsx`:

- Quick action buttons (RUN HUNT / BUILD DEMO / DEPLOY POST / RUN AUDIT) → each calls a POST endpoint
- Each engine view: add action buttons on each data item (e.g., lead cards get "DRAFT EMAIL", "CALL", "UPDATE STAGE" buttons)
- Command parser: extend to handle `/hunt <industry> <city>`, `/audit <url>`, `/draft <lead>`, `/send <lead>`, `/stage <lead> <stage>`

### Phase 3: n8n Integration
Matthew has these workflows configured:
- Gmail reply detector
- Daily briefing generator
- Social post scheduler

Each has a webhook URL — add them to an env config and call from backend endpoints.

### Phase 4: Real-Time Updates (ditch 30s polling)
- Add WebSocket server (ws://) to `server.js`
- File watcher (chokidar) on vault + STATE.md + engine/data
- Push updates immediately on file change
- Frontend subscribes to WS, replaces the 30s polling

### Phase 5: Persistence
- localStorage for active engine, selected model, AI message history
- Or SQLite via better-sqlite3 for heavier state

---

## The Test (know when it's functional)

Can Matthew do this WITHOUT leaving the dashboard?

1. See a lead in THE HUNT
2. Click "DRAFT EMAIL" — AI drafts using lead data
3. Edit if needed, click "SEND"
4. Gmail sends it, lead stage updates to CONTACTED
5. Watch the intel feed show "Email sent to K.O.G Lawn"
6. When reply comes in (n8n detector), dashboard shows it
7. Click "UPDATE STAGE" → move to RESPONDED

If yes = functional. If no = keep building.

---

## What's Already Done (don't rebuild)

- ✅ Vite + React + Tailwind scaffolded
- ✅ Single-file WarRoom.jsx (1700 lines, 6 engines)
- ✅ Design system complete (void/gold/red palette, fonts, scanline, glow)
- ✅ Express backend with GET endpoints for all data
- ✅ Ollama AI integration with full state context
- ✅ Live data hook polling every 30s
- ✅ Real leads, real demos, real STATE.md all displayed
- ✅ Command parser with /help /engine /model /status /ping /clear

## What's Stubbed (decorative, needs real wiring)

- ❌ Quick action buttons (RUN HUNT, BUILD DEMO, DEPLOY POST, RUN AUDIT) — click does nothing
- ❌ Lead cards — hover only, no actions
- ❌ Workflow status in right sidebar — hardcoded, not reading from n8n
- ❌ THE ROAR / DEN / CROWN / SHADOW engines — all mock data
- ❌ Alert ticker — some alerts from STATE.md but most hardcoded
- ❌ Milestone tracker — hardcoded 18%

---

## File Paths (bookmark these)

- Frontend: `c:/Users/Matth/hoo-workspace/war-room/src/WarRoom.jsx`
- Backend: `c:/Users/Matth/hoo-workspace/war-room/server.js`
- CSS: `c:/Users/Matth/hoo-workspace/war-room/src/index.css`
- Config: `c:/Users/Matth/hoo-workspace/war-room/vite.config.js`
- Real data source: vault at `C:/Users/Matth/Documents/HOO-Vault/`
- Real data source: `C:/Users/Matth/hoo-v8/engine/data/`
- Demos: `C:/Users/Matth/hoo-v8/outputs/demos/`

---

**Start the session with: "Let's make the Lion's Den functional."**

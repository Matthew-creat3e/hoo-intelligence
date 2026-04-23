import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Activity, AlertTriangle, Zap, Shield, Target, Eye, Brain,
  Terminal, Clock, Wifi, WifiOff, ChevronRight, Send,
  Crosshair, Flame, Volume2, BookOpen, Crown, Ghost,
  BarChart3, Users, Mail, TrendingUp, Calendar, FileText,
  CheckCircle, XCircle, Loader, Radio, Megaphone, Search,
  Star, ArrowUpRight, Server, Cpu, HardDrive, Globe,
  Play, Pause, RotateCcw, Download, Upload, Settings,
  MessageSquare, Layers, Database, Lock, Unlock, Map
} from 'lucide-react';

// ============================================================
// SECTION 0: LIVE DATA HOOK — reads from backend server
// ============================================================

const API_BASE = 'http://localhost:3001';

function useLiveData() {
  const [data, setData] = useState({
    leads: [],
    builds: null,
    pipeline: null,
    state: null,
    sessions: [],
    health: null,
  });
  const [backendOnline, setBackendOnline] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const [leads, builds, pipeline, state, sessions, health] = await Promise.all([
        fetch(`${API_BASE}/api/leads`).then(r => r.json()).catch(() => null),
        fetch(`${API_BASE}/api/builds`).then(r => r.json()).catch(() => null),
        fetch(`${API_BASE}/api/pipeline`).then(r => r.json()).catch(() => null),
        fetch(`${API_BASE}/api/state`).then(r => r.json()).catch(() => null),
        fetch(`${API_BASE}/api/sessions`).then(r => r.json()).catch(() => null),
        fetch(`${API_BASE}/api/health`).then(r => r.json()).catch(() => null),
      ]);
      setData({ leads: leads?.leads || [], builds, pipeline, state, sessions: sessions?.sessions || [], health });
      setBackendOnline(true);
    } catch {
      setBackendOnline(false);
    }
  }, []);

  // Fetch on mount + poll every 30s for changes
  useEffect(() => {
    fetchAll();
    const id = setInterval(async () => {
      try {
        const poll = await fetch(`${API_BASE}/api/poll`).then(r => r.json());
        if (poll.changed) fetchAll();
      } catch {
        // backend down
      }
    }, 30000);
    return () => clearInterval(id);
  }, [fetchAll]);

  return { ...data, backendOnline, refresh: fetchAll };
}

// ============================================================
// SECTION 1: CONSTANTS & DATA
// ============================================================

const ENGINES = [
  {
    id: 'FORGE',
    name: 'THE FORGE',
    subtitle: 'BUILD OPS',
    color: '#C8952E',
    icon: Flame,
    status: 'ACTIVE',
    lastActivity: '2 MIN AGO',
    missions: 4,
    completion: 72,
  },
  {
    id: 'HUNT',
    name: 'THE HUNT',
    subtitle: 'LEAD ENGINE',
    color: '#4DA6FF',
    icon: Crosshair,
    status: 'ACTIVE',
    lastActivity: '14 MIN AGO',
    missions: 6,
    completion: 38,
  },
  {
    id: 'ROAR',
    name: 'THE ROAR',
    subtitle: 'SOCIAL MACHINE',
    color: '#00FF88',
    icon: Megaphone,
    status: 'STANDBY',
    lastActivity: '1 HR AGO',
    missions: 3,
    completion: 55,
  },
  {
    id: 'DEN',
    name: 'THE DEN',
    subtitle: 'LEARNING OPS',
    color: '#B366FF',
    icon: BookOpen,
    status: 'ACTIVE',
    lastActivity: '28 MIN AGO',
    missions: 5,
    completion: 61,
  },
  {
    id: 'CROWN',
    name: 'THE CROWN',
    subtitle: 'STORE COMMAND',
    color: '#FF2D2D',
    icon: Crown,
    status: 'STANDBY',
    lastActivity: '3 HR AGO',
    missions: 2,
    completion: 89,
  },
  {
    id: 'SHADOW',
    name: 'THE SHADOW',
    subtitle: 'INTEL & RECON',
    color: '#00E5FF',
    icon: Ghost,
    status: 'ACTIVE',
    lastActivity: '7 MIN AGO',
    missions: 4,
    completion: 44,
  },
];

const INTEL_FEED = [
  { time: '14:32', engine: 'FORGE', color: '#C8952E', msg: 'Pet grooming demo deployed — v7 standard confirmed' },
  { time: '14:18', engine: 'HUNT', color: '#4DA6FF', msg: 'New signal: 3 lawn care leads Independence MO — no website detected' },
  { time: '13:55', engine: 'SHADOW', color: '#00E5FF', msg: 'Competitor scan complete — 4 KC agencies lack mobile optimization' },
  { time: '13:41', engine: 'ROAR', color: '#00FF88', msg: 'Content calendar loaded — 12 posts queued for deployment' },
  { time: '13:22', engine: 'DEN', color: '#B366FF', msg: 'AEO fundamentals module completed — score: 94%' },
  { time: '12:58', engine: 'FORGE', color: '#C8952E', msg: 'Pressure washing demo — dark industrial build live' },
  { time: '12:30', engine: 'HUNT', color: '#4DA6FF', msg: 'Outreach template 01 drafted — cold approach for no-website leads' },
  { time: '12:15', engine: 'CROWN', color: '#FF2D2D', msg: 'Shopify Partner dashboard synced — 0 active stores, 0 commission' },
  { time: '11:48', engine: 'SHADOW', color: '#00E5FF', msg: 'Google Business Profile gaps detected in 6 Independence businesses' },
  { time: '11:20', engine: 'DEN', color: '#B366FF', msg: 'Local SEO checklist v2 committed to knowledge base' },
];

const WORKFLOWS = [
  { name: 'Gmail Reply Detector', status: 'ACTIVE', icon: Mail, color: '#00FF88' },
  { name: 'Daily Briefing Generator', status: 'ACTIVE', icon: FileText, color: '#00FF88' },
  { name: 'Social Post Scheduler', status: 'STANDBY', icon: Calendar, color: '#C8952E' },
  { name: 'Lead Signal Scanner', status: 'ACTIVE', icon: Search, color: '#00FF88' },
  { name: 'Site Audit Crawler', status: 'ERROR', icon: AlertTriangle, color: '#FF2D2D' },
  { name: 'Competitor Watch', status: 'STANDBY', icon: Eye, color: '#C8952E' },
];

const ALERTS = [
  '3 HOT LEADS AWAITING FIRST CONTACT — INDEPENDENCE MO',
  'DEMO PIPELINE: 3 V7 COMPLETE — LAWN CARE V7 NEXT IN QUEUE',
  'SHOPIFY PARTNER LINK NOT YET ON ANY STORE — ZERO COMMISSION ACTIVE',
  'AEO AUDIT SKILL DEPLOYED — RUN /AEO-AUDIT ON NEXT BUILD',
  'TWILIO NOT CONFIGURED — SMS OUTREACH BLOCKED',
  'YELP SCRAPER DOWN — MANUAL RECON REQUIRED',
  'OBSIDIAN VAULT LAST SYNCED 2026-04-14 — UPDATE DUE',
];

const COMMANDS = {
  '/help': 'Show available commands',
  '/engine': 'Switch engine — /engine FORGE',
  '/model': 'Switch AI model — /model deepseek-r1:8b',
  '/status': 'Show all engine statuses',
  '/ping': 'Test AI + backend connection',
  '/clear': 'Clear AI responses',
  '/engines': 'List all engines',
  '/audit': 'Audit a URL — /audit https://example.com',
  '/hunt': 'Run a hunt — /hunt lawn-care Independence',
  '/draft': 'Draft email for lead — /draft KOG-Lawn-Landscaping.md',
  '/stage': 'Update lead stage — /stage KOG-Lawn-Landscaping.md OUTREACH_SENT',
  '/refresh': 'Reload live data from vault',
};

const AI_CONFIG = {
  openclawUrl: 'ws://127.0.0.1:18789',
  ollamaUrl: 'http://localhost:11434',
  defaultModel: 'qwen3:8b',
  models: ['qwen3:8b', 'deepseek-r1:8b', 'gemma3:4b'],
};

const QUICK_STATS = [
  { label: 'MISSIONS', value: 24, icon: Target },
  { label: 'LEADS', value: 3, icon: Users },
  { label: 'BUILDS', value: 7, icon: Layers },
  { label: 'MRR', value: '$0', icon: TrendingUp },
];

const MILESTONE = {
  label: 'FIRST CLIENT CLOSE',
  target: 'Q2 2026',
  progress: 18,
};

// ============================================================
// SECTION 2: SUB-COMPONENTS
// ============================================================

const actionBtn = (color, disabled = false) => ({
  background: disabled ? 'var(--bg-panel)' : 'var(--bg-elevated)',
  border: `1px solid ${disabled ? 'var(--border-dim)' : color}`,
  color: disabled ? 'var(--text-muted)' : color,
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: '10px',
  padding: '4px 10px',
  borderRadius: '2px',
  cursor: disabled ? 'not-allowed' : 'pointer',
  opacity: disabled ? 0.5 : 1,
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  letterSpacing: '0.05em',
});

const ScanlineOverlay = () => (
  <div
    style={{
      position: 'fixed', inset: 0, zIndex: 9999, pointerEvents: 'none',
      background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)',
    }}
  />
);

const PanelLabel = ({ children }) => (
  <span style={{
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '10px',
    letterSpacing: '0.2em',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
  }}>
    {children}
  </span>
);

// --- TOP BAR ---
const TopBar = ({ clock, aiStatus, selectedModel, bootPhase, backendOnline }) => (
  <div
    style={{
      gridArea: 'topbar',
      background: 'var(--bg-panel)',
      borderBottom: '1px solid var(--border-dim)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 16px',
      opacity: bootPhase >= 1 ? 1 : 0,
      animation: bootPhase === 1 ? 'bootFadeIn 0.4s ease forwards' : 'none',
    }}
  >
    {/* Left: Live indicator */}
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div style={{
        width: 8, height: 8, borderRadius: '50%', background: 'var(--red-alert)',
        animation: 'redPulse 1.5s ease-in-out infinite',
      }} />
      <span style={{
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: '16px',
        letterSpacing: '0.15em',
        color: 'var(--text-primary)',
      }}>
        LION'S DEN ONLINE
      </span>
      <span style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '10px',
        color: 'var(--text-muted)',
        marginLeft: '4px',
      }}>
        V8.0
      </span>
    </div>

    {/* Center: System indicators */}
    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
      {[
        { label: 'ENGINES', value: '6/6', color: 'var(--green-online)' },
        { label: 'BACKEND', value: backendOnline ? 'LIVE' : 'DOWN', color: backendOnline ? 'var(--green-online)' : 'var(--red-alert)' },
        { label: 'DATA', value: backendOnline ? 'REAL' : 'STATIC', color: backendOnline ? 'var(--green-online)' : 'var(--gold-primary)' },
      ].map((s) => (
        <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: s.color }} />
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: 'var(--text-muted)' }}>
            {s.label}
          </span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: 'var(--text-primary)' }}>
            {s.value}
          </span>
        </div>
      ))}
    </div>

    {/* Right: AI status + Clock */}
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
      {/* AI Connection */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        padding: '2px 10px',
        border: `1px solid ${aiStatus === 'openclaw' ? 'var(--green-online)' : aiStatus === 'ollama' ? 'var(--gold-primary)' : 'var(--red-alert)'}`,
        borderRadius: '2px',
      }}>
        <div style={{
          width: 6, height: 6, borderRadius: '50%',
          background: aiStatus === 'openclaw' ? 'var(--green-online)' : aiStatus === 'ollama' ? 'var(--gold-primary)' : 'var(--red-alert)',
          animation: aiStatus !== 'offline' ? 'redPulse 2s ease-in-out infinite' : 'none',
        }} />
        <span style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: '10px',
          color: aiStatus === 'openclaw' ? 'var(--green-online)' : aiStatus === 'ollama' ? 'var(--gold-primary)' : 'var(--red-alert)',
        }}>
          {aiStatus === 'openclaw' ? 'OPENCLAW LIVE' : aiStatus === 'ollama' ? 'OLLAMA DIRECT' : 'AI OFFLINE'}
        </span>
      </div>
      {/* Model */}
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: 'var(--text-muted)' }}>
        MODEL: {selectedModel}
      </span>
      {/* Clock */}
      <span style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '14px',
        color: 'var(--gold-primary)',
        letterSpacing: '0.1em',
      }}>
        {clock}
      </span>
    </div>
  </div>
);

// --- LEFT SIDEBAR ---
const LeftSidebar = ({ engines, activeEngine, onSelectEngine, bootPhase, quickStats }) => (
  <div
    style={{
      gridArea: 'left',
      background: 'var(--bg-panel)',
      borderRight: '1px solid var(--border-dim)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      opacity: bootPhase >= 2 ? 1 : 0,
      animation: bootPhase === 2 ? 'bootFadeIn 0.4s ease 0.1s forwards' : 'none',
    }}
  >
    {/* Engine label */}
    <div style={{ padding: '12px 14px 8px', borderBottom: '1px solid var(--border-dim)' }}>
      <PanelLabel>ENGINE SELECTOR</PanelLabel>
    </div>

    {/* Engine list */}
    <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
      {engines.map((eng) => {
        const isActive = activeEngine === eng.id;
        const Icon = eng.icon;
        return (
          <div
            key={eng.id}
            onClick={() => onSelectEngine(eng.id)}
            style={{
              padding: '10px 14px',
              cursor: 'pointer',
              borderLeft: `3px solid ${isActive ? eng.color : 'transparent'}`,
              background: isActive ? 'var(--bg-elevated)' : 'transparent',
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
            onMouseEnter={(e) => {
              if (!isActive) e.currentTarget.style.background = 'var(--bg-elevated)';
            }}
            onMouseLeave={(e) => {
              if (!isActive) e.currentTarget.style.background = 'transparent';
            }}
          >
            <Icon size={16} color={eng.color} />
            <div style={{ flex: 1 }}>
              <div style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: '14px',
                letterSpacing: '0.12em',
                color: isActive ? eng.color : 'var(--text-primary)',
              }}>
                {eng.name}
              </div>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '9px',
                color: 'var(--text-muted)',
              }}>
                {eng.subtitle} — {eng.lastActivity}
              </div>
            </div>
            <div style={{
              padding: '1px 6px',
              fontSize: '8px',
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: '0.1em',
              borderRadius: '2px',
              color: eng.status === 'ACTIVE' ? 'var(--green-online)' : eng.status === 'BLOCKED' ? 'var(--red-alert)' : 'var(--gold-primary)',
              border: `1px solid ${eng.status === 'ACTIVE' ? 'var(--green-online)' : eng.status === 'BLOCKED' ? 'var(--red-alert)' : 'var(--gold-primary)'}`,
            }}>
              {eng.status}
            </div>
          </div>
        );
      })}
    </div>

    {/* Quick Stats */}
    <div style={{ borderTop: '1px solid var(--border-dim)', padding: '10px 14px' }}>
      <PanelLabel>QUICK STATS</PanelLabel>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px' }}>
        {(quickStats || QUICK_STATS).map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-dim)',
              borderRadius: '2px',
              padding: '8px',
              textAlign: 'center',
            }}>
              <Icon size={12} color="var(--gold-primary)" style={{ marginBottom: '4px' }} />
              <div style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: '20px',
                color: 'var(--gold-bright)',
              }}>
                {stat.value}
              </div>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '8px',
                color: 'var(--text-muted)',
                letterSpacing: '0.1em',
              }}>
                {stat.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>

    {/* Milestone */}
    <div style={{ borderTop: '1px solid var(--border-dim)', padding: '10px 14px' }}>
      <PanelLabel>MILESTONE</PanelLabel>
      <div style={{ marginTop: '6px' }}>
        <div style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: '13px',
          letterSpacing: '0.1em',
          color: 'var(--gold-primary)',
        }}>
          {MILESTONE.label}
        </div>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '10px',
          color: 'var(--text-muted)',
          marginBottom: '6px',
        }}>
          TARGET: {MILESTONE.target}
        </div>
        <div style={{
          height: '4px',
          background: 'var(--border-dim)',
          borderRadius: '2px',
          overflow: 'hidden',
        }}>
          <div style={{
            width: `${MILESTONE.progress}%`,
            height: '100%',
            background: 'var(--gold-primary)',
            borderRadius: '2px',
            transition: 'width 0.5s ease',
          }} />
        </div>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '9px',
          color: 'var(--text-muted)',
          textAlign: 'right',
          marginTop: '2px',
        }}>
          {MILESTONE.progress}%
        </div>
      </div>
    </div>
  </div>
);

// --- ENGINE VIEWS (CENTER VIEWPORT) ---

// THE FORGE — Build Ops (LIVE DATA)
const ForgeView = ({ liveData }) => {
  const builds = liveData?.builds;
  const totalDemos = builds?.totalDemos || 0;
  const v7Count = builds?.v7Count || 0;
  const v6Count = builds?.v6Count || 0;
  const v5Count = builds?.v5Count || 0;
  const v4Count = builds?.v4Count || 0;

  // Build kanban from real demo files
  const deployedItems = (builds?.demos || [])
    .filter(d => d.filename.includes('v7') || d.filename.includes('v6'))
    .map(d => ({
      name: d.filename.replace('.html', '').replace(/v\d-/, '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      tag: d.version.toUpperCase(),
      priority: 'DONE',
    }));

  const kanbanCols = [
    {
      title: 'QUEUED', color: 'var(--text-muted)',
      items: [
        { name: 'Lawn Care V7', tag: 'DEMO', priority: 'HIGH' },
        { name: 'Barber V7', tag: 'DEMO', priority: 'MED' },
      ]
    },
    {
      title: 'IN PROGRESS', color: 'var(--gold-primary)',
      items: [
        { name: 'HOO Interactive Demo', tag: 'SITE', priority: 'CRITICAL' },
        ...(builds?.hooDemoLive ? [] : [{ name: 'HOO Landing', tag: 'SITE', priority: 'HIGH' }]),
      ]
    },
    {
      title: 'REVIEW', color: 'var(--blue-intel)',
      items: [
        { name: 'Mobile Detailing V7', tag: 'DEMO', priority: 'MED' },
      ]
    },
    {
      title: 'DEPLOYED', color: 'var(--green-online)',
      items: deployedItems.length > 0 ? deployedItems.slice(0, 8) : [
        { name: 'Start backend to load', tag: '—', priority: 'DONE' },
      ]
    },
  ];

  return (
    <div style={{ padding: '16px', height: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Flame size={18} color="#C8952E" />
        <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '22px', letterSpacing: '0.15em', color: '#C8952E' }}>
          THE FORGE — BUILD OPS
        </span>
      </div>

      {/* Revenue bar */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px',
      }}>
        {[
          { label: 'TOTAL DEMOS', value: String(totalDemos), sub: `${v7Count} V7 / ${v6Count} V6 / ${v5Count} V5 / ${v4Count} V4` },
          { label: 'IN PIPELINE', value: String(kanbanCols[0].items.length + kanbanCols[1].items.length), sub: 'QUEUED + ACTIVE' },
          { label: 'REVENUE', value: `$${liveData?.pipeline?.pipelineStats?.mrr || 0}`, sub: 'MONTHLY RECURRING' },
          { label: 'QUALITY BAR', value: 'V7', sub: 'PET GROOM STANDARD' },
        ].map((m) => (
          <div key={m.label} style={{
            background: 'var(--bg-elevated)', border: '1px solid var(--border-dim)',
            borderRadius: '2px', padding: '10px', textAlign: 'center',
          }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>{m.label}</div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '28px', color: 'var(--gold-bright)', lineHeight: 1 }}>{m.value}</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '8px', color: 'var(--text-muted)' }}>{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Kanban */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', minHeight: 0 }}>
        {kanbanCols.map((col) => (
          <div key={col.title} style={{
            background: 'var(--bg-elevated)', border: '1px solid var(--border-dim)',
            borderRadius: '2px', display: 'flex', flexDirection: 'column', overflow: 'hidden',
          }}>
            <div style={{
              padding: '8px 10px', borderBottom: '1px solid var(--border-dim)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', letterSpacing: '0.15em', color: col.color }}>
                {col.title}
              </span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: 'var(--text-muted)' }}>
                {col.items.length}
              </span>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '6px' }}>
              {col.items.map((item) => (
                <div key={item.name} style={{
                  background: 'var(--bg-panel)', border: '1px solid var(--border-dim)',
                  borderRadius: '2px', padding: '8px', marginBottom: '6px',
                  transition: 'border-color 0.15s',
                  cursor: 'pointer',
                }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--border-active)'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-dim)'}
                >
                  <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    {item.name}
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <span style={{
                      fontFamily: "'JetBrains Mono', monospace", fontSize: '8px', padding: '1px 4px',
                      border: '1px solid var(--border-dim)', borderRadius: '2px', color: 'var(--text-muted)',
                    }}>{item.tag}</span>
                    <span style={{
                      fontFamily: "'JetBrains Mono', monospace", fontSize: '8px', padding: '1px 4px',
                      borderRadius: '2px',
                      color: item.priority === 'CRITICAL' ? 'var(--red-alert)' : item.priority === 'HIGH' ? 'var(--gold-primary)' : item.priority === 'DONE' ? 'var(--green-online)' : 'var(--text-muted)',
                      border: `1px solid ${item.priority === 'CRITICAL' ? 'var(--red-alert)' : item.priority === 'HIGH' ? 'var(--gold-primary)' : item.priority === 'DONE' ? 'var(--green-online)' : 'var(--border-dim)'}`,
                    }}>{item.priority}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// THE HUNT — Lead Engine (LIVE DATA + ACTIONS)
const HuntView = ({ liveData, actions }) => {
  const [expandedLead, setExpandedLead] = useState(null);
  const realLeads = (liveData?.leads || []).map(lead => ({
    filename: lead.filename,
    name: lead.name || lead.filename.replace('.md', ''),
    location: lead.address || 'Unknown',
    signal: lead.website ? 'BAD WEBSITE' : 'NO WEBSITE',
    score: parseInt(lead.score) || 0,
    phone: lead.phone || '—',
    email: lead.email || '—',
    stage: lead.stage || 'DISCOVERED',
    tags: lead.tags || [],
  }));

  const pipelineStats = liveData?.pipeline?.pipelineStats;
  const totalLeads = pipelineStats?.total_leads || realLeads.length;
  const contacted = pipelineStats?.contacted || 0;
  const responded = pipelineStats?.responded || 0;
  const closed = pipelineStats?.closed || 0;
  const scored = realLeads.filter(l => l.score > 0).length;

  const maxCount = Math.max(totalLeads, 1);
  const pipeline = [
    { stage: 'DETECTED', count: totalLeads, color: 'var(--text-muted)', width: '100%' },
    { stage: 'SCORED', count: scored, color: 'var(--blue-intel)', width: `${(scored / maxCount) * 100}%` },
    { stage: 'CONTACTED', count: contacted, color: 'var(--gold-primary)', width: `${(contacted / maxCount) * 100}%` },
    { stage: 'RESPONDED', count: responded, color: 'var(--gold-bright)', width: `${(responded / maxCount) * 100}%` },
    { stage: 'CLOSED', count: closed, color: 'var(--green-online)', width: `${(closed / maxCount) * 100}%` },
  ];

  const hotLeads = realLeads.length > 0 ? realLeads : [
    { name: 'No leads loaded', location: 'Start backend server', signal: '—', score: 0, phone: '—', email: '—' },
  ];

  return (
    <div style={{ padding: '16px', height: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Crosshair size={18} color="#4DA6FF" />
        <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '22px', letterSpacing: '0.15em', color: '#4DA6FF' }}>
          THE HUNT — LEAD ENGINE
        </span>
      </div>

      {/* Pipeline funnel */}
      <div style={{
        background: 'var(--bg-elevated)', border: '1px solid var(--border-dim)',
        borderRadius: '2px', padding: '14px',
      }}>
        <PanelLabel>PIPELINE FUNNEL</PanelLabel>
        <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {pipeline.map((p) => (
            <div key={p.stage} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: 'var(--text-muted)', width: '80px', letterSpacing: '0.08em' }}>
                {p.stage}
              </span>
              <div style={{ flex: 1, height: '14px', background: 'var(--bg-panel)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{
                  width: p.width, height: '100%', background: p.color,
                  borderRadius: '2px', transition: 'width 0.5s ease',
                  minWidth: p.count > 0 ? '20px' : '0',
                }} />
              </div>
              <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '18px', color: p.color, width: '30px', textAlign: 'right' }}>
                {p.count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Hot leads call sheet */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div style={{
          background: 'var(--bg-elevated)', border: '1px solid var(--border-dim)',
          borderRadius: '2px', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-dim)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <PanelLabel>HOT LEADS — CALL SHEET</PanelLabel>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', padding: '2px 8px',
              border: '1px solid var(--red-alert)', borderRadius: '2px', color: 'var(--red-alert)',
              animation: 'redPulse 2s ease-in-out infinite',
            }}>
              {hotLeads.length} READY
            </span>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
            {hotLeads.map((lead, i) => {
              const isExpanded = expandedLead === (lead.filename || i);
              return (
                <div key={lead.filename || i} style={{
                  background: 'var(--bg-panel)', border: `1px solid ${isExpanded ? '#4DA6FF' : 'var(--border-dim)'}`,
                  borderRadius: '2px', marginBottom: '8px',
                  transition: 'border-color 0.15s',
                  boxShadow: isExpanded ? '0 0 16px rgba(77,166,255,0.15)' : 'none',
                }}>
                  <div
                    onClick={() => lead.filename && setExpandedLead(isExpanded ? null : lead.filename)}
                    style={{
                      padding: '12px',
                      display: 'flex', alignItems: 'center', gap: '12px',
                      cursor: lead.filename ? 'pointer' : 'default',
                    }}
                  >
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '2px',
                      background: 'rgba(77,166,255,0.1)', border: '1px solid rgba(77,166,255,0.3)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: "'Bebas Neue', sans-serif", fontSize: '16px', color: '#4DA6FF',
                    }}>
                      {lead.score}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {lead.name}
                      </div>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: 'var(--text-muted)' }}>
                        {lead.location}
                      </div>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {lead.phone && lead.phone !== '—' ? `TEL: ${lead.phone}` : ''}{lead.email && lead.email !== '—' ? ` | ${lead.email}` : ''}
                      </div>
                    </div>
                    <span style={{
                      fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', padding: '2px 8px',
                      borderRadius: '2px',
                      border: '1px solid var(--gold-primary)', color: 'var(--gold-primary)',
                    }}>
                      {lead.stage}
                    </span>
                    <span style={{
                      fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', padding: '2px 8px',
                      border: '1px solid var(--red-alert)', borderRadius: '2px', color: 'var(--red-alert)',
                    }}>
                      {lead.signal}
                    </span>
                  </div>

                  {/* Expanded action buttons */}
                  {isExpanded && lead.filename && (
                    <div style={{
                      borderTop: '1px solid var(--border-dim)',
                      padding: '10px 12px',
                      display: 'flex', gap: '8px', flexWrap: 'wrap',
                    }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); actions?.draftEmail(lead); }}
                        disabled={!lead.email || lead.email === '—'}
                        style={actionBtn('var(--gold-primary)', !lead.email || lead.email === '—')}
                      >
                        <Mail size={11} /> DRAFT EMAIL
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); actions?.callLead(lead); }}
                        disabled={!lead.phone || lead.phone === '—'}
                        style={actionBtn('var(--green-online)', !lead.phone || lead.phone === '—')}
                      >
                        <Terminal size={11} /> CALL
                      </button>
                      <select
                        onChange={(e) => { e.stopPropagation(); actions?.updateStage(lead, e.target.value); }}
                        value={lead.stage}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          background: 'var(--bg-elevated)',
                          border: '1px solid var(--border-dim)',
                          color: 'var(--text-primary)',
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: '10px',
                          padding: '4px 8px',
                          borderRadius: '2px',
                          cursor: 'pointer',
                        }}
                      >
                        <option value="DISCOVERED">DISCOVERED</option>
                        <option value="ENRICHED">ENRICHED</option>
                        <option value="SCORED">SCORED</option>
                        <option value="DEMO_BUILT">DEMO_BUILT</option>
                        <option value="OUTREACH_SENT">OUTREACH_SENT</option>
                        <option value="RESPONDED">RESPONDED</option>
                        <option value="CLOSED">CLOSED</option>
                      </select>
                      <button
                        onClick={(e) => { e.stopPropagation(); actions?.auditUrl(lead.website); }}
                        disabled={!lead.website || lead.website === '—'}
                        style={actionBtn('var(--blue-intel)', !lead.website || lead.website === '—')}
                      >
                        <Shield size={11} /> AUDIT SITE
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Outreach stats */}
          <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border-dim)', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
            {[
              { label: 'EMAILS SENT', value: String(contacted) },
              { label: 'REPLIES', value: String(responded) },
              { label: 'LEADS', value: String(totalLeads) },
              { label: 'CLOSE RATE', value: closed > 0 ? `${Math.round((closed / totalLeads) * 100)}%` : '—' },
            ].map((s) => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '18px', color: 'var(--blue-intel)' }}>{s.value}</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '8px', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// THE ROAR — Social Machine
const RoarView = () => {
  const platforms = [
    { name: 'FACEBOOK', followers: '—', posts: 0, engagement: '—', color: '#4DA6FF' },
    { name: 'INSTAGRAM', followers: '—', posts: 0, engagement: '—', color: '#E8B84B' },
    { name: 'TIKTOK', followers: '—', posts: 0, engagement: '—', color: '#00E5FF' },
    { name: 'LINKEDIN', followers: '—', posts: 0, engagement: '—', color: '#00FF88' },
  ];

  const postQueue = [
    { title: 'Before/After: Pet Grooming Build', platform: 'FB + IG', status: 'READY', date: 'APR 16' },
    { title: 'Why Your Business Needs a Website in 2026', platform: 'LINKEDIN', status: 'DRAFT', date: 'APR 17' },
    { title: 'Pressure Washing Demo Reel', platform: 'TIKTOK', status: 'DRAFT', date: 'APR 18' },
    { title: 'HOO Build Process — Screen Record', platform: 'ALL', status: 'QUEUED', date: 'APR 20' },
  ];

  return (
    <div style={{ padding: '16px', height: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Megaphone size={18} color="#00FF88" />
        <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '22px', letterSpacing: '0.15em', color: '#00FF88' }}>
          THE ROAR — SOCIAL MACHINE
        </span>
      </div>

      {/* Platform stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
        {platforms.map((p) => (
          <div key={p.name} style={{
            background: 'var(--bg-elevated)', border: '1px solid var(--border-dim)',
            borderRadius: '2px', padding: '12px', textAlign: 'center',
          }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: p.color, letterSpacing: '0.12em', marginBottom: '6px' }}>{p.name}</div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '24px', color: 'var(--text-primary)', lineHeight: 1 }}>{p.followers}</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: 'var(--text-muted)', marginTop: '4px' }}>
              {p.posts} POSTS | {p.engagement} ENG
            </div>
          </div>
        ))}
      </div>

      {/* Content calendar / post queue */}
      <div style={{ flex: 1, background: 'var(--bg-elevated)', border: '1px solid var(--border-dim)', borderRadius: '2px', display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
        <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-dim)' }}>
          <PanelLabel>POST QUEUE — CONTENT CALENDAR</PanelLabel>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
          {postQueue.map((post, i) => (
            <div key={i} style={{
              background: 'var(--bg-panel)', border: '1px solid var(--border-dim)',
              borderRadius: '2px', padding: '10px 12px', marginBottom: '6px',
              display: 'flex', alignItems: 'center', gap: '12px',
            }}>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: '10px',
                color: 'var(--text-muted)', width: '50px',
              }}>{post.date}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>{post.title}</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: 'var(--text-muted)' }}>{post.platform}</div>
              </div>
              <span style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', padding: '2px 8px',
                borderRadius: '2px',
                color: post.status === 'READY' ? 'var(--green-online)' : post.status === 'DRAFT' ? 'var(--gold-primary)' : 'var(--text-muted)',
                border: `1px solid ${post.status === 'READY' ? 'var(--green-online)' : post.status === 'DRAFT' ? 'var(--gold-primary)' : 'var(--border-dim)'}`,
              }}>{post.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// THE DEN — Learning Ops
const DenView = () => {
  const tracks = [
    { name: 'AEO Fundamentals', progress: 94, status: 'COMPLETE', color: '#00FF88' },
    { name: 'Local SEO Mastery', progress: 61, status: 'IN PROGRESS', color: '#B366FF' },
    { name: 'Shopify Liquid', progress: 35, status: 'IN PROGRESS', color: '#B366FF' },
    { name: 'React + Tailwind', progress: 72, status: 'IN PROGRESS', color: '#B366FF' },
    { name: 'Cold Outreach', progress: 20, status: 'QUEUED', color: '#C8952E' },
    { name: 'Facebook Ads', progress: 0, status: 'LOCKED', color: '#666666' },
  ];

  const studyLog = [
    { date: 'APR 14', topic: 'V7 demo patterns — confirmed sliders, counters, marquee, timelines', hours: 2.5 },
    { date: 'APR 12', topic: 'AEO fundamentals — question headings, 60-word answers, schema', hours: 1.5 },
    { date: 'APR 10', topic: 'Competitor analysis — KC web agencies, pricing, service gaps', hours: 2.0 },
    { date: 'APR 08', topic: 'Local SEO — GBP optimization, citation building, NAP consistency', hours: 1.0 },
  ];

  return (
    <div style={{ padding: '16px', height: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <BookOpen size={18} color="#B366FF" />
        <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '22px', letterSpacing: '0.15em', color: '#B366FF' }}>
          THE DEN — LEARNING OPS
        </span>
      </div>

      {/* Skill tracks */}
      <div style={{
        background: 'var(--bg-elevated)', border: '1px solid var(--border-dim)',
        borderRadius: '2px', padding: '14px',
      }}>
        <PanelLabel>SKILL TRACKS</PanelLabel>
        <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {tracks.map((t) => (
            <div key={t.name}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                <span style={{ fontFamily: "'Syne', sans-serif", fontSize: '12px', color: 'var(--text-primary)' }}>{t.name}</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: t.color }}>{t.status} — {t.progress}%</span>
              </div>
              <div style={{ height: '6px', background: 'var(--bg-panel)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ width: `${t.progress}%`, height: '100%', background: t.color, borderRadius: '2px', transition: 'width 0.5s ease' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Study log */}
      <div style={{ flex: 1, background: 'var(--bg-elevated)', border: '1px solid var(--border-dim)', borderRadius: '2px', display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
        <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-dim)' }}>
          <PanelLabel>STUDY LOG</PanelLabel>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
          {studyLog.map((entry, i) => (
            <div key={i} style={{
              background: 'var(--bg-panel)', border: '1px solid var(--border-dim)',
              borderRadius: '2px', padding: '10px 12px', marginBottom: '6px',
              display: 'flex', alignItems: 'center', gap: '12px',
            }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: '#B366FF', width: '55px' }}>{entry.date}</div>
              <div style={{ flex: 1, fontFamily: "'Syne', sans-serif", fontSize: '11px', color: 'var(--text-primary)' }}>{entry.topic}</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: 'var(--text-muted)' }}>{entry.hours}h</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// THE CROWN — Store Command
const CrownView = () => {
  const stores = [
    { name: 'herrmanonlineoutlook.com', status: 'LIVE', health: 72, uptime: '99.2%', issues: 3 },
  ];

  const audits = [
    { category: 'MOBILE RESPONSIVE', score: 85, color: '#00FF88' },
    { category: 'PAGE SPEED', score: 62, color: '#C8952E' },
    { category: 'SEO SCORE', score: 48, color: '#FF2D2D' },
    { category: 'AEO READINESS', score: 30, color: '#FF2D2D' },
    { category: 'ACCESSIBILITY', score: 71, color: '#C8952E' },
    { category: 'SECURITY', score: 90, color: '#00FF88' },
  ];

  return (
    <div style={{ padding: '16px', height: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Crown size={18} color="#FF2D2D" />
        <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '22px', letterSpacing: '0.15em', color: '#FF2D2D' }}>
          THE CROWN — STORE COMMAND
        </span>
      </div>

      {/* Store health */}
      <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-dim)', borderRadius: '2px', padding: '14px' }}>
        <PanelLabel>STORE HEALTH</PanelLabel>
        {stores.map((store) => (
          <div key={store.name} style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <Globe size={20} color="var(--red-alert)" />
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{store.name}</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: 'var(--text-muted)' }}>
                UPTIME: {store.uptime} | ISSUES: {store.issues}
              </div>
            </div>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', padding: '2px 8px',
              border: '1px solid var(--green-online)', borderRadius: '2px', color: 'var(--green-online)',
            }}>{store.status}</span>
          </div>
        ))}
      </div>

      {/* Audit scores */}
      <div style={{ flex: 1, background: 'var(--bg-elevated)', border: '1px solid var(--border-dim)', borderRadius: '2px', display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
        <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-dim)' }}>
          <PanelLabel>AUDIT SCORES</PanelLabel>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            {audits.map((a) => (
              <div key={a.category} style={{
                background: 'var(--bg-panel)', border: '1px solid var(--border-dim)',
                borderRadius: '2px', padding: '14px', textAlign: 'center',
              }}>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '36px', color: a.color, lineHeight: 1 }}>{a.score}</div>
                <div style={{
                  fontFamily: "'JetBrains Mono', monospace", fontSize: '9px',
                  color: 'var(--text-muted)', letterSpacing: '0.1em', marginTop: '4px',
                }}>{a.category}</div>
                <div style={{
                  height: '3px', background: 'var(--border-dim)', borderRadius: '2px',
                  overflow: 'hidden', marginTop: '6px',
                }}>
                  <div style={{ width: `${a.score}%`, height: '100%', background: a.color, borderRadius: '2px' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// THE SHADOW — Intel & Recon
const ShadowView = () => {
  const competitors = [
    { name: 'Lifted Pixels KC', weakness: 'NO MOBILE OPT', threat: 'LOW', pricing: '$2K-5K' },
    { name: 'Heartland Digital', weakness: 'SLOW LOAD 4.2s', threat: 'MED', pricing: '$1.5K-3K' },
    { name: 'Show Me Web Co', weakness: 'NO AEO/SEO', threat: 'LOW', pricing: '$800-2K' },
    { name: 'KC Site Builders', weakness: 'TEMPLATE ONLY', threat: 'LOW', pricing: '$500-1.5K' },
  ];

  const signals = [
    { type: 'OPPORTUNITY', msg: '6 Independence businesses have no Google Business Profile', time: '11:48' },
    { type: 'MARKET', msg: 'KC lawn care season peak — April through October', time: '10:30' },
    { type: 'THREAT', msg: 'Wix launching AI builder — free tier may undercut low-end', time: '09:15' },
    { type: 'OPPORTUNITY', msg: '4 local agencies lack mobile optimization — attack vector', time: '08:40' },
  ];

  return (
    <div style={{ padding: '16px', height: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Ghost size={18} color="#00E5FF" />
        <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '22px', letterSpacing: '0.15em', color: '#00E5FF' }}>
          THE SHADOW — INTEL & RECON
        </span>
      </div>

      {/* Competitor watch */}
      <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-dim)', borderRadius: '2px', padding: '14px' }}>
        <PanelLabel>COMPETITOR WATCH</PanelLabel>
        <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {competitors.map((c) => (
            <div key={c.name} style={{
              background: 'var(--bg-panel)', border: '1px solid var(--border-dim)',
              borderRadius: '2px', padding: '10px 12px',
              display: 'flex', alignItems: 'center', gap: '12px',
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: 'var(--text-muted)' }}>WEAKNESS: {c.weakness}</div>
              </div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: 'var(--text-muted)' }}>{c.pricing}</div>
              <span style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', padding: '2px 6px',
                borderRadius: '2px',
                color: c.threat === 'MED' ? 'var(--gold-primary)' : 'var(--green-online)',
                border: `1px solid ${c.threat === 'MED' ? 'var(--gold-primary)' : 'var(--green-online)'}`,
              }}>{c.threat}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Market signals */}
      <div style={{ flex: 1, background: 'var(--bg-elevated)', border: '1px solid var(--border-dim)', borderRadius: '2px', display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
        <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-dim)' }}>
          <PanelLabel>MARKET SIGNALS</PanelLabel>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
          {signals.map((s, i) => (
            <div key={i} style={{
              background: 'var(--bg-panel)', border: '1px solid var(--border-dim)',
              borderRadius: '2px', padding: '10px 12px', marginBottom: '6px',
              display: 'flex', alignItems: 'flex-start', gap: '10px',
            }}>
              <span style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', padding: '2px 6px',
                borderRadius: '2px', whiteSpace: 'nowrap',
                color: s.type === 'THREAT' ? 'var(--red-alert)' : s.type === 'OPPORTUNITY' ? 'var(--green-online)' : 'var(--blue-intel)',
                border: `1px solid ${s.type === 'THREAT' ? 'var(--red-alert)' : s.type === 'OPPORTUNITY' ? 'var(--green-online)' : 'var(--blue-intel)'}`,
              }}>{s.type}</span>
              <div style={{ flex: 1, fontFamily: "'Syne', sans-serif", fontSize: '11px', color: 'var(--text-primary)' }}>{s.msg}</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: 'var(--text-muted)' }}>{s.time}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const ENGINE_VIEWS = {
  FORGE: ForgeView,
  HUNT: HuntView,
  ROAR: RoarView,
  DEN: DenView,
  CROWN: CrownView,
  SHADOW: ShadowView,
};

// --- RIGHT SIDEBAR ---
const RightSidebar = ({ bootPhase, actions, onOpenHuntPrompt, onOpenAuditPrompt }) => (
  <div
    style={{
      gridArea: 'right',
      background: 'var(--bg-panel)',
      borderLeft: '1px solid var(--border-dim)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      opacity: bootPhase >= 4 ? 1 : 0,
      animation: bootPhase === 4 ? 'bootFadeIn 0.4s ease 0.2s forwards' : 'none',
    }}
  >
    {/* Intel Feed */}
    <div style={{ padding: '12px 14px 8px', borderBottom: '1px solid var(--border-dim)' }}>
      <PanelLabel>INTEL FEED</PanelLabel>
    </div>
    <div style={{ flex: 1, overflowY: 'auto', padding: '4px 8px' }}>
      {INTEL_FEED.map((entry, i) => (
        <div key={i} style={{
          padding: '8px 6px',
          borderBottom: '1px solid var(--border-dim)',
          display: 'flex',
          gap: '8px',
          alignItems: 'flex-start',
        }}>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '9px',
            color: 'var(--text-muted)',
            whiteSpace: 'nowrap',
            marginTop: '2px',
          }}>
            {entry.time}
          </span>
          <div>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '9px',
              color: entry.color,
              letterSpacing: '0.08em',
            }}>
              [{entry.engine}]
            </span>
            <span style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: '11px',
              color: 'var(--text-primary)',
              marginLeft: '6px',
            }}>
              {entry.msg}
            </span>
          </div>
        </div>
      ))}
    </div>

    {/* Workflows */}
    <div style={{ borderTop: '1px solid var(--border-dim)' }}>
      <div style={{ padding: '10px 14px 6px' }}>
        <PanelLabel>WORKFLOWS</PanelLabel>
      </div>
      <div style={{ padding: '0 8px 8px' }}>
        {WORKFLOWS.map((wf) => {
          const Icon = wf.icon;
          return (
            <div key={wf.name} style={{
              padding: '6px 8px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <Icon size={12} color={wf.color} />
              <span style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: '11px',
                color: 'var(--text-primary)',
                flex: 1,
              }}>
                {wf.name}
              </span>
              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '8px',
                color: wf.color,
                letterSpacing: '0.05em',
              }}>
                {wf.status}
              </span>
            </div>
          );
        })}
      </div>
    </div>

    {/* Quick Actions */}
    <div style={{ borderTop: '1px solid var(--border-dim)', padding: '10px 8px' }}>
      <div style={{ padding: '0 6px 8px' }}>
        <PanelLabel>QUICK ACTIONS</PanelLabel>
      </div>
      {[
        { label: 'RUN HUNT', icon: Crosshair, desc: 'Scan for new leads', onClick: onOpenHuntPrompt },
        { label: 'RUN AUDIT', icon: Shield, desc: 'Audit any URL for AEO', onClick: onOpenAuditPrompt },
        { label: 'PING AI', icon: Radio, desc: 'Test AI connection', onClick: () => actions?.pingAI?.() },
        { label: 'REFRESH DATA', icon: RotateCcw, desc: 'Reload live data', onClick: () => actions?.refreshData?.() },
      ].map((action) => {
        const Icon = action.icon;
        return (
          <button
            key={action.label}
            onClick={action.onClick}
            style={{
              width: '100%',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-dim)',
              borderRadius: '2px',
              padding: '8px 10px',
              marginBottom: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'border-color 0.15s, box-shadow 0.15s',
              color: 'var(--text-primary)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-active)';
              e.currentTarget.style.boxShadow = '0 0 12px var(--gold-glow)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-dim)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <Icon size={14} color="var(--gold-primary)" />
            <div style={{ flex: 1, textAlign: 'left' }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '12px', letterSpacing: '0.1em', color: 'var(--gold-primary)' }}>
                {action.label}
              </div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '8px', color: 'var(--text-muted)' }}>
                {action.desc}
              </div>
            </div>
            <ChevronRight size={12} color="var(--text-muted)" />
          </button>
        );
      })}
    </div>
  </div>
);

// --- BOTTOM BAR ---
const BottomBar = ({ commandInput, onCommandChange, onCommandSubmit, alerts, bootPhase, aiResponding }) => (
  <div
    style={{
      gridArea: 'bottom',
      background: 'var(--bg-panel)',
      borderTop: '1px solid var(--border-dim)',
      display: 'flex',
      alignItems: 'center',
      opacity: bootPhase >= 5 ? 1 : 0,
      animation: bootPhase === 5 ? 'bootFadeIn 0.4s ease forwards' : 'none',
    }}
  >
    {/* Command input */}
    <div style={{
      flex: '0 0 60%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      padding: '0 14px',
      borderRight: '1px solid var(--border-dim)',
      gap: '8px',
    }}>
      <Terminal size={14} color="var(--gold-primary)" />
      <span style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '12px',
        color: 'var(--gold-primary)',
      }}>
        OPERATOR &gt;
      </span>
      <input
        type="text"
        value={commandInput}
        onChange={(e) => onCommandChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') onCommandSubmit(); }}
        placeholder={aiResponding ? 'AI processing...' : 'Type a command or ask the AI...'}
        style={{
          flex: 1,
          background: 'transparent',
          border: 'none',
          outline: 'none',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '12px',
          color: 'var(--text-primary)',
          caretColor: 'var(--gold-primary)',
        }}
      />
      {aiResponding && <Loader size={14} color="var(--gold-primary)" style={{ animation: 'spin 1s linear infinite' }} />}
    </div>

    {/* Alert ticker */}
    <div style={{
      flex: '0 0 40%',
      height: '100%',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      padding: '0 14px',
    }}>
      <AlertTriangle size={12} color="var(--red-alert)" style={{ flexShrink: 0, marginRight: '8px' }} />
      <div style={{ overflow: 'hidden', whiteSpace: 'nowrap', flex: 1 }}>
        <div style={{
          display: 'inline-block',
          animation: `tickerScroll ${alerts.length * 6}s linear infinite`,
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '10px',
          color: 'var(--text-muted)',
        }}>
          {alerts.join('  ///  ')}
        </div>
      </div>
    </div>
  </div>
);


// ============================================================
// SECTION 3: CUSTOM HOOKS
// ============================================================

function useClock() {
  const [time, setTime] = useState('');
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

function useBootSequence() {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const phases = [1, 2, 3, 4, 5, 6];
    phases.forEach((p, i) => {
      setTimeout(() => setPhase(p), (i + 1) * 200);
    });
  }, []);
  return phase;
}

function useAIConnection() {
  const [status, setStatus] = useState('offline');
  const [selectedModel, setSelectedModel] = useState(AI_CONFIG.defaultModel);
  const [messages, setMessages] = useState([]);
  const [responding, setResponding] = useState(false);
  const wsRef = useRef(null);

  // Try OpenClaw WebSocket first
  const connectOpenClaw = useCallback(() => {
    try {
      const ws = new WebSocket(AI_CONFIG.openclawUrl);
      ws.onopen = () => {
        setStatus('openclaw');
        wsRef.current = ws;
      };
      ws.onclose = () => {
        wsRef.current = null;
        // Fallback: check Ollama
        checkOllama();
      };
      ws.onerror = () => {
        ws.close();
      };
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.content || data.message) {
            setMessages((prev) => [...prev, { role: 'ai', content: data.content || data.message, time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }) }]);
            setResponding(false);
          }
        } catch {
          // non-JSON message
        }
      };
    } catch {
      checkOllama();
    }
  }, []);

  const checkOllama = useCallback(async () => {
    try {
      const res = await fetch(`${AI_CONFIG.ollamaUrl}/api/tags`);
      if (res.ok) {
        setStatus('ollama');
      } else {
        setStatus('offline');
      }
    } catch {
      setStatus('offline');
    }
  }, []);

  // Send message to AI
  const sendMessage = useCallback(async (content, warRoomState) => {
    setResponding(true);
    setMessages((prev) => [...prev, { role: 'operator', content, time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }) }]);

    const systemPrompt = `You are the AI brain of THE LION'S DEN — a militarized command center for HOO (herrmanonlineoutlook.com). You speak in tactical, concise language. The operator is Matthew Herrman — a construction laborer building a web agency at night. Here is the current dashboard state:\n\n${JSON.stringify(warRoomState, null, 2)}\n\nAnswer based on the dashboard data. Be direct, tactical, actionable.`;

    // Try OpenClaw WebSocket first
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'chat',
        model: selectedModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content },
        ],
      }));
      return;
    }

    // Fallback: Ollama REST
    try {
      const res = await fetch(`${AI_CONFIG.ollamaUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: selectedModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content },
          ],
          stream: false,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const aiContent = data.message?.content || 'No response received.';
        setMessages((prev) => [...prev, {
          role: 'ai',
          content: aiContent,
          time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
        }]);
      } else {
        setMessages((prev) => [...prev, {
          role: 'system',
          content: `AI ERROR: ${res.status} — ${res.statusText}`,
          time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
        }]);
      }
    } catch (err) {
      setMessages((prev) => [...prev, {
        role: 'system',
        content: `CONNECTION FAILED: ${err.message}`,
        time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
      }]);
    }
    setResponding(false);
  }, [selectedModel]);

  // Connect on mount
  useEffect(() => {
    connectOpenClaw();
    // Retry every 30s
    const id = setInterval(() => {
      if (status === 'offline') connectOpenClaw();
    }, 30000);
    return () => clearInterval(id);
  }, [connectOpenClaw, status]);

  return { status, selectedModel, setSelectedModel, messages, setMessages, sendMessage, responding };
}


// ============================================================
// SECTION 4: MAIN WAR ROOM COMPONENT
// ============================================================

// --- DRAFT EMAIL MODAL ---
const DraftModal = ({ draft, onClose, onSend }) => {
  const [body, setBody] = useState(draft?.draft || '');
  const [subject, setSubject] = useState(draft?.subject || '');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(null);

  useEffect(() => {
    setBody(draft?.draft || '');
    setSubject(draft?.subject || '');
    setSent(null);
  }, [draft]);

  if (!draft) return null;

  const handleSend = async (dryRun) => {
    setSending(true);
    const result = await onSend({
      filename: draft.filename,
      to: draft.email,
      subject,
      body,
      dryRun,
    });
    setSent(result);
    setSending(false);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000,
      background: 'rgba(0,0,0,0.85)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '40px',
    }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: 'var(--bg-panel)',
        border: '1px solid var(--gold-primary)',
        borderRadius: '2px',
        width: '100%', maxWidth: '720px',
        maxHeight: '90vh',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 0 40px var(--gold-glow)',
      }}>
        <div style={{
          padding: '12px 16px',
          borderBottom: '1px solid var(--border-dim)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '18px', letterSpacing: '0.15em', color: 'var(--gold-primary)' }}>
              DRAFT OUTREACH — {draft.lead}
            </div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: 'var(--text-muted)' }}>
              TO: {draft.email || '(no email)'}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '18px' }}>✕</button>
        </div>

        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, overflow: 'auto' }}>
          <div>
            <PanelLabel>SUBJECT</PanelLabel>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              style={{
                width: '100%', marginTop: '4px',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-dim)',
                color: 'var(--text-primary)',
                fontFamily: "'Syne', sans-serif", fontSize: '13px',
                padding: '8px 10px', borderRadius: '2px',
                outline: 'none',
              }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <PanelLabel>BODY (edit before sending)</PanelLabel>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              style={{
                marginTop: '4px',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-dim)',
                color: 'var(--text-primary)',
                fontFamily: "'Syne', sans-serif", fontSize: '13px',
                padding: '10px', borderRadius: '2px',
                outline: 'none', resize: 'vertical',
                minHeight: '240px',
                lineHeight: 1.5,
              }}
            />
          </div>

          {sent && (
            <div style={{
              padding: '10px 12px',
              background: sent.dryRun ? 'rgba(200,149,46,0.1)' : 'rgba(0,255,136,0.1)',
              border: `1px solid ${sent.dryRun ? 'var(--gold-primary)' : 'var(--green-online)'}`,
              borderRadius: '2px',
              fontFamily: "'JetBrains Mono', monospace", fontSize: '11px',
              color: sent.dryRun ? 'var(--gold-primary)' : 'var(--green-online)',
            }}>
              {sent.dryRun ? '✓ DRY RUN COMPLETE — nothing sent. Click SEND LIVE to actually send.' : '✓ SENT — outreach logged to vault'}
              {sent.error && <div style={{ color: 'var(--red-alert)', marginTop: '4px' }}>ERROR: {sent.error}</div>}
            </div>
          )}
        </div>

        <div style={{
          padding: '12px 16px',
          borderTop: '1px solid var(--border-dim)',
          display: 'flex', gap: '10px', justifyContent: 'flex-end',
        }}>
          <button onClick={onClose} style={actionBtn('var(--text-muted)')}>
            CANCEL
          </button>
          <button onClick={() => handleSend(true)} disabled={sending} style={actionBtn('var(--gold-primary)', sending)}>
            {sending ? 'PROCESSING...' : 'DRY RUN'}
          </button>
          <button onClick={() => handleSend(false)} disabled={sending} style={actionBtn('var(--red-alert)', sending)}>
            <Send size={11} /> SEND LIVE
          </button>
        </div>
      </div>
    </div>
  );
};

// --- AUDIT RESULT MODAL ---
const AuditModal = ({ result, onClose }) => {
  if (!result) return null;
  const tierColor = result.tier === 'STRONG' ? 'var(--green-online)' : result.tier === 'OK' ? 'var(--gold-primary)' : 'var(--red-alert)';

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000,
      background: 'rgba(0,0,0,0.85)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '40px',
    }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: 'var(--bg-panel)',
        border: `1px solid ${tierColor}`,
        borderRadius: '2px',
        width: '100%', maxWidth: '560px',
        boxShadow: `0 0 40px ${tierColor === 'var(--red-alert)' ? 'var(--red-glow)' : 'var(--gold-glow)'}`,
      }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-dim)', display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '18px', letterSpacing: '0.15em', color: tierColor }}>
            AEO AUDIT RESULT
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '18px' }}>✕</button>
        </div>
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '72px', color: tierColor, lineHeight: 1 }}>
            {result.score}
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', color: tierColor, letterSpacing: '0.2em', marginTop: '4px' }}>
            {result.tier}
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: 'var(--text-muted)', marginTop: '10px', wordBreak: 'break-all' }}>
            {result.url}
          </div>
        </div>
        <div style={{ padding: '0 16px 16px' }}>
          <PanelLabel>FINDINGS ({result.findings?.length || 0})</PanelLabel>
          <div style={{ marginTop: '8px', maxHeight: '240px', overflowY: 'auto' }}>
            {(result.findings || []).map((f, i) => (
              <div key={i} style={{
                padding: '6px 10px',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-dim)',
                borderRadius: '2px',
                marginBottom: '4px',
                fontFamily: "'JetBrains Mono', monospace", fontSize: '10px',
                color: 'var(--red-alert)',
              }}>
                ✕ {f}
              </div>
            ))}
            {result.findings?.length === 0 && (
              <div style={{ color: 'var(--green-online)', fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', textAlign: 'center', padding: '20px' }}>
                ✓ No critical issues detected
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function WarRoom() {
  const [activeEngine, setActiveEngine] = useState('FORGE');
  const [commandInput, setCommandInput] = useState('');
  const [draftModal, setDraftModal] = useState(null);
  const [auditModal, setAuditModal] = useState(null);
  const [toast, setToast] = useState(null);
  const clock = useClock();
  const bootPhase = useBootSequence();
  const ai = useAIConnection();
  const liveData = useLiveData();

  const showToast = useCallback((msg, kind = 'info') => {
    setToast({ msg, kind });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // ========== REAL ACTIONS ==========
  const actions = {
    draftEmail: async (lead) => {
      showToast(`AI drafting email for ${lead.name}...`, 'info');
      try {
        const res = await fetch(`${API_BASE}/api/outreach/draft`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: lead.filename, model: ai.selectedModel }),
        });
        const data = await res.json();
        if (data.success) {
          setDraftModal({ ...data, filename: lead.filename });
        } else {
          showToast(`Draft failed: ${data.error || 'unknown'}`, 'error');
        }
      } catch (err) {
        showToast(`Draft failed: ${err.message}`, 'error');
      }
    },

    sendEmail: async (payload) => {
      try {
        const res = await fetch(`${API_BASE}/api/outreach/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!payload.dryRun && data.success) {
          // Log to lead's outreach history + update stage
          await fetch(`${API_BASE}/api/lead/${payload.filename}/outreach`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ template: 'AI-drafted', response: 'Awaiting' }),
          });
          await fetch(`${API_BASE}/api/lead/${payload.filename}/stage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stage: 'OUTREACH_SENT' }),
          });
          liveData.refresh();
          showToast('Email sent + logged to vault', 'success');
        }
        return data;
      } catch (err) {
        return { error: err.message };
      }
    },

    updateStage: async (lead, stage) => {
      try {
        const res = await fetch(`${API_BASE}/api/lead/${lead.filename}/stage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stage }),
        });
        const data = await res.json();
        if (data.success) {
          showToast(`${lead.name} → ${stage}`, 'success');
          liveData.refresh();
        } else {
          showToast(`Stage update failed: ${data.error}`, 'error');
        }
      } catch (err) {
        showToast(`Stage update failed: ${err.message}`, 'error');
      }
    },

    callLead: (lead) => {
      if (lead.phone && lead.phone !== '—') {
        window.location.href = `tel:${lead.phone.replace(/[^0-9+]/g, '')}`;
        showToast(`Dialing ${lead.phone}...`, 'info');
      }
    },

    auditUrl: async (url) => {
      if (!url || url === '—') {
        showToast('No URL to audit', 'error');
        return;
      }
      showToast(`Auditing ${url}...`, 'info');
      try {
        const res = await fetch(`${API_BASE}/api/audit/run`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
        });
        const data = await res.json();
        setAuditModal(data);
      } catch (err) {
        showToast(`Audit failed: ${err.message}`, 'error');
      }
    },

    runHunt: async (industry, city) => {
      showToast(`Hunting ${industry} in ${city}...`, 'info');
      try {
        const res = await fetch(`${API_BASE}/api/hunt/run`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ industry, city }),
        });
        const data = await res.json();
        if (data.success) {
          showToast(`Hunt complete — refreshing leads`, 'success');
          liveData.refresh();
        } else {
          showToast(`Hunt failed: ${data.error || 'script not configured'}`, 'error');
        }
      } catch (err) {
        showToast(`Hunt failed: ${err.message}`, 'error');
      }
    },

    pingAI: async () => {
      try {
        const res = await fetch(`${AI_CONFIG.ollamaUrl}/api/tags`);
        if (res.ok) {
          const data = await res.json();
          showToast(`✓ Ollama LIVE — ${data.models?.length || 0} models loaded`, 'success');
        } else {
          showToast(`Ollama offline: ${res.status}`, 'error');
        }
      } catch (err) {
        showToast(`Ollama offline: ${err.message}`, 'error');
      }
    },

    refreshData: () => {
      liveData.refresh();
      showToast('Data refreshed from vault', 'success');
    },
  };

  // Prompt helpers for RunHunt / RunAudit quick actions
  const promptRunHunt = () => {
    const industry = window.prompt('Industry? (e.g. lawn care, roofing, auto detailing)');
    if (!industry) return;
    const city = window.prompt('City? (e.g. Independence, Blue Springs, Kansas City)');
    if (!city) return;
    actions.runHunt(industry, city);
  };

  const promptRunAudit = () => {
    const url = window.prompt('URL to audit? (e.g. https://example.com)');
    if (!url) return;
    actions.auditUrl(url);
  };

  // Dynamic quick stats from live data
  const dynamicStats = [
    { label: 'LEADS', value: liveData.leads?.length || 0, icon: Users },
    { label: 'DEMOS', value: liveData.builds?.totalDemos || 0, icon: Layers },
    { label: 'MRR', value: `$${liveData.pipeline?.pipelineStats?.mrr || 0}`, icon: TrendingUp },
    { label: 'SESSIONS', value: liveData.sessions?.length || 0, icon: Target },
  ];

  // Dynamic alerts from live STATE.md blockers
  const dynamicAlerts = liveData.state?.blockers?.length > 0
    ? liveData.state.blockers.map(b => b.toUpperCase())
    : ALERTS;

  // Build full state object for AI context — NOW WITH REAL DATA
  const buildWarRoomState = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/dashboard`);
      if (res.ok) {
        const fullState = await res.json();
        return {
          ...fullState,
          activeEngine,
          aiStatus: ai.status,
          aiModel: ai.selectedModel,
          engines: ENGINES.map((e) => ({ id: e.id, name: e.name, status: e.status, completion: e.completion })),
        };
      }
    } catch {
      // fallback to static
    }
    return {
      operator: 'Matthew Herrman',
      system: 'THE LION\'S DEN V8',
      timestamp: new Date().toISOString(),
      activeEngine,
      engines: ENGINES.map((e) => ({ id: e.id, name: e.name, status: e.status, completion: e.completion })),
      aiStatus: ai.status,
      aiModel: ai.selectedModel,
      leads: liveData.leads,
      builds: liveData.builds,
      pipeline: liveData.pipeline,
      state: liveData.state,
    };
  }, [activeEngine, ai.status, ai.selectedModel, liveData]);

  // Command handler
  const handleCommand = () => {
    const cmd = commandInput.trim();
    if (!cmd) return;
    setCommandInput('');

    // Local commands
    if (cmd.startsWith('/')) {
      const parts = cmd.split(' ');
      const command = parts[0].toLowerCase();
      const arg = parts.slice(1).join(' ').toUpperCase();

      switch (command) {
        case '/help':
          ai.setMessages((prev) => [...prev, {
            role: 'system',
            content: Object.entries(COMMANDS).map(([k, v]) => `${k} — ${v}`).join('\n'),
            time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
          }]);
          return;

        case '/engine':
        case '/engines':
          if (arg && ENGINES.find((e) => e.id === arg)) {
            setActiveEngine(arg);
            ai.setMessages((prev) => [...prev, {
              role: 'system',
              content: `ENGINE SWITCHED → ${arg}`,
              time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
            }]);
          } else {
            ai.setMessages((prev) => [...prev, {
              role: 'system',
              content: `AVAILABLE ENGINES:\n${ENGINES.map((e) => `  ${e.id} — ${e.name} [${e.status}]`).join('\n')}`,
              time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
            }]);
          }
          return;

        case '/model':
          if (arg && AI_CONFIG.models.find((m) => m.toUpperCase() === arg)) {
            const model = AI_CONFIG.models.find((m) => m.toUpperCase() === arg);
            ai.setSelectedModel(model);
            ai.setMessages((prev) => [...prev, {
              role: 'system',
              content: `MODEL SWITCHED → ${model}`,
              time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
            }]);
          } else {
            ai.setMessages((prev) => [...prev, {
              role: 'system',
              content: `AVAILABLE MODELS:\n${AI_CONFIG.models.map((m) => `  ${m}`).join('\n')}\n\nUsage: /model qwen3:8b`,
              time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
            }]);
          }
          return;

        case '/status':
          ai.setMessages((prev) => [...prev, {
            role: 'system',
            content: `SYSTEM STATUS:\nAI: ${ai.status.toUpperCase()}\nMODEL: ${ai.selectedModel}\nENGINES:\n${ENGINES.map((e) => `  ${e.id} [${e.status}] — ${e.completion}% complete`).join('\n')}`,
            time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
          }]);
          return;

        case '/ping':
          ai.setMessages((prev) => [...prev, {
            role: 'system',
            content: `PING → AI STATUS: ${ai.status.toUpperCase()}\nMODEL: ${ai.selectedModel}\nENDPOINT: ${ai.status === 'openclaw' ? AI_CONFIG.openclawUrl : AI_CONFIG.ollamaUrl}`,
            time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
          }]);
          return;

        case '/clear':
          ai.setMessages([]);
          return;

        case '/audit': {
          const url = parts.slice(1).join(' ');
          if (!url) {
            ai.setMessages((prev) => [...prev, {
              role: 'system', content: 'Usage: /audit <url>',
              time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
            }]);
            return;
          }
          actions.auditUrl(url);
          return;
        }

        case '/hunt': {
          const args_ = parts.slice(1);
          if (args_.length < 2) {
            ai.setMessages((prev) => [...prev, {
              role: 'system', content: 'Usage: /hunt <industry> <city>',
              time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
            }]);
            return;
          }
          actions.runHunt(args_[0], args_.slice(1).join(' '));
          return;
        }

        case '/draft': {
          const filename = parts.slice(1).join(' ');
          if (!filename) {
            ai.setMessages((prev) => [...prev, {
              role: 'system', content: 'Usage: /draft <lead-filename.md>',
              time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
            }]);
            return;
          }
          const lead = liveData.leads.find(l => l.filename === filename);
          if (!lead) {
            ai.setMessages((prev) => [...prev, {
              role: 'system', content: `Lead not found: ${filename}\n\nAvailable:\n${liveData.leads.map(l => '  ' + l.filename).join('\n')}`,
              time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
            }]);
            return;
          }
          actions.draftEmail({ filename: lead.filename, name: lead.name });
          return;
        }

        case '/stage': {
          const args_ = parts.slice(1);
          if (args_.length < 2) {
            ai.setMessages((prev) => [...prev, {
              role: 'system', content: 'Usage: /stage <lead-filename> <STAGE>\nStages: DISCOVERED ENRICHED SCORED DEMO_BUILT OUTREACH_SENT RESPONDED CLOSED',
              time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
            }]);
            return;
          }
          actions.updateStage({ filename: args_[0], name: args_[0] }, args_[1].toUpperCase());
          return;
        }

        case '/refresh':
          actions.refreshData();
          return;

        default:
          ai.setMessages((prev) => [...prev, {
            role: 'system',
            content: `UNKNOWN COMMAND: ${command}\nType /help for available commands.`,
            time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
          }]);
          return;
      }
    }

    // Anything else → send to AI with full live state
    buildWarRoomState().then(state => ai.sendMessage(cmd, state));
  };

  const EngineView = ENGINE_VIEWS[activeEngine] || ForgeView;

  return (
    <>
      <ScanlineOverlay />
      <div
        style={{
          width: '100vw',
          height: '100vh',
          display: 'grid',
          gridTemplateAreas: `
            "topbar topbar topbar"
            "left center right"
            "bottom bottom bottom"
          `,
          gridTemplateRows: '40px 1fr 50px',
          gridTemplateColumns: '280px 1fr 300px',
          background: 'var(--bg-void)',
          overflow: 'hidden',
        }}
      >
        <TopBar
          clock={clock}
          aiStatus={ai.status}
          selectedModel={ai.selectedModel}
          bootPhase={bootPhase}
          backendOnline={liveData.backendOnline}
        />

        <LeftSidebar
          engines={ENGINES}
          activeEngine={activeEngine}
          onSelectEngine={setActiveEngine}
          bootPhase={bootPhase}
          quickStats={dynamicStats}
        />

        {/* Center Viewport */}
        <div
          style={{
            gridArea: 'center',
            background: 'var(--bg-void)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            opacity: bootPhase >= 3 ? 1 : 0,
            animation: bootPhase === 3 ? 'bootFadeIn 0.4s ease 0.15s forwards' : 'none',
          }}
        >
          {/* Engine view */}
          <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
            <EngineView liveData={liveData} actions={actions} />
          </div>

          {/* AI Response Panel */}
          {ai.messages.length > 0 && (
            <div style={{
              maxHeight: '200px',
              overflowY: 'auto',
              borderTop: '1px solid var(--border-active)',
              background: 'var(--bg-panel)',
              padding: '8px 14px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <PanelLabel>AI COMMS</PanelLabel>
                <button
                  onClick={() => ai.setMessages([])}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontFamily: "'JetBrains Mono', monospace", fontSize: '9px',
                    color: 'var(--text-muted)',
                  }}
                >
                  CLEAR
                </button>
              </div>
              {ai.messages.map((msg, i) => (
                <div key={i} style={{
                  padding: '4px 0',
                  borderBottom: '1px solid var(--border-dim)',
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'flex-start',
                }}>
                  <span style={{
                    fontFamily: "'JetBrains Mono', monospace", fontSize: '9px',
                    color: 'var(--text-muted)', whiteSpace: 'nowrap', marginTop: '2px',
                  }}>{msg.time}</span>
                  <span style={{
                    fontFamily: "'JetBrains Mono', monospace", fontSize: '9px',
                    color: msg.role === 'operator' ? 'var(--gold-primary)' : msg.role === 'ai' ? 'var(--green-online)' : 'var(--blue-intel)',
                    whiteSpace: 'nowrap',
                  }}>
                    {msg.role === 'operator' ? 'OPERATOR' : msg.role === 'ai' ? 'AI' : 'SYSTEM'}:
                  </span>
                  <span style={{
                    fontFamily: "'JetBrains Mono', monospace", fontSize: '11px',
                    color: 'var(--text-primary)',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}>
                    {msg.content}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <RightSidebar
          bootPhase={bootPhase}
          actions={actions}
          onOpenHuntPrompt={promptRunHunt}
          onOpenAuditPrompt={promptRunAudit}
        />

        <BottomBar
          commandInput={commandInput}
          onCommandChange={setCommandInput}
          onCommandSubmit={handleCommand}
          alerts={dynamicAlerts}
          bootPhase={bootPhase}
          aiResponding={ai.responding}
        />
      </div>

      {/* Draft Email Modal */}
      <DraftModal
        draft={draftModal}
        onClose={() => setDraftModal(null)}
        onSend={actions.sendEmail}
      />

      {/* Audit Result Modal */}
      <AuditModal result={auditModal} onClose={() => setAuditModal(null)} />

      {/* Toast notification */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '70px', right: '320px', zIndex: 9998,
          background: 'var(--bg-panel)',
          border: `1px solid ${toast.kind === 'success' ? 'var(--green-online)' : toast.kind === 'error' ? 'var(--red-alert)' : 'var(--gold-primary)'}`,
          borderRadius: '2px',
          padding: '10px 14px',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '11px',
          color: toast.kind === 'success' ? 'var(--green-online)' : toast.kind === 'error' ? 'var(--red-alert)' : 'var(--gold-primary)',
          boxShadow: `0 0 20px ${toast.kind === 'success' ? 'rgba(0,255,136,0.2)' : toast.kind === 'error' ? 'var(--red-glow)' : 'var(--gold-glow)'}`,
          maxWidth: '400px',
          animation: 'bootFadeIn 0.3s ease',
        }}>
          {toast.msg}
        </div>
      )}

      {/* Inline styles for animations not in CSS */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}

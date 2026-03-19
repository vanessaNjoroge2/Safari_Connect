import { useState } from 'react';
import type { ReactNode } from 'react';
import type { BadgeVariant, SeatClass } from '../types';

// ─── Badge ───────────────────────────────────────────────────────────────────
interface BadgeProps { variant?: BadgeVariant; children: ReactNode; }
export function Badge({ variant = 'gray', children }: BadgeProps) {
  return <span className={`badge badge-${variant}`}>{children}</span>;
}

// ─── AI Banner ───────────────────────────────────────────────────────────────
interface AiBannerProps { text: string; action?: ReactNode; }
export function AiBanner({ text, action }: AiBannerProps) {
  return (
    <div className="ai-banner">
      <span className="ai-chip">AI</span>
      <span className="ai-text" dangerouslySetInnerHTML={{ __html: text }} />
      {action}
    </div>
  );
}

// ─── AI Agent Panel ───────────────────────────────────────────────────────────
interface AiDecisionCard {
  type: string;
  icon: string;
  result: string;
  detail: string;
  confidence: number;
  actionLabel?: string;
  onAction?: () => void;
  accentColor?: string;
}
interface AiAgentPanelProps {
  title: string;
  subtitle?: string;
  cards: AiDecisionCard[];
  cols?: 2 | 3;
}
export function AiAgentPanel({ title, subtitle, cards, cols = 3 }: AiAgentPanelProps) {
  return (
    <div className="ai-agent-section">
      <div className="ai-agent-header">
        <span className="ai-agent-badge">🤖 AI Agent</span>
        <div>
          <div className="ai-agent-title">{title}</div>
          {subtitle && <div className="ai-agent-sub">{subtitle}</div>}
        </div>
      </div>
      <div className={`ai-agent-grid${cols === 2 ? ' ai-agent-grid-2' : ''}`}>
        {cards.map((c) => (
          <div className="ai-decision-card" key={c.type} style={c.accentColor ? { '--accent': c.accentColor } as React.CSSProperties : {}}>
            <div className="ai-decision-type">
              <span>{c.icon}</span> {c.type}
            </div>
            <div className="ai-decision-result">{c.result}</div>
            <div className="ai-decision-detail">{c.detail}</div>
            <div className="ai-decision-confidence">
              <div className="ai-confidence-bar">
                <div className="ai-confidence-fill" style={{ width: `${c.confidence}%`, background: c.accentColor ?? 'var(--brand)' }} />
              </div>
              <span className="ai-confidence-label">{c.confidence}% confidence</span>
            </div>
            {c.actionLabel && (
              <div className="ai-decision-action">
                <button className="btn btn-sm" style={{ fontSize: 12 }} onClick={c.onAction}>{c.actionLabel}</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Stat Tile ────────────────────────────────────────────────────────────────
interface StatTileProps { label: string; value: string | number; sub?: string; neg?: boolean; icon?: string; }
export function StatTile({ label, value, sub, neg, icon }: StatTileProps) {
  return (
    <div className="stat-tile">
      {icon && <div style={{ fontSize: 22, marginBottom: 8 }}>{icon}</div>}
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {sub && <div className={`stat-sub${neg ? ' neg' : ''}`}>{sub}</div>}
    </div>
  );
}

// ─── Steps ────────────────────────────────────────────────────────────────────
interface StepsProps { steps: string[]; current: number; }
export function Steps({ steps, current }: StepsProps) {
  return (
    <div className="steps">
      {steps.map((label, i) => (
        <div key={label} style={{ display: 'contents' }}>
          <div className="step-node">
            <div className={`step-circle${i < current ? ' done' : i === current ? ' active' : ''}`}>
              {i < current ? '✓' : i + 1}
            </div>
            <span className={`step-label${i < current ? ' done' : i === current ? ' active' : ''}`}>{label}</span>
          </div>
          {i < steps.length - 1 && (
            <div className={`step-connector${i < current ? ' done' : ''}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
interface ModalProps { open: boolean; onClose: () => void; title: string; children: ReactNode; width?: number; }
export function Modal({ open, onClose, title, children, width = 520 }: ModalProps) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" style={{ width }} onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <span className="modal-title">{title}</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Seat Map v2 ──────────────────────────────────────────────────────────────
interface SeatDef { type: 'vip' | 'business' | 'available' | 'booked'; }
interface ZoneDef {
  label: string; icon: string; color: string; bg: string; border: string;
  price: string; perks: string;
  rows: Array<[SeatDef, SeatDef, SeatDef, SeatDef]>;
  startRow: number;
}

const ZONES: ZoneDef[] = [
  {
    label: 'VIP Class', icon: '👑', color: '#7c3aed', bg: '#f5f3ff', border: '#c4b5fd',
    price: 'KES 1,800', perks: 'Reclining seat · Snacks · Extra legroom · Row 1',
    startRow: 1,
    rows: [
      [{ type:'vip' }, { type:'vip' }, { type:'vip' }, { type:'vip' }],
    ],
  },
  {
    label: 'Business Class', icon: '💼', color: '#3b82f6', bg: '#eff6ff', border: '#93c5fd',
    price: 'KES 1,200', perks: 'Extra legroom · Priority boarding · Rows 2–3',
    startRow: 2,
    rows: [
      [{ type:'business' }, { type:'business' }, { type:'business' }, { type:'business' }],
      [{ type:'business' }, { type:'business' }, { type:'business' }, { type:'business' }],
    ],
  },
  {
    label: 'Economy Class', icon: '🎫', color: '#0ea371', bg: '#ecfdf5', border: '#86efac',
    price: 'KES 850', perks: 'Standard seating · Comfortable · Rows 4–10',
    startRow: 4,
    rows: [
      [{ type:'available' }, { type:'available' }, { type:'booked'   }, { type:'available' }],
      [{ type:'available' }, { type:'booked'    }, { type:'available' }, { type:'available' }],
      [{ type:'available' }, { type:'available' }, { type:'available' }, { type:'booked'    }],
      [{ type:'available' }, { type:'available' }, { type:'available' }, { type:'available' }],
      [{ type:'available' }, { type:'available' }, { type:'available' }, { type:'available' }],
      [{ type:'booked'    }, { type:'available' }, { type:'available' }, { type:'available' }],
      [{ type:'available' }, { type:'available' }, { type:'available' }, { type:'available' }],
    ],
  },
];
const SEAT_COLS = ['A', 'B', 'C', 'D'] as const;

interface SeatMapProps {
  onSelect?: (label: string, type: SeatClass) => void;
  interactive?: boolean;
  selectedClass?: SeatClass;
}
export function SeatMap({ onSelect, interactive = true, selectedClass }: SeatMapProps) {
  const [selected, setSelected] = useState<string | null>(null);

  const handleClick = (rowNum: number, colIdx: number, type: string) => {
    if (!interactive || type === 'booked') return;
    const label = `${rowNum}${SEAT_COLS[colIdx]}`;
    if (selected === label) { setSelected(null); return; }
    setSelected(label);
    const sc: SeatClass = type === 'vip' ? 'vip' : type === 'business' ? 'business' : 'economy';
    onSelect?.(label, sc);
  };

  const getCls = (rowNum: number, colIdx: number, type: string) => {
    const label = `${rowNum}${SEAT_COLS[colIdx]}`;
    if (selected === label) return 'selected';
    // dim seats outside selected class when class is chosen
    if (selectedClass) {
      const zoneType = type === 'vip' ? 'vip' : type === 'business' ? 'business' : type === 'booked' ? 'booked' : 'economy';
      if (zoneType !== 'booked' && zoneType !== selectedClass) return `${type} dimmed`;
    }
    return type;
  };

  return (
    <div className="seatmap-v2">
      {/* Driver cabin */}
      <div className="seatmap-cabin">
        <span style={{ fontSize: 20 }}>🚌</span>
        <div>
          <div className="seatmap-cabin-text">Driver · Front of vehicle</div>
        </div>
      </div>

      {/* Column headers */}
      <div className="seatmap-col-headers">
        <div />
        <div className="seatmap-col-hdr">A</div>
        <div className="seatmap-col-hdr">B</div>
        <div className="seatmap-aisle-col"><span style={{ fontSize: 9, color: 'var(--gray-300)', letterSpacing: '.05em', textTransform: 'uppercase' }}>aisle</span></div>
        <div className="seatmap-col-hdr">C</div>
        <div className="seatmap-col-hdr">D</div>
      </div>

      {/* Zones with dividers */}
      {ZONES.map(zone => (
        <div key={zone.label}>
          {/* Zone banner */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: zone.bg,
            border: `1px solid ${zone.border}`,
            borderRadius: 8, padding: '7px 10px',
            margin: '10px 0 6px',
          }}>
            <span style={{ fontSize: 14 }}>{zone.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: zone.color, letterSpacing: '.04em' }}>{zone.label}</div>
              <div style={{ fontSize: 10, color: 'var(--gray-400)', marginTop: 1 }}>{zone.perks}</div>
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: zone.color, whiteSpace: 'nowrap' }}>{zone.price}</div>
          </div>

          {/* Rows in this zone */}
          {zone.rows.map((row, rowOffset) => {
            const rowNum = zone.startRow + rowOffset;
            return (
              <div className="seatmap-row" key={rowNum}>
                <div className="seatmap-row-num">{rowNum}</div>
                {[0, 1].map(ci => (
                  <div
                    key={ci}
                    className={`seat-v2 ${getCls(rowNum, ci, row[ci].type)}`}
                    onClick={() => handleClick(rowNum, ci, row[ci].type)}
                    title={row[ci].type === 'booked' ? 'Booked' : `Seat ${rowNum}${SEAT_COLS[ci]}`}
                    style={{ opacity: row[ci].type !== 'booked' && selectedClass && (row[ci].type !== selectedClass && !(row[ci].type === 'available' && selectedClass === 'economy')) ? 0.35 : 1 }}
                  >
                    {rowNum}{SEAT_COLS[ci]}
                  </div>
                ))}
                <div className="seatmap-aisle-col"><div className="seatmap-aisle-dot" /></div>
                {[2, 3].map(ci => (
                  <div
                    key={ci}
                    className={`seat-v2 ${getCls(rowNum, ci, row[ci].type)}`}
                    onClick={() => handleClick(rowNum, ci, row[ci].type)}
                    title={row[ci].type === 'booked' ? 'Booked' : `Seat ${rowNum}${SEAT_COLS[ci]}`}
                    style={{ opacity: row[ci].type !== 'booked' && selectedClass && (row[ci].type !== selectedClass && !(row[ci].type === 'available' && selectedClass === 'economy')) ? 0.35 : 1 }}
                  >
                    {rowNum}{SEAT_COLS[ci]}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      ))}

      {/* Rear */}
      <div className="seatmap-back">🚪 Rear door / Exit</div>

      {/* Legend */}
      <div className="seat-legend" style={{ marginTop: 16 }}>
        {([
          ['#f5f3ff', '#c4b5fd', 'VIP'],
          ['#dbeafe', '#93c5fd', 'Business'],
          ['#dcfce7', '#86efac', 'Available'],
          ['#fee2e2', '#fca5a5', 'Booked'],
          ['var(--brand)', 'var(--brand-dark)', 'Your pick'],
        ] as [string, string, string][]).map(([bg, bc, lbl]) => (
          <div className="legend-item" key={lbl}>
            <div className="legend-swatch" style={{ background: bg, borderColor: bc }} />
            {lbl}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Chart Bar ────────────────────────────────────────────────────────────────
interface ChartBarProps { label: string; pct: number; display?: string; val?: string; color?: string; }
export function ChartBar({ label, pct, display, val, color }: ChartBarProps) {
  return (
    <div className="chart-row">
      <div className="chart-lbl">{label}</div>
      <div className="chart-track">
        <div className="chart-fill" style={{ width: `${pct}%`, background: color ?? 'var(--brand)' }}>
          {display}
        </div>
      </div>
      {val !== undefined && <div className="chart-val">{val}</div>}
    </div>
  );
}

// ─── Pie Chart ────────────────────────────────────────────────────────────────
interface PieSegment { color: string; pct: number; offset: number; label: string; }
interface PieChartProps { segments: PieSegment[]; }
export function PieChart({ segments }: PieChartProps) {
  return (
    <div className="pie-wrap">
      <svg width="120" height="120" viewBox="0 0 36 36">
        <circle r="15.9" cx="18" cy="18" fill="none" stroke="var(--gray-200)" strokeWidth="4" />
        {segments.map((s, i) => (
          <circle key={i} r="15.9" cx="18" cy="18" fill="none" stroke={s.color}
            strokeWidth="4" strokeDasharray={`${s.pct} ${100 - s.pct}`} strokeDashoffset={s.offset} />
        ))}
      </svg>
      <div className="pie-legend">
        {segments.map(s => (
          <div className="pie-legend-row" key={s.label}>
            <div className="pie-dot" style={{ background: s.color }} />
            {s.label}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Map placeholder ──────────────────────────────────────────────────────────
interface MapEmbedProps { height?: number; label?: string; }
export function MapEmbed({ height = 380, label = 'Interactive map loads here' }: MapEmbedProps) {
  return (
    <div className="map-embed" style={{ height }}>
      <span style={{ fontSize: 40 }}>🗺️</span>
      <span style={{ fontWeight: 600, fontSize: 14 }}>{label}</span>
      <span style={{ fontSize: 12 }}>Leaflet + OpenStreetMap · No API key needed</span>
    </div>
  );
}

// ─── Page header ─────────────────────────────────────────────────────────────
interface PageHeaderProps { title: string; subtitle?: string; actions?: ReactNode; }
export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="dash-topbar">
      <div>
        <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--gray-900)' }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>{subtitle}</div>}
      </div>
      {actions && <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>{actions}</div>}
    </div>
  );
}

// ─── Floating AI Chat ─────────────────────────────────────────────────────────
interface ChatMsg { from: 'user' | 'ai'; text: string; time: string; }

const QUICK_REPLIES = [
  'Find cheapest route to Mombasa',
  'When is the next bus to Nakuru?',
  'Track my booking SC-2026-00892',
  'What is my trust score?',
];

const AI_RESPONSES: Record<string, string> = {
  default: "I'm your SafiriConnect AI assistant. I can help you find trips, check fares, track bookings, and answer any transport questions. How can I help?",
  mombasa: "🚌 **Nairobi → Mombasa** — Next departures:\n• 06:00 AM · Easy Coach · KES 1,500 · 14 seats left\n• 08:00 AM · Modern Coast · KES 1,800 (VIP) · 6 seats\n\n**AI Insight:** Fares are expected to rise 12% by Thursday. Book now for best price.",
  nakuru: "🚌 **Nairobi → Nakuru** — Next bus departs in **42 minutes** (14 seats left). \nFare: KES 850. Estimated journey: 2h 10min.\n\nShall I reserve a seat for you?",
  track: "📋 **Booking SC-2026-00892**\n• Route: Nairobi → Nakuru\n• Date: 18 Mar 2026 · Seat 14B\n• Status: **Upcoming** ✅\n• Departure: 8:00 AM from Westlands Terminus",
  trust: "🛡️ **Your AI Trust Score: 94/100 — Excellent**\n\nBased on: 12 completed trips, zero cancellations, verified ID, positive driver ratings.\n\nTop 6% of all SafiriConnect passengers.",
};

function getAiReply(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes('mombasa') || m.includes('cheapest')) return AI_RESPONSES.mombasa;
  if (m.includes('nakuru') || m.includes('next bus')) return AI_RESPONSES.nakuru;
  if (m.includes('track') || m.includes('booking') || m.includes('sc-')) return AI_RESPONSES.track;
  if (m.includes('trust') || m.includes('score')) return AI_RESPONSES.trust;
  return AI_RESPONSES.default;
}

function now() {
  return new Date().toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' });
}

export function FloatingChat({ role = 'passenger' }: { role?: 'passenger' | 'admin' }) {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<ChatMsg[]>([
    { from: 'ai', text: role === 'admin'
        ? "Hello Admin. I'm your SafiriConnect AI Platform Guardian. Ask me about fraud alerts, booking anomalies, revenue trends, or platform health."
        : "Hi there! 👋 I'm your SafiriConnect AI travel assistant. Ask me anything — trips, fares, bookings, or your trust score.",
      time: now() },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const bottomRef = useState<HTMLDivElement | null>(null);

  const send = (text: string) => {
    if (!text.trim()) return;
    const userMsg: ChatMsg = { from: 'user', text: text.trim(), time: now() };
    setMsgs(m => [...m, userMsg]);
    setInput('');
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMsgs(m => [...m, { from: 'ai', text: getAiReply(text), time: now() }]);
    }, 900);
  };

  return (
    <>
      {/* Floating button */}
      <button
        className={`float-chat-btn${open ? ' open' : ''}`}
        onClick={() => setOpen(o => !o)}
        title="AI Assistant"
        aria-label="Open AI chat assistant"
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        ) : (
          <>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <span className="float-chat-badge">AI</span>
          </>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="float-chat-panel slide-up">
          {/* Header */}
          <div className="float-chat-header">
            <div className="float-chat-avatar">🤖</div>
            <div>
              <div className="float-chat-name">
                {role === 'admin' ? 'AI Platform Guardian' : 'SafiriConnect AI'}
              </div>
              <div className="float-chat-status">
                <span className="float-chat-dot" /> Online · powered by AI agent
              </div>
            </div>
            <button className="float-chat-close" onClick={() => setOpen(false)}>✕</button>
          </div>

          {/* Messages */}
          <div className="float-chat-msgs">
            {msgs.map((m, i) => (
              <div key={i} className={`float-msg float-msg-${m.from}`}>
                {m.from === 'ai' && <div className="float-msg-icon">🤖</div>}
                <div className="float-msg-bubble">
                  <div style={{ whiteSpace: 'pre-line' }}>{m.text}</div>
                  <div className="float-msg-time">{m.time}</div>
                </div>
              </div>
            ))}
            {typing && (
              <div className="float-msg float-msg-ai">
                <div className="float-msg-icon">🤖</div>
                <div className="float-msg-bubble float-typing">
                  <span /><span /><span />
                </div>
              </div>
            )}
            <div ref={bottomRef[1]} />
          </div>

          {/* Quick replies */}
          {msgs.length <= 2 && (
            <div className="float-quick-replies">
              {QUICK_REPLIES.map(q => (
                <button key={q} className="float-quick-btn" onClick={() => send(q)}>{q}</button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="float-chat-input-row">
            <input
              className="float-chat-input"
              placeholder="Ask anything…"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send(input)}
            />
            <button className="float-chat-send" onClick={() => send(input)} disabled={!input.trim()}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}

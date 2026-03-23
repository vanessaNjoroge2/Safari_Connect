import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import type { BadgeVariant, SeatClass } from '../types';

type ChatRole = 'passenger' | 'admin' | 'owner';
type ChatLang = 'en' | 'sw';
type AutopilotMode = 'suggest-only' | 'human-approve' | 'auto-apply';

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
  evidence?: string[];
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
  const [mode, setMode] = useState<AutopilotMode>('human-approve');
  const [timeline, setTimeline] = useState<Array<{ id: string; note: string; time: string; state: 'applied' | 'rolled-back' | 'suggested' }>>([]);

  const stamp = () =>
    new Date().toLocaleTimeString('en-KE', {
      hour: '2-digit',
      minute: '2-digit',
    });

  const pushTimeline = (note: string, state: 'applied' | 'rolled-back' | 'suggested') => {
    setTimeline((prev) => [
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        note,
        state,
        time: stamp(),
      },
      ...prev,
    ].slice(0, 6));
  };

  const runCardAction = (card: AiDecisionCard) => {
    if (mode === 'suggest-only') {
      pushTimeline(`${card.type}: suggestion queued`, 'suggested');
      return;
    }

    card.onAction?.();

    if (mode === 'auto-apply') {
      pushTimeline(`${card.type}: auto-applied`, 'applied');
      return;
    }

    pushTimeline(`${card.type}: applied after approval`, 'applied');
  };

  const rollbackCardAction = (card: AiDecisionCard) => {
    pushTimeline(`${card.type}: action rolled back`, 'rolled-back');
  };

  return (
    <div className="ai-agent-section">
      <div className="ai-agent-header">
        <span className="ai-agent-badge">🤖 AI Agent</span>
        <div>
          <div className="ai-agent-title">{title}</div>
          {subtitle && <div className="ai-agent-sub">{subtitle}</div>}
        </div>
        <div className="ai-agent-toolbar">
          <label className="ai-mode-label" htmlFor="ai-autopilot-mode">Autopilot</label>
          <select
            id="ai-autopilot-mode"
            className="ai-mode-select"
            value={mode}
            onChange={(e) => setMode(e.target.value as AutopilotMode)}
          >
            <option value="suggest-only">Suggest only</option>
            <option value="human-approve">Human approve</option>
            <option value="auto-apply">Auto apply</option>
          </select>
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
            <div className="ai-provenance">
              <span>Model: Safiri AI</span>
              <span>Mode: {mode.replace('-', ' ')}</span>
              <span>Updated: {stamp()}</span>
            </div>
            {c.evidence && c.evidence.length > 0 && (
              <ul className="ai-evidence-list">
                {c.evidence.slice(0, 3).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
            {c.actionLabel && (
              <div className="ai-decision-actions">
                <button className="btn btn-sm" style={{ fontSize: 12 }} onClick={() => runCardAction(c)}>{c.actionLabel}</button>
                <button className="btn btn-ghost btn-sm" style={{ fontSize: 12 }} onClick={() => rollbackCardAction(c)}>Rollback</button>
              </div>
            )}
          </div>
        ))}
      </div>
      {timeline.length > 0 && (
        <div className="ai-timeline">
          <div className="ai-timeline-title">Decision Timeline</div>
          {timeline.map((event) => (
            <div className="ai-timeline-item" key={event.id}>
              <span className={`ai-timeline-state ${event.state}`}>{event.state}</span>
              <span className="ai-timeline-note">{event.note}</span>
              <span className="ai-timeline-time">{event.time}</span>
            </div>
          ))}
        </div>
      )}
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

// ─── Map embed (OpenStreetMap) ───────────────────────────────────────────────
interface MapEmbedProps {
  height?: number;
  label?: string;
  pickup?: string;
  dropoff?: string;
  livePosition?: {
    lat: number;
    lon: number;
    accuracy?: number | null;
    updatedAt?: number;
    source?: 'gps' | 'simulated';
  } | null;
}

const LOCATION_COORDS: Record<string, { lat: number; lon: number; label: string }> = {
  nairobi: { lat: -1.286389, lon: 36.817223, label: 'Nairobi CBD' },
  karen: { lat: -1.319, lon: 36.707, label: 'Karen' },
  'upper hill': { lat: -1.298, lon: 36.812, label: 'Upper Hill' },
  westlands: { lat: -1.267, lon: 36.81, label: 'Westlands' },
  kilimani: { lat: -1.2921, lon: 36.7836, label: 'Kilimani' },
  nakuru: { lat: -0.3031, lon: 36.08, label: 'Nakuru' },
  mombasa: { lat: -4.0435, lon: 39.6682, label: 'Mombasa' },
  kisumu: { lat: -0.1022, lon: 34.7617, label: 'Kisumu' },
  eldoret: { lat: 0.5143, lon: 35.2698, label: 'Eldoret' },
  thika: { lat: -1.0332, lon: 37.0692, label: 'Thika' },
  'ngong road': { lat: -1.3018, lon: 36.7849, label: 'Ngong Road' },
};

function resolveLocation(text?: string | null) {
  if (!text) return null;
  const lower = text.toLowerCase();
  for (const [key, value] of Object.entries(LOCATION_COORDS)) {
    if (lower.includes(key)) return value;
  }
  return null;
}

function inferRouteFromLabel(label?: string) {
  if (!label) return { pickup: null as ReturnType<typeof resolveLocation>, dropoff: null as ReturnType<typeof resolveLocation> };
  const cleaned = label.split('·')[0];
  const parts = cleaned.split('→').map((p) => p.trim());
  if (parts.length !== 2) return { pickup: null as ReturnType<typeof resolveLocation>, dropoff: null as ReturnType<typeof resolveLocation> };
  return {
    pickup: resolveLocation(parts[0]),
    dropoff: resolveLocation(parts[1]),
  };
}

export function MapEmbed({
  height = 380,
  label = 'Interactive map preview',
  pickup,
  dropoff,
  livePosition,
}: MapEmbedProps) {
  const inferred = inferRouteFromLabel(label);
  const pickupPoint = resolveLocation(pickup) || inferred.pickup;
  const dropoffPoint = resolveLocation(dropoff) || inferred.dropoff;

  const fallbackCenter = pickupPoint && dropoffPoint
    ? {
        lat: (pickupPoint.lat + dropoffPoint.lat) / 2,
        lon: (pickupPoint.lon + dropoffPoint.lon) / 2,
      }
    : pickupPoint || dropoffPoint || LOCATION_COORDS.nairobi;

  const center = livePosition
    ? { lat: livePosition.lat, lon: livePosition.lon }
    : fallbackCenter;

  const latSpan = pickupPoint && dropoffPoint ? Math.max(0.03, Math.abs(pickupPoint.lat - dropoffPoint.lat) + 0.04) : 0.08;
  const lonSpan = pickupPoint && dropoffPoint ? Math.max(0.03, Math.abs(pickupPoint.lon - dropoffPoint.lon) + 0.05) : 0.1;

  const minLon = center.lon - lonSpan;
  const minLat = center.lat - latSpan;
  const maxLon = center.lon + lonSpan;
  const maxLat = center.lat + latSpan;

  const embedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${minLon}%2C${minLat}%2C${maxLon}%2C${maxLat}&layer=mapnik&marker=${center.lat}%2C${center.lon}`;
  const openUrl = `https://www.openstreetmap.org/?mlat=${center.lat}&mlon=${center.lon}#map=12/${center.lat}/${center.lon}`;
  const sourceLabel = livePosition?.source === 'gps' ? 'GPS' : livePosition?.source === 'simulated' ? 'Simulated' : null;

  return (
    <div className="map-embed" style={{ height }}>
      <iframe
        className="map-embed-frame"
        title="SafiriConnect map"
        src={embedUrl}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
      <div className="map-embed-overlay">
        <div className="map-embed-chip">Live map · OpenStreetMap</div>
        {livePosition && (
          <div className="map-embed-points" style={{ marginTop: 8 }}>
            <span className="map-embed-point pickup">
              Tracker: {sourceLabel || 'Live'} · {livePosition.lat.toFixed(5)}, {livePosition.lon.toFixed(5)}
            </span>
            {typeof livePosition.accuracy === 'number' && (
              <span className="map-embed-point dropoff">Accuracy: {Math.round(livePosition.accuracy)}m</span>
            )}
          </div>
        )}
        {(pickupPoint || dropoffPoint) && (
          <div className="map-embed-points">
            {pickupPoint && <span className="map-embed-point pickup">Pickup: {pickupPoint.label}</span>}
            {dropoffPoint && <span className="map-embed-point dropoff">Drop-off: {dropoffPoint.label}</span>}
          </div>
        )}
      </div>
      <a className="map-embed-link" href={openUrl} target="_blank" rel="noreferrer">
        Open full map ↗
      </a>
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
interface ChatAction {
  type?: string;
  params?: {
    category?: string;
    from?: string;
    to?: string;
    date?: string;
    time?: string;
    maxFare?: number;
    auto?: number;
  };
}

const QUICK_REPLIES = [
  'Find cheapest route to Mombasa',
  'When is the next bus to Nakuru?',
  'Track my booking SC-2026-00892',
  'What is my trust score?',
];

const QUICK_REPLIES_SW = [
  'Nionyeshe safari ya bei nafuu Mombasa',
  'Basi ijayo ya Nakuru ni saa ngapi?',
  'Fuatilia booking SC-2026-00892',
  'Trust score yangu ni ngapi?',
];

const AI_RESPONSES: Record<string, string> = {
  default: 'Live AI response is unavailable at the moment. Please retry shortly.',
  mombasa: 'Live AI response is unavailable at the moment. Please retry shortly.',
  nakuru: 'Live AI response is unavailable at the moment. Please retry shortly.',
  track: 'Live AI response is unavailable at the moment. Please retry shortly.',
  trust: 'Live AI response is unavailable at the moment. Please retry shortly.',
};

const AI_RESPONSES_SW: Record<string, string> = {
  default: 'Huduma ya AI ya moja kwa moja haipatikani kwa sasa. Jaribu tena baada ya muda mfupi.',
  mombasa: 'Huduma ya AI ya moja kwa moja haipatikani kwa sasa. Jaribu tena baada ya muda mfupi.',
  nakuru: 'Huduma ya AI ya moja kwa moja haipatikani kwa sasa. Jaribu tena baada ya muda mfupi.',
  track: 'Huduma ya AI ya moja kwa moja haipatikani kwa sasa. Jaribu tena baada ya muda mfupi.',
  trust: 'Huduma ya AI ya moja kwa moja haipatikani kwa sasa. Jaribu tena baada ya muda mfupi.',
};

function getAiReply(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes('mombasa') || m.includes('cheapest')) return AI_RESPONSES.mombasa;
  if (m.includes('nakuru') || m.includes('next bus')) return AI_RESPONSES.nakuru;
  if (m.includes('track') || m.includes('booking') || m.includes('sc-')) return AI_RESPONSES.track;
  if (m.includes('trust') || m.includes('score')) return AI_RESPONSES.trust;
  return AI_RESPONSES.default;
}

function getAiReplyByLang(msg: string, lang: ChatLang): string {
  if (lang === 'en') return getAiReply(msg);

  const m = msg.toLowerCase();
  if (m.includes('mombasa') || m.includes('bei')) return AI_RESPONSES_SW.mombasa;
  if (m.includes('nakuru') || m.includes('ijayo')) return AI_RESPONSES_SW.nakuru;
  if (m.includes('fuatilia') || m.includes('booking') || m.includes('sc-')) return AI_RESPONSES_SW.track;
  if (m.includes('trust') || m.includes('score')) return AI_RESPONSES_SW.trust;
  return AI_RESPONSES_SW.default;
}

const RAW_API_BASE =
  (import.meta.env.VITE_BACKEND_BASE_URL as string | undefined) ||
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ||
  'http://localhost:3215';

function normalizeApiBase(url: string) {
  let base = url.trim().replace(/\/$/, '');
  if (base.endsWith('/api')) {
    base = base.slice(0, -4);
  }
  return base;
}

const API_BASE = normalizeApiBase(RAW_API_BASE);

async function fetchAiReply(text: string, lang: ChatLang, role: ChatRole, sessionId: string) {
  try {
    const token = localStorage.getItem('safiri_auth_token') || '';
    const response = await fetch(`${API_BASE}/api/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        text,
        language: lang,
        role,
        sessionId,
      }),
    });

    if (!response.ok) throw new Error('AI chat request failed');
    const data = await response.json();

    const reply =
      data?.data?.message ||
      data?.data?.reply ||
      data?.message ||
      data?.reply ||
      data?.data?.summary?.passengerMessage ||
      '';

    const resolved = String(reply);
    const action = (data?.data?.action || data?.action || null) as ChatAction | null;
    return {
      reply: resolved,
      fromBackend: Boolean(resolved),
      action,
    };
  } catch {
    return {
      reply: '',
      fromBackend: false,
      action: null,
    };
  }
}

async function fetchVoiceAudio(text: string, lang: ChatLang) {
  try {
    const response = await fetch(`${API_BASE}/api/ai/voice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript: text, language: lang }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const payload = data?.data || data;
    const audioBase64 = payload?.audioBase64 || payload?.audio;
    const audioMimeType = payload?.audioMimeType || 'audio/mpeg';

    if (!audioBase64) return null;
    return {
      audioBase64: String(audioBase64),
      audioMimeType: String(audioMimeType),
    };
  } catch {
    return null;
  }
}

function normalizeSpeechText(text: string) {
  return text
    .replace(/\*\*/g, '')
    .replace(/[`#>*_~]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function now() {
  return new Date().toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' });
}

export function FloatingChat({ role = 'passenger' }: { role?: ChatRole }) {
  const navigate = useNavigate();
  const storageKey = `safiri_chat_session_id_${role}`;
  const chatSessionIdRef = useRef<string>('');

  if (!chatSessionIdRef.current) {
    const existing = localStorage.getItem(storageKey);
    chatSessionIdRef.current =
      existing || `${role}:${Date.now()}:${Math.random().toString(36).slice(2, 10)}`;

    if (!existing) {
      localStorage.setItem(storageKey, chatSessionIdRef.current);
    }
  }
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState<ChatLang>('en');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [autoVoiceOnMic, setAutoVoiceOnMic] = useState(true);
  const [listening, setListening] = useState(false);
  const [unread, setUnread] = useState(0);
  const [msgs, setMsgs] = useState<ChatMsg[]>([
    {
      from: 'ai',
      text:
        role === 'admin'
          ? "Hello Admin. I'm your SafiriConnect AI Platform Guardian. Ask me about fraud alerts, booking anomalies, revenue trends, or platform health."
          : "Hi there! 👋 I'm your SafiriConnect AI travel assistant. Ask me anything — trips, fares, bookings, or your trust score.",
      time: now(),
    },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [aiBackendOnline, setAiBackendOnline] = useState(true);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const lastAiIndexRef = useRef(0);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const voicePrimedRef = useRef(false);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (open) {
      setUnread(0);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs, typing, open]);

  useEffect(() => {
    const lastAiIdx = msgs
      .map((m, idx) => ({ m, idx }))
      .reverse()
      .find((item) => item.m.from === 'ai')?.idx ?? -1;

    if (lastAiIdx > lastAiIndexRef.current && !open) {
      setUnread((prev) => Math.min(prev + 1, 9));
    }

    lastAiIndexRef.current = lastAiIdx;
  }, [msgs, open]);

  const primeVoice = () => {
    if (voicePrimedRef.current) return;

    try {
      // Prime browser speech engines on a direct user gesture to avoid autoplay blocks.
      if ('speechSynthesis' in window) {
        const primer = new SpeechSynthesisUtterance(' ');
        primer.volume = 0;
        window.speechSynthesis.speak(primer);
        window.speechSynthesis.cancel();
      }

      const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (AC) {
        const ctx = new AC();
        if (ctx.state === 'suspended') {
          void ctx.resume();
        }
      }

      voicePrimedRef.current = true;
    } catch {
      // Keep chat functional even if priming fails.
    }
  };

  const interruptAssistantSpeech = () => {
    if (activeAudioRef.current) {
      try {
        activeAudioRef.current.pause();
        activeAudioRef.current.currentTime = 0;
      } catch {
        // keep chat responsive
      }
      activeAudioRef.current = null;
    }

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    activeUtteranceRef.current = null;
    setAiSpeaking(false);
  };

  const speakWithPreferredVoice = (text: string) => {
    if (!('speechSynthesis' in window)) return Promise.resolve();

    const clean = normalizeSpeechText(text);
    if (!clean) return;

    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = lang === 'sw' ? 'sw-KE' : 'en-KE';
    utterance.rate = 1;
    utterance.pitch = 1;

    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find((v) =>
      lang === 'sw' ? v.lang.toLowerCase().startsWith('sw') : v.lang.toLowerCase().startsWith('en')
    );

    if (preferred) {
      utterance.voice = preferred;
    }

    return new Promise<void>((resolve) => {
      utterance.onstart = () => setAiSpeaking(true);
      utterance.onend = () => {
        activeUtteranceRef.current = null;
        setAiSpeaking(false);
        resolve();
      };
      utterance.onerror = () => {
        activeUtteranceRef.current = null;
        setAiSpeaking(false);
        resolve();
      };

      activeUtteranceRef.current = utterance;
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume();
      window.speechSynthesis.speak(utterance);
    });
  };

  const speakReply = async (replyText: string) => {
    if (!voiceEnabled) return;

    interruptAssistantSpeech();

    const premium = await fetchVoiceAudio(replyText, lang);
    if (premium) {
      try {
        const src = `data:${premium.audioMimeType};base64,${premium.audioBase64}`;
        const audio = new Audio(src);
        activeAudioRef.current = audio;

        await new Promise<void>((resolve) => {
          audio.onended = () => {
            if (activeAudioRef.current === audio) activeAudioRef.current = null;
            setAiSpeaking(false);
            resolve();
          };
          audio.onerror = () => {
            if (activeAudioRef.current === audio) activeAudioRef.current = null;
            setAiSpeaking(false);
            resolve();
          };

          setAiSpeaking(true);
          void audio.play().catch(() => {
            if (activeAudioRef.current === audio) activeAudioRef.current = null;
            setAiSpeaking(false);
            resolve();
          });
        });
        return;
      } catch {
        // Fall through to browser TTS
      }
    }

    await speakWithPreferredVoice(replyText);
  };

  const startListening = () => {
    const Recognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!Recognition) return;

    interruptAssistantSpeech();

    const rec = new Recognition();
    rec.lang = lang === 'sw' ? 'sw-KE' : 'en-KE';
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    setListening(true);
    rec.onresult = (event: any) => {
      const transcript = event?.results?.[0]?.[0]?.transcript || '';
      if (transcript) {
        const spoken = String(transcript).trim();
        if (!spoken) return;
        setInput(spoken);
        void send(spoken, { fromVoice: true });
      }
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    rec.start();
  };

  const send = async (text: string, options?: { fromVoice?: boolean }) => {
    if (!text.trim()) return;
    interruptAssistantSpeech();
    primeVoice();

    const raw = text.trim();
    const userMsg: ChatMsg = { from: 'user', text: raw, time: now() };
    setMsgs((m) => [...m, userMsg]);
    setInput('');
    setTyping(true);

    const backendReply = await fetchAiReply(raw, lang, role, chatSessionIdRef.current);
    const reply = backendReply.reply || getAiReplyByLang(raw, lang);
    setAiBackendOnline(backendReply.fromBackend);
    const shouldAutoSpeak = voiceEnabled && (!autoVoiceOnMic || !!options?.fromVoice);

    const executeChatAction = () => {
      if (role !== 'passenger') return false;

      const action = backendReply.action;
      if (!action || action.type !== 'prefill_search_form') return false;

      const p = action.params || {};
      if (!p.from || !p.to || !p.date) return false;

      const search = new URLSearchParams();
      search.set('cat', p.category || 'bus');
      search.set('from', p.from);
      search.set('to', p.to);
      search.set('date', p.date);
      if (p.time) search.set('time', p.time);
      if (typeof p.maxFare === 'number' && Number.isFinite(p.maxFare)) {
        search.set('maxFare', String(Math.max(1, Math.round(p.maxFare))));
      }
      if (p.auto === 1) {
        search.set('auto', '1');
      }

      navigate(`/passenger/search?${search.toString()}`);
      return true;
    };

    setTimeout(() => {
      setTyping(false);
      const didExecuteAction = executeChatAction();
      setMsgs((m) => [
        ...m,
        { from: 'ai', text: reply, time: now() },
        ...(didExecuteAction
          ? [{ from: 'ai', text: 'I prefilled your booking form from your account travel context. Review and continue.', time: now() } as ChatMsg]
          : []),
      ]);
      if (shouldAutoSpeak) {
        void speakReply(reply);
      }
    }, 700);
  };

  return (
    <>
      {/* Floating button */}
      <button
        className={`float-chat-btn${open ? ' open' : ''}`}
        onClick={() => {
          primeVoice();
          setOpen((o) => !o);
        }}
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
            {unread > 0 ? (
              <span className="float-chat-unread">{unread}</span>
            ) : (
              <span className="float-chat-badge">AI</span>
            )}
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
                <span className="float-chat-dot" />
                {aiBackendOnline ? 'Online · live AI agent' : 'Fallback mode · local guidance'}
              </div>
            </div>
            <button className="float-chat-close" onClick={() => setOpen(false)}>✕</button>
          </div>

          <div className="float-chat-controls">
            <div className="float-chat-control-block">
              <span className="float-chat-control-label">Language</span>
              <div className="float-chat-lang">
                <button className={lang === 'en' ? 'active' : ''} onClick={() => setLang('en')}>EN</button>
                <button className={lang === 'sw' ? 'active' : ''} onClick={() => setLang('sw')}>SW</button>
              </div>
            </div>
            <div className="float-chat-control-block">
              <span className="float-chat-control-label">Voice</span>
              <button className={`float-chat-tool-btn compact${voiceEnabled ? ' active' : ''}`} onClick={() => setVoiceEnabled((v) => !v)} title="Toggle voice replies">
                {voiceEnabled ? '🔊 On' : '🔇 Off'}
              </button>
              {aiSpeaking && (
                <button
                  className="float-chat-tool-btn compact"
                  onClick={interruptAssistantSpeech}
                  title="Interrupt assistant speech"
                >
                  ⏹ Stop
                </button>
              )}
            </div>
            <div className="float-chat-control-block stretch">
              <button
                className={`float-chat-auto-voice${autoVoiceOnMic ? ' active' : ''}`}
                onClick={() => setAutoVoiceOnMic((v) => !v)}
                title="Auto speak only when question came from voice"
              >
                {autoVoiceOnMic ? 'Auto voice on mic: On' : 'Auto voice on mic: Off'}
              </button>
            </div>
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
            <div ref={bottomRef} />
          </div>

          {/* Quick replies */}
          {msgs.length <= 2 && (
            <div className="float-quick-replies">
              {(lang === 'en' ? QUICK_REPLIES : QUICK_REPLIES_SW).map((q) => (
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
              onChange={e => {
                if (aiSpeaking && e.target.value.trim().length > 0) {
                  interruptAssistantSpeech();
                }
                setInput(e.target.value);
              }}
              onKeyDown={e => e.key === 'Enter' && send(input)}
            />
            <button className={`float-chat-tool-btn input-mic${listening ? ' active' : ''}`} onClick={startListening} title="Voice input">
              {listening ? '🎙️' : '🎤'}
            </button>
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

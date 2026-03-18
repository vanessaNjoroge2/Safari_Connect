import { useState, useEffect } from 'react';
import { setToastHandler, showToast } from './toast';

// eslint-disable-next-line react-refresh/only-export-components
export { showToast };

// ---- TOAST ----
export function Toast() {
  const [toast, setToast] = useState(null);
  useEffect(() => {
    setToastHandler((msg, type = 'success') => {
      setToast({ msg, type });
      setTimeout(() => setToast(null), 2600);
    });
    return () => setToastHandler(null);
  }, []);
  if (!toast) return null;
  const bg = toast.type === 'success' ? '#0ea371' : toast.type === 'error' ? '#ef4444' : '#f59e0b';
  return <div className="toast" style={{ background: bg }}>{toast.msg}</div>;
}

// ---- MODAL ----
export function Modal({ open, onClose, title, children, width = 520 }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ width }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">{title}</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ---- BADGE ----
export function Badge({ variant = 'gray', children }) {
  return <span className={`badge badge-${variant}`}>{children}</span>;
}

// ---- AI BANNER ----
export function AiBanner({ text, action }) {
  return (
    <div className="ai-banner">
      <span className="ai-badge">AI</span>
      <span className="ai-text" dangerouslySetInnerHTML={{ __html: text }} />
      {action && action}
    </div>
  );
}

// ---- METRIC ----
export function Metric({ label, value, sub, neg }) {
  return (
    <div className="metric">
      <div className="metric-label">{label}</div>
      <div className="metric-val">{value}</div>
      {sub && <div className={`metric-sub${neg ? ' neg' : ''}`}>{sub}</div>}
    </div>
  );
}

// ---- CHART BAR ----
export function ChartBar({ label, pct, display, val }) {
  return (
    <div className="chart-row">
      <div className="chart-label">{label}</div>
      <div className="chart-track">
        <div className="chart-fill" style={{ width: `${pct}%` }}>{display}</div>
      </div>
      {val && <div className="chart-val">{val}</div>}
    </div>
  );
}

// ---- STEPS ----
export function Steps({ steps, current }) {
  return (
    <div className="steps">
      {steps.map((s, i) => (
        <>
          <div className="step-item" key={s}>
            <div className={`step-circle${i < current ? ' done' : i === current ? ' active' : ''}`}>
              {i < current ? '✓' : i + 1}
            </div>
            <span className={`step-label${i < current ? ' done' : i === current ? ' active' : ''}`}>{s}</span>
          </div>
          {i < steps.length - 1 && <div className={`step-line${i < current ? ' done' : ''}`} key={`line-${i}`} />}
        </>
      ))}
    </div>
  );
}

// ---- SEAT MAP ----
const LAYOUT = [
  'vip','vip','aisle','vip','vip',
  'business','business','aisle','business','business',
  'business','business','aisle','business','business',
  'available','available','aisle','booked','available',
  'available','booked','aisle','available','available',
  'available','available','aisle','available','booked',
  'available','available','aisle','available','available',
  'available','available','aisle','available','available',
  'booked','available','aisle','available','available',
  'available','available','aisle','available','available',
];
const COLS = ['A','B','','C','D'];

export function SeatMap({ onSelect, interactive = true }) {
  const [selected, setSelected] = useState(null);
  const handleClick = (i, type) => {
    if (!interactive || type === 'booked' || type === 'aisle') return;
    const row = Math.floor(i / 5) + 1;
    const col = COLS[i % 5];
    const label = row + col;
    if (selected === i) { setSelected(null); onSelect?.(null); return; }
    setSelected(i);
    onSelect?.(label, type);
  };
  return (
    <div className="seat-map-wrap">
      <div className="bus-front">🚌 Driver · Front of bus</div>
      <div className="seat-grid">
        {LAYOUT.map((type, i) => {
          const row = Math.floor(i / 5) + 1;
          const col = COLS[i % 5];
          const cls = selected === i ? 'selected' : type;
          return (
            <div key={i} className={`seat ${cls}`} onClick={() => handleClick(i, type)}>
              {type !== 'aisle' ? row + col : ''}
            </div>
          );
        })}
      </div>
      <div className="seat-legend">
        {[['var(--purple-light)','#c4b5fd','VIP'],['var(--blue-light)','#93c5fd','Business'],['var(--green-light)','#6ee7b7','Available'],['var(--red-light)','#fca5a5','Booked'],['var(--green)','var(--green-dark)','Selected']].map(([bg,bc,lbl]) => (
          <div className="legend-item" key={lbl}><div className="legend-dot" style={{background:bg,borderColor:bc}}/>{lbl}</div>
        ))}
      </div>
    </div>
  );
}

// ---- PIE CHART ----
export function PieChart({ segments }) {
  return (
    <div className="pie-wrap">
      <svg width="110" height="110" viewBox="0 0 36 36">
        <circle r="15.9" cx="18" cy="18" fill="none" stroke="#e5e7eb" strokeWidth="4"/>
        {segments.map((s,i) => (
          <circle key={i} r="15.9" cx="18" cy="18" fill="none" stroke={s.color} strokeWidth="4"
            strokeDasharray={`${s.pct} ${100-s.pct}`} strokeDashoffset={s.offset}/>
        ))}
      </svg>
      <div className="pie-legend">
        {segments.map(s => (
          <div className="pie-legend-item" key={s.label}>
            <div className="pie-dot" style={{background:s.color}}/>
            {s.label}
          </div>
        ))}
      </div>
    </div>
  );
}

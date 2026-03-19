import DashboardLayout from '../../components/DashboardLayout';
import { useToast } from '../../hooks/useToast';

export default function AdminSettings() {
  const toast = useToast();
  return (
    <DashboardLayout title="Platform Settings" subtitle="Configure global SafiriConnect platform parameters">
      <div className="grid-2" style={{ gap: 20 }}>

        {/* Commission & Pricing */}
        <div className="card" style={{ padding: 28 }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 20 }}>💰 Commission & Pricing</div>
          <div className="form-group">
            <label className="form-label">Platform commission rate (%)</label>
            <input className="input" defaultValue="5" type="number" min="0" max="30" />
            <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>Applied to all bookings as a percentage of fare</span>
          </div>
          <div className="form-group">
            <label className="form-label">Minimum fare (KES)</label>
            <input className="input" defaultValue="50" type="number" />
          </div>
          <div className="form-group">
            <label className="form-label">AI dynamic pricing — enabled</label>
            <select className="input"><option>Yes — AI controls surge pricing</option><option>No — fixed fares only</option></select>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => toast('Commission settings saved!')}>Save</button>
        </div>

        {/* AI Agent */}
        <div className="card" style={{ padding: 28 }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 20 }}>🤖 AI Agent Settings</div>
          <div className="form-group">
            <label className="form-label">Fraud auto-block threshold</label>
            <select className="input">
              <option>Score ≥ 80 — auto block</option>
              <option>Score ≥ 70 — auto block</option>
              <option>Score ≥ 90 — auto block</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Delay risk alert level</label>
            <select className="input">
              <option>Medium risk — alert operators</option>
              <option>High risk only — alert operators</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">AI voice assistant languages</label>
            <select className="input"><option>English + Swahili (default)</option><option>English only</option></select>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => toast('AI settings saved!')}>Save</button>
        </div>

        {/* Notifications */}
        <div className="card" style={{ padding: 28 }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 20 }}>🔔 Notifications</div>
          {[
            { label: 'SMS on booking confirmation', defaultOn: true },
            { label: 'Email ticket delivery', defaultOn: true },
            { label: 'Push notification on departure', defaultOn: true },
            { label: 'SACCO daily revenue report email', defaultOn: false },
            { label: 'Admin fraud alert email', defaultOn: true },
          ].map(n => (
            <div key={n.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <span style={{ fontSize: 13 }}>{n.label}</span>
              <select className="input" style={{ width: 90, fontSize: 12, padding: '4px 8px' }}>
                <option value="on"  selected={n.defaultOn}>On</option>
                <option value="off" selected={!n.defaultOn}>Off</option>
              </select>
            </div>
          ))}
          <button className="btn btn-primary btn-sm" onClick={() => toast('Notification settings saved!')}>Save</button>
        </div>

        {/* Security */}
        <div className="card" style={{ padding: 28 }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 20 }}>🔒 Security & Access</div>
          <div className="form-group">
            <label className="form-label">Session timeout (minutes)</label>
            <input className="input" defaultValue="60" type="number" />
          </div>
          <div className="form-group">
            <label className="form-label">Max failed login attempts</label>
            <input className="input" defaultValue="5" type="number" />
          </div>
          <div className="form-group">
            <label className="form-label">Require 2FA for admin accounts</label>
            <select className="input"><option>Yes (recommended)</option><option>No</option></select>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => toast('Security settings saved!')}>Save</button>
        </div>
      </div>

      {/* Platform info */}
      <div className="card" style={{ padding: 24, marginTop: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>ℹ️ Platform Information</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
          {[
            { label: 'Platform version', value: '3.0.0' },
            { label: 'Environment',      value: 'Production' },
            { label: 'Build',            value: '20260319' },
            { label: 'API status',       value: '🟢 Operational' },
          ].map(i => (
            <div key={i.label} style={{ background: 'var(--gray-50)', borderRadius: 8, padding: '12px 16px' }}>
              <div style={{ fontSize: 11, color: 'var(--gray-400)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em' }}>{i.label}</div>
              <div style={{ fontSize: 13, fontWeight: 700, marginTop: 4 }}>{i.value}</div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}

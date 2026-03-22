import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { useToast } from '../../hooks/useToast';
import { getAdminSettingsApi, updateAdminSettingsApi } from '../../lib/api';
import type { AdminSettingsEnvelope } from '../../lib/api';

export default function AdminSettings() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<AdminSettingsEnvelope['data'] | null>(null);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      setLoading(true);
      try {
        const response = await getAdminSettingsApi();
        if (mounted) setSettings(response.data);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void run();
    return () => {
      mounted = false;
    };
  }, []);

  const saveSettings = async (payload: Partial<AdminSettingsEnvelope['data']>, successMessage: string) => {
    try {
      const response = await updateAdminSettingsApi(payload);
      setSettings(response.data);
      toast(successMessage, 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update settings';
      toast(message, 'error');
    }
  };

  if (loading || !settings) {
    return (
      <DashboardLayout title="Platform Settings" subtitle="Configure global SafiriConnect platform parameters">
        <div className="card" style={{ padding: 24 }}>Loading settings...</div>
      </DashboardLayout>
    );
  }

  const notificationOptions: Array<{ key: keyof AdminSettingsEnvelope['data']['notifications']; label: string }> = [
    { key: 'smsBooking', label: 'SMS on booking confirmation' },
    { key: 'emailTicket', label: 'Email ticket delivery' },
    { key: 'pushDeparture', label: 'Push notification on departure' },
    { key: 'pushNotifications', label: 'General push notifications' },
    { key: 'saccoRevenueReport', label: 'SACCO daily revenue report email' },
    { key: 'adminFraudAlert', label: 'Admin fraud alert email' },
  ];

  return (
    <DashboardLayout title="Platform Settings" subtitle="Configure global SafiriConnect platform parameters">
      <div className="grid-2" style={{ gap: 20 }}>

        {/* Commission & Pricing */}
        <div className="card" style={{ padding: 28 }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 20 }}>💰 Commission & Pricing</div>
          <div className="form-group">
            <label className="form-label">Platform commission rate (%)</label>
            <input
              className="input"
              value={settings.commissionRate}
              onChange={(e) => setSettings((prev) => prev ? { ...prev, commissionRate: Number(e.target.value) } : prev)}
              type="number"
              min="0"
              max="30"
            />
            <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>Applied to all bookings as a percentage of fare</span>
          </div>
          <div className="form-group">
            <label className="form-label">Minimum fare (KES)</label>
            <input
              className="input"
              value={settings.minimumFare}
              onChange={(e) => setSettings((prev) => prev ? { ...prev, minimumFare: Number(e.target.value) } : prev)}
              type="number"
            />
          </div>
          <div className="form-group">
            <label className="form-label">AI dynamic pricing — enabled</label>
            <select
              className="input"
              value={settings.aiPricing ? 'true' : 'false'}
              onChange={(e) => setSettings((prev) => prev ? { ...prev, aiPricing: e.target.value === 'true' } : prev)}
            >
              <option value="true">Yes — AI controls surge pricing</option>
              <option value="false">No — fixed fares only</option>
            </select>
          </div>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => saveSettings({
              commissionRate: settings.commissionRate,
              minimumFare: settings.minimumFare,
              aiPricing: settings.aiPricing,
            }, 'Commission settings saved!')}
          >
            Save
          </button>
        </div>

        {/* AI Agent */}
        <div className="card" style={{ padding: 28 }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 20 }}>🤖 AI Agent Settings</div>
          <div className="form-group">
            <label className="form-label">Fraud auto-block threshold</label>
            <select
              className="input"
              value={String(settings.fraudBlockThreshold)}
              onChange={(e) => setSettings((prev) => prev ? { ...prev, fraudBlockThreshold: Number(e.target.value) } : prev)}
            >
              {[60, 70, 80, 90].map((value) => (
                <option key={value} value={value}>{`Score >= ${value} — auto block`}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Delay risk alert level</label>
            <select
              className="input"
              value={settings.delayRiskAlert}
              onChange={(e) => setSettings((prev) => prev ? { ...prev, delayRiskAlert: e.target.value as 'medium' | 'high' } : prev)}
            >
              <option value="medium">Medium risk — alert operators</option>
              <option value="high">High risk only — alert operators</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">AI voice assistant languages</label>
            <select
              className="input"
              value={settings.voiceLanguages}
              onChange={(e) => setSettings((prev) => prev ? { ...prev, voiceLanguages: e.target.value as 'en' | 'sw' | 'en-sw' } : prev)}
            >
              <option value="en">English only</option>
              <option value="sw">Swahili only</option>
              <option value="en-sw">English + Swahili (default)</option>
            </select>
          </div>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => saveSettings({
              fraudBlockThreshold: settings.fraudBlockThreshold,
              delayRiskAlert: settings.delayRiskAlert,
              voiceLanguages: settings.voiceLanguages,
            }, 'AI settings saved!')}
          >
            Save
          </button>
        </div>

        {/* Notifications */}
        <div className="card" style={{ padding: 28 }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 20 }}>🔔 Notifications</div>
          {notificationOptions.map((n) => (
            <div key={n.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <span style={{ fontSize: 13 }}>{n.label}</span>
              <select
                className="input"
                style={{ width: 90, fontSize: 12, padding: '4px 8px' }}
                value={settings.notifications[n.key] ? 'on' : 'off'}
                onChange={(e) => setSettings((prev) => prev ? {
                  ...prev,
                  notifications: { ...prev.notifications, [n.key]: e.target.value === 'on' },
                } : prev)}
              >
                <option value="on">On</option>
                <option value="off">Off</option>
              </select>
            </div>
          ))}
          <button
            className="btn btn-primary btn-sm"
            onClick={() => saveSettings({
              notifications: settings.notifications,
            }, 'Notification settings saved!')}
          >
            Save
          </button>
        </div>

        {/* Security */}
        <div className="card" style={{ padding: 28 }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 20 }}>🔒 Security & Access</div>
          <div className="form-group">
            <label className="form-label">Session timeout (minutes)</label>
            <input
              className="input"
              value={settings.sessionTimeoutMinutes}
              onChange={(e) => setSettings((prev) => prev ? { ...prev, sessionTimeoutMinutes: Number(e.target.value) } : prev)}
              type="number"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Max failed login attempts</label>
            <input
              className="input"
              value={settings.maxFailedLogins}
              onChange={(e) => setSettings((prev) => prev ? { ...prev, maxFailedLogins: Number(e.target.value) } : prev)}
              type="number"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Require 2FA for admin accounts</label>
            <select
              className="input"
              value={settings.require2fa ? 'true' : 'false'}
              onChange={(e) => setSettings((prev) => prev ? { ...prev, require2fa: e.target.value === 'true' } : prev)}
            >
              <option value="true">Yes (recommended)</option>
              <option value="false">No</option>
            </select>
          </div>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => saveSettings({
              sessionTimeoutMinutes: settings.sessionTimeoutMinutes,
              maxFailedLogins: settings.maxFailedLogins,
              require2fa: settings.require2fa,
            }, 'Security settings saved!')}
          >
            Save
          </button>
        </div>
      </div>

      {/* Platform info */}
      <div className="card" style={{ padding: 24, marginTop: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>ℹ️ Platform Information</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
          {[
            { label: 'Platform version', value: settings.platformInfo.version },
            { label: 'Environment',      value: settings.platformInfo.environment },
            { label: 'Build',            value: settings.platformInfo.build },
            { label: 'API status',       value: settings.platformInfo.apiStatus },
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

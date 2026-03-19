import type { FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import { changeMyPasswordApi, getMyBookingsApi, updateMeApi } from '../../lib/api';

function PwdInput({ placeholder, value, onChange }: { placeholder: string; value: string; onChange: (v: string) => void }) {
  const [show, setShow] = useState(false);
  return (
    <div className="pwd-field">
      <input
        className="input"
        type={show ? 'text' : 'password'}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
      <button type="button" className="pwd-toggle" onClick={() => setShow(s => !s)}>
        {show ? '🙈' : '👁️'}
      </button>
    </div>
  );
}

export default function Profile() {
  const { user, setUserProfile } = useAuth();
  const toast = useToast();
  const [bookings, setBookings] = useState<Array<{
    amount: number;
    trip: { route: { origin: string; destination: string } };
  }>>([]);

  const [form, setForm] = useState({
    firstName:  user?.name?.split(' ')[0] ?? '',
    lastName:   user?.name?.split(' ')[1] ?? '',
    email:      user?.email ?? '',
    phone:      user?.phone ?? '',
    residence:  user?.residence ?? '',
    currentPwd: '',
    newPwd:     '',
    confirmPwd: '',
  });

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      firstName: user?.name?.split(' ')[0] ?? '',
      lastName: user?.name?.split(' ').slice(1).join(' ') ?? '',
      email: user?.email ?? '',
      phone: user?.phone ?? '',
      residence: user?.residence ?? '',
    }));
  }, [user]);

  const handleSaveProfile = async (e?: FormEvent) => {
    e?.preventDefault();

    if (!user) {
      toast('You must be logged in to update your profile', 'error');
      return;
    }

    const firstName = form.firstName.trim();
    const lastName = form.lastName.trim();
    const email = form.email.trim().toLowerCase();
    const phone = form.phone.trim();

    if (!firstName || !lastName || !email) {
      toast('First name, last name, and email are required', 'warning');
      return;
    }

    setSavingProfile(true);
    try {
      const result = await updateMeApi({ firstName, lastName, email, phone });
      const updatedName = `${result.data.firstName} ${result.data.lastName}`.trim();
      const initials = updatedName
        .split(' ')
        .filter(Boolean)
        .map((p) => p[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

      setUserProfile({
        ...user,
        name: updatedName || result.data.email,
        email: result.data.email,
        phone: result.data.phone || '',
        initials: initials || user.initials || 'SC',
      });

      toast('Profile updated successfully', 'success');
    } catch (error) {
      toast((error as Error).message || 'Unable to update profile', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSavePassword = async () => {
    if (!form.currentPwd || !form.newPwd || !form.confirmPwd) {
      toast('Provide current and new password details', 'warning');
      return;
    }

    setSavingPassword(true);
    try {
      await changeMyPasswordApi({
        currentPassword: form.currentPwd,
        newPassword: form.newPwd,
        confirmPassword: form.confirmPwd,
      });

      setForm((prev) => ({
        ...prev,
        currentPwd: '',
        newPwd: '',
        confirmPwd: '',
      }));
      toast('Password updated successfully', 'success');
    } catch (error) {
      toast((error as Error).message || 'Unable to update password', 'error');
    } finally {
      setSavingPassword(false);
    }
  };

  useEffect(() => {
    void (async () => {
      try {
        const result = await getMyBookingsApi();
        setBookings(
          result.data.map((b) => ({
            amount: Number(b.amount) || 0,
            trip: b.trip,
          }))
        );
      } catch (error) {
        toast((error as Error).message || 'Unable to load profile travel stats', 'error');
      }
    })();
  }, [toast]);

  const trustScore = user?.trustScore ?? 94;
  const circumference = 2 * Math.PI * 28;
  const dashOffset = circumference - (trustScore / 100) * circumference;

  const totalTrips = bookings.length;
  const totalSpent = bookings.reduce((sum, b) => sum + b.amount, 0);
  const favouriteRoute = useMemo(() => {
    if (!bookings.length) return { label: 'No trips yet', count: 0 };

    const routeMap = new Map<string, number>();
    bookings.forEach((b) => {
      const routeKey = `${b.trip.route.origin} -> ${b.trip.route.destination}`;
      routeMap.set(routeKey, (routeMap.get(routeKey) || 0) + 1);
    });

    let topRoute = 'No trips yet';
    let topCount = 0;
    routeMap.forEach((count, route) => {
      if (count > topCount) {
        topRoute = route;
        topCount = count;
      }
    });

    return { label: topRoute, count: topCount };
  }, [bookings]);

  const stats = [
    { label: 'TOTAL TRIPS',     value: totalTrips.toString(),          sub: 'From booking history',       color: 'var(--brand)' },
    { label: 'FAVOURITE ROUTE', value: favouriteRoute.label, sub: `${favouriteRoute.count} of ${totalTrips} trips`,  color: '#3b82f6' },
    { label: 'TOTAL SPENT',     value: `KES ${totalSpent.toLocaleString()}`,  sub: 'From booking history',        color: '#7c3aed' },
    { label: 'AI TRUST SCORE',  value: `${trustScore}/100`, sub: 'Excellent', color: 'var(--brand)' },
  ];

  const helpItems = [
    { icon: '❓', label: 'Help Center' },
    { icon: '🎧', label: 'Contact Support' },
    { icon: '📜', label: 'Terms of Service' },
    { icon: '🔒', label: 'Privacy Policy' },
  ];

  return (
    <DashboardLayout
      title="My profile"
      subtitle="Manage your account and preferences"
      actions={
        <button className="btn btn-primary btn-sm" disabled={savingProfile} onClick={() => void handleSaveProfile()}>
          {savingProfile ? 'Saving...' : 'Save changes'}
        </button>
      }
    >
      {/* ── Profile hero card ── */}
      <div className="profile-hero">
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
          {/* Avatar */}
          <div className="profile-avatar-lg">{user?.initials ?? 'JM'}</div>

          {/* Name + verified */}
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
              <h3 style={{ color: '#fff', margin: 0, fontSize: '1.25rem' }}>{user?.name}</h3>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(14,163,113,.2)', border: '1px solid rgba(14,163,113,.3)', color: 'var(--brand-mid)', fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 99 }}>
                ✓ VERIFIED
              </span>
            </div>
            <div style={{ color: 'rgba(255,255,255,.5)', fontSize: 13 }}>{user?.email}</div>
          </div>

          {/* Trust score ring */}
          <div style={{ textAlign: 'center', flexShrink: 0 }}>
            <div style={{ position: 'relative', width: 72, height: 72, margin: '0 auto 6px' }}>
              <svg width="72" height="72" viewBox="0 0 72 72">
                <circle cx="36" cy="36" r="28" fill="none" stroke="rgba(255,255,255,.1)" strokeWidth="5" />
                <circle cx="36" cy="36" r="28" fill="none" stroke="var(--brand)" strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  transform="rotate(-90 36 36)" />
                <text x="36" y="40" textAnchor="middle" fill="var(--brand)" fontSize="14" fontWeight="800" fontFamily="DM Sans, sans-serif">{trustScore}</text>
              </svg>
            </div>
            <div style={{ color: 'rgba(255,255,255,.5)', fontSize: 11, letterSpacing: '.04em' }}>TRUST SCORE</div>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginTop: 24, position: 'relative', zIndex: 1 }}>
          {stats.map(s => (
            <div key={s.label} style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.08em', color: 'rgba(255,255,255,.4)', textTransform: 'uppercase', marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>{s.value}</div>
              <div style={{ fontSize: 11, color: s.color, marginTop: 3 }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Main grid ── */}
      <div className="grid-2" style={{ gap: 24 }}>
        {/* Left: edit form */}
        <div>
          <div className="card mb-4">
            <div className="card-title">Edit profile</div>
            <form onSubmit={(e) => void handleSaveProfile(e)}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">First name</label>
                  <input className="input" value={form.firstName} onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Last name</label>
                  <input className="input" value={form.lastName} onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Email address</label>
                <input className="input" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Phone number</label>
                  <input className="input" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Residence</label>
                <input className="input" value={form.residence} onChange={e => setForm(p => ({ ...p, residence: e.target.value }))} />
              </div>
            </form>
          </div>

          <div className="card">
            <div className="card-title">Change password</div>
            <div className="form-group">
              <label className="form-label">Current password</label>
              <PwdInput placeholder="••••••••" value={form.currentPwd} onChange={v => setForm(p => ({ ...p, currentPwd: v }))} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">New password</label>
                <PwdInput placeholder="Min 6 characters" value={form.newPwd} onChange={v => setForm(p => ({ ...p, newPwd: v }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm new</label>
                <PwdInput placeholder="Repeat" value={form.confirmPwd} onChange={v => setForm(p => ({ ...p, confirmPwd: v }))} />
              </div>
            </div>
            <button className="btn btn-primary btn-full" disabled={savingPassword} onClick={() => void handleSavePassword()}>
              {savingPassword ? 'Updating password...' : 'Update password'}
            </button>
          </div>
        </div>

        {/* Right: help & about */}
        <div>
          <div className="card mb-4">
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--gray-400)', marginBottom: 4 }}>Help &amp; Support</div>
            {helpItems.map(item => (
              <div key={item.label} className="help-list-item">
                <div className="help-list-icon">{item.icon}</div>
                <span className="help-list-label">{item.label}</span>
                <span className="help-list-chevron">›</span>
              </div>
            ))}
          </div>

          <div className="card">
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--gray-400)', marginBottom: 16 }}>About SafiriConnect</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--gray-100)', fontSize: 14 }}>
              <span style={{ color: 'var(--gray-600)' }}>App version</span>
              <span style={{ fontWeight: 600, color: 'var(--gray-900)' }}>1.0.0</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--gray-100)', fontSize: 14 }}>
              <span style={{ color: 'var(--gray-600)' }}>Platform</span>
              <span style={{ fontWeight: 600, color: 'var(--brand)' }}>SafiriConnect Web</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', fontSize: 14 }}>
              <span style={{ color: 'var(--gray-600)' }}>Build</span>
              <span style={{ fontWeight: 600, color: 'var(--gray-900)' }}>2026.03</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 16 }}>
              <button className="btn btn-full" style={{ fontSize: 13 }}>⭐ Rate Us</button>
              <button className="btn btn-primary btn-full" style={{ fontSize: 13 }}>↗ Share SafiriConnect</button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

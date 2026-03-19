import { useNavigate } from 'react-router-dom';

const FEATURES = [
  { icon: '🤖', title: 'AI-Powered Pricing',   desc: 'Dynamic fares adjust in real time based on demand and traffic patterns' },
  { icon: '📍', title: 'Live GPS Tracking',     desc: 'Track your bus or delivery on an interactive real-time map' },
  { icon: '💳', title: 'Instant M-Pesa',        desc: 'One-tap STK push payment — no cash, no queues, instant confirmation' },
  { icon: '🛡️', title: 'Fraud Protection',      desc: 'AI screens every booking to keep the platform safe and secure' },
  { icon: '📦', title: 'Carrier Services',      desc: 'Package delivery, movers & relocation, and document courier' },
  { icon: '📊', title: 'Fleet Analytics',       desc: 'Real-time revenue, occupancy, and route performance dashboards' },
];

const STATS = [
  { value: '1,240+', label: 'Daily bookings' },
  { value: '34',     label: 'Active SACCOs' },
  { value: 'KES 4.2M', label: 'Processed MTD' },
  { value: '99.8%',  label: 'Uptime SLA' },
];

const TESTIMONIALS = [
  { name: 'James Mwangi', role: 'SACCO Owner · Nairobi', text: 'SafiriConnect transformed how we manage our 40-vehicle fleet. Bookings are up 60% since switching.' },
  { name: 'Amina Hassan', role: 'Regular Passenger · Mombasa', text: 'I love the live tracking. I know exactly when my bus arrives and I pay with M-Pesa in seconds.' },
  { name: 'Peter Kamau', role: 'Fleet Manager · Kisumu', text: 'The analytics dashboard gives us insights we never had before. Route profitability is crystal clear.' },
];

export default function Welcome() {
  const navigate = useNavigate();

  return (
    <div className="welcome-root">
      {/* ── Top nav ────────────────────────────────────── */}
      <nav className="welcome-topbar">
        <div className="welcome-topbar-inner">
          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '-.01em' }}>
            Safiri<span style={{ color: 'var(--brand)' }}>Connect</span>
          </div>

          <div className="welcome-nav-links">
            <button className="welcome-nav-link">Features</button>
            <button className="welcome-nav-link">Pricing</button>
            <button className="welcome-nav-link">SACCOs</button>
            <button className="welcome-nav-link">About</button>
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
            <button
              className="btn btn-ghost btn-sm"
              style={{ color: 'var(--gray-400)', border: '1px solid rgba(255,255,255,.1)' }}
              onClick={() => navigate('/auth/login')}
            >
              Sign in
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/auth/register')}>
              Get started free →
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────── */}
      <div className="welcome-hero fade-in">
        {/* Left */}
        <div>
          <div className="hero-eyebrow">
            <span>🇰🇪</span> Built for Kenya's transport ecosystem
          </div>
          <h1 style={{ color: '#fff', marginBottom: 20 }}>
            Kenya's smartest<br />
            <span style={{ color: 'var(--brand)' }}>transport platform</span>
          </h1>
          <p style={{ color: 'var(--gray-400)', fontSize: 17, lineHeight: 1.8, maxWidth: 500, marginBottom: 44 }}>
            Book buses, matatus, boda bodas, and carrier services.
            Instant M-Pesa payment, live GPS tracking, and AI-optimised
            pricing — all in one professional platform.
          </p>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 36 }}>
            <button className="btn btn-primary" onClick={() => navigate('/auth/register')}>
              Create account {'->'}
            </button>
            <button className="btn" onClick={() => navigate('/auth/login')}>
              Sign in {'->'}
            </button>
          </div>

          <p style={{ fontSize: 13, color: 'var(--gray-600)' }}>
            Already have an account?{' '}
            <span
              style={{ color: 'var(--brand)', cursor: 'pointer', fontWeight: 600 }}
              onClick={() => navigate('/auth/login')}
            >
              Sign in →
            </span>
          </p>
        </div>

        {/* Right */}
        <div>
          {/* Platform stats */}
          <div style={{
            background: 'rgba(14,163,113,.07)',
            border: '1px solid rgba(14,163,113,.18)',
            borderRadius: 16, padding: '22px 26px',
            marginBottom: 18,
          }}>
            <div style={{ fontSize: 10, color: 'var(--brand-mid)', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--brand)', display: 'inline-block' }} />
              Live platform metrics
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 20 }}>
              {STATS.map(s => (
                <div key={s.label}>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 26, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 5 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Feature grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {FEATURES.map(f => (
              <div key={f.title} style={{
                background: 'rgba(255,255,255,.03)',
                border: '1px solid rgba(255,255,255,.07)',
                borderRadius: 12, padding: '18px 20px',
                transition: 'all .15s',
              }}>
                <span style={{ fontSize: 26, display: 'block', marginBottom: 10 }}>{f.icon}</span>
                <div style={{ fontWeight: 600, color: '#fff', fontSize: 13, marginBottom: 5 }}>{f.title}</div>
                <div style={{ color: 'var(--gray-500)', fontSize: 12, lineHeight: 1.6 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Testimonials section ────────────────────────── */}
      <div className="welcome-features-section">
        <div className="welcome-features-inner">
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ fontSize: 11, color: 'var(--brand-mid)', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 14 }}>Trusted across Kenya</div>
            <h2 style={{ color: '#fff', fontSize: '1.875rem', marginBottom: 12 }}>What our users say</h2>
            <p style={{ color: 'var(--gray-400)', maxWidth: 500, margin: '0 auto' }}>Thousands of passengers, SACCO owners, and fleet managers rely on SafiriConnect every day.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
            {TESTIMONIALS.map(t => (
              <div key={t.name} style={{
                background: 'rgba(255,255,255,.04)',
                border: '1px solid rgba(255,255,255,.08)',
                borderRadius: 16, padding: '26px 28px',
              }}>
                <div style={{ fontSize: 28, color: 'var(--brand)', marginBottom: 16, lineHeight: 1 }}>"</div>
                <p style={{ color: 'var(--gray-300)', fontSize: 14, lineHeight: 1.75, marginBottom: 20 }}>{t.text}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                    {t.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: '#fff', fontSize: 13 }}>{t.name}</div>
                    <div style={{ color: 'var(--gray-500)', fontSize: 12 }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Footer ─────────────────────────────────────── */}
      <footer className="welcome-footer">
        <div className="welcome-footer-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, color: '#fff', fontSize: 15 }}>
              Safiri<span style={{ color: 'var(--brand)' }}>Connect</span>
            </span>
            <span>© 2026 · All rights reserved</span>
          </div>
          <div style={{ display: 'flex', gap: 24 }}>
            {['Privacy policy', 'Terms of service', 'Contact support', 'Status'].map(l => (
              <span
                key={l}
                style={{ cursor: 'pointer', transition: 'color .15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--brand)')}
                onMouseLeave={e => (e.currentTarget.style.color = '')}
              >{l}</span>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import Topbar from '../components/Topbar';
import { showToast } from '../components/UI';

const ROLES = [
  { id: 'user', icon: '👤', title: 'Passenger', desc: 'Search, book & pay for trips' },
  { id: 'owner', icon: '🏢', title: 'SACCO Owner', desc: 'Manage fleet, routes & bookings' },
  { id: 'admin', icon: '🛡️', title: 'Super Admin', desc: 'Platform governance & analytics' },
];

export default function Login() {
  const [selectedRole, setSelectedRole] = useState('user');
  const [mode, setMode] = useState('signin');
  const [submitting, setSubmitting] = useState(false);
  const [firstName, setFirstName] = useState('Jane');
  const [lastName, setLastName] = useState('Mwangi');
  const [email, setEmail] = useState('demo@safiri.co.ke');
  const [phone, setPhone] = useState('0712345678');
  const [password, setPassword] = useState('demo123');
  const [saccoName, setSaccoName] = useState('Modern Coast Sacco');

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const PATHS = { user: '/user', owner: '/owner', admin: '/admin' };

  const navigateByRole = (role) => {
    navigate(PATHS[role] || '/user');
  };

  const doLogin = async (role) => {
    setSubmitting(true);
    try {
      if (role) {
        const user = await login(role);
        navigateByRole(user.role);
        return;
      }

      if (mode === 'signin') {
        const user = await login({ email, password });
        showToast('Login successful');
        navigateByRole(user.role);
      } else {
        const payload = {
          firstName,
          lastName,
          email,
          phone,
          password,
          role: selectedRole === 'owner' ? 'OWNER' : 'USER',
          ...(selectedRole === 'owner' ? { saccoName } : {})
        };

        const user = await register(payload);
        showToast('Account created successfully');
        navigateByRole(user.role);
      }
    } catch (error) {
      showToast(error.message || 'Authentication failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Topbar />
      <div className="auth-wrap" style={{ paddingTop: 56 }}>
        <div style={{ display: 'flex', gap: 60, alignItems: 'center', maxWidth: 900, width: '100%', flexWrap: 'wrap' }}>
          {/* Left — role selector */}
          <div style={{ flex: 1, minWidth: 280 }}>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 38, fontWeight: 800, color: '#fff', lineHeight: 1.1, marginBottom: 8 }}>
              Safiri<span style={{ color: 'var(--green)' }}>Connect</span>
            </div>
            <div style={{ fontSize: 14, color: 'var(--gray-400)', marginBottom: 28, lineHeight: 1.7, maxWidth: 340 }}>
              Kenya's AI-powered transport marketplace. Book buses, matatus, boda bodas &amp; carrier services with instant M-Pesa payment.
            </div>
            <div style={{ fontSize: 11, color: 'var(--gray-500)', marginBottom: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em' }}>Sign in as</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {ROLES.map(r => (
                <div key={r.id}
                  onClick={() => setSelectedRole(r.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px',
                    background: selectedRole === r.id ? 'rgba(14,163,113,.2)' : 'rgba(255,255,255,.05)',
                    border: `1px solid ${selectedRole === r.id ? 'var(--green)' : 'rgba(255,255,255,.1)'}`,
                    borderRadius: 12, cursor: 'pointer', transition: 'all .15s'
                  }}>
                  <div style={{ width: 44, height: 44, background: 'rgba(255,255,255,.08)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{r.icon}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{r.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 2 }}>{r.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — auth card */}
          <div className="auth-card" style={{ width: 390, flexShrink: 0 }}>
            <div className="auth-title">{mode === 'signin' ? 'Welcome back' : 'Create account'}</div>
            <div className="auth-sub">
              {mode === 'signin' ? `Sign in as ${ROLES.find(r => r.id === selectedRole)?.title}` : 'Join SafiriConnect today'}
            </div>
            <div className="auth-toggle">
              <button className={`auth-toggle-btn${mode === 'signin' ? ' active' : ''}`} onClick={() => setMode('signin')}>Sign in</button>
              <button className={`auth-toggle-btn${mode === 'signup' ? ' active' : ''}`} onClick={() => setMode('signup')}>Sign up</button>
            </div>
            {mode === 'signup' && (
              <div className="form-row" style={{ marginBottom: 14 }}>
                <div className="form-group" style={{ margin: 0 }}><label className="form-label">First name</label><input className="form-input" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Jane" /></div>
                <div className="form-group" style={{ margin: 0 }}><label className="form-label">Last name</label><input className="form-input" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Mwangi" /></div>
              </div>
            )}
            <div className="form-group"><label className="form-label">Email address</label><input className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            {mode === 'signup' && (
              <>
                <div className="form-group"><label className="form-label">Phone number</label><input className="form-input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0712345678" /></div>
                {selectedRole === 'owner' && (
                  <div className="form-group"><label className="form-label">Sacco name</label><input className="form-input" value={saccoName} onChange={(e) => setSaccoName(e.target.value)} /></div>
                )}
              </>
            )}
            <div className="form-group"><label className="form-label">Password</label><input className="form-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
            <button className="btn btn-primary btn-full" style={{ marginTop: 4, padding: 11 }} onClick={() => doLogin()} disabled={submitting}>{submitting ? 'Please wait...' : 'Continue →'}</button>
            <div style={{ textAlign: 'center', margin: '16px 0', fontSize: 11, color: 'var(--gray-400)' }}>— or use a demo account —</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {ROLES.map(r => (
                <button key={r.id} className="btn" style={{ justifyContent: 'flex-start', fontSize: 12 }} onClick={() => doLogin(r.id)}>
                  {r.icon} Demo {r.title} →
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

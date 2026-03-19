import type { FormEvent } from 'react';
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';

function PwdInput({ placeholder, value, onChange, hasError }: { placeholder: string; value: string; onChange: (v: string) => void; hasError?: boolean }) {
  const [show, setShow] = useState(false);
  return (
    <div className="pwd-field">
      <input
        className={`input${hasError ? ' has-error' : ''}`}
        type={show ? 'text' : 'password'}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
      <button type="button" className="pwd-toggle" onClick={() => setShow(s => !s)} title={show ? 'Hide password' : 'Show password'}>
        {show ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
            <line x1="1" y1="1" x2="23" y2="23"/>
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        )}
      </button>
    </div>
  );
}

const ROLE_HOME = {
  passenger: '/passenger/home',
  owner: '/owner/dashboard',
  admin: '/admin/dashboard',
} as const;

interface FormState { email: string; password: string; }
interface FormErrors { email?: string; password?: string; }

export default function Login() {
  const navigate = useNavigate();

  const { login, isLoading } = useAuth();
  const toast = useToast();

  const [form, setForm] = useState<FormState>({ email: '', password: '' });
  const [errors, setErrors] = useState<FormErrors>({});

  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!form.email)    e.email    = 'Email address is required';
    if (!form.password) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      const user = await login({ email: form.email, password: form.password });
      toast('Welcome back! Redirecting to your dashboard.');
      navigate(ROLE_HOME[user.role]);
    } catch {
      toast('Invalid credentials. Please try again.', 'error');
    }
  };

  return (
    <div className="auth-root">
      {/* Left panel */}
      <div className="auth-left">
        {/* Top */}
        <div>
          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 36 }}>
            Safiri<span style={{ color: 'var(--brand)' }}>Connect</span>
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.12)', padding: '6px 14px', borderRadius: 99, marginBottom: 18 }}>
            <span>🔐</span>
            <span style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>Unified Sign In</span>
          </div>
          <h2 style={{ color: '#fff', fontSize: '2rem', lineHeight: 1.2, marginBottom: 12 }}>
            One account,<br />one secure login.
          </h2>
          <p style={{ color: 'rgba(255,255,255,.55)', lineHeight: 1.75, fontSize: 14 }}>Sign in once and we route you to the correct workspace based on your backend account permissions.</p>
        </div>

        {/* Center: emblem + stats */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
          {/* Brand emblem */}
          <div style={{ position: 'relative', width: 120, height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '1.5px solid rgba(14,163,113,.25)' }} />
            <div style={{ position: 'absolute', inset: 12, borderRadius: '50%', border: '1.5px solid rgba(14,163,113,.35)' }} />
            <div style={{
              position: 'absolute', inset: 24, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--brand), #065f46)',
              boxShadow: '0 0 32px rgba(14,163,113,.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '-.02em' }}>SC</span>
            </div>
          </div>

          {/* Mini stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, width: '100%' }}>
            {[
              { v: '1,240+', l: 'Bookings today' },
              { v: '34',     l: 'Active SACCOs' },
              { v: '99.8%',  l: 'Uptime' },
              { v: 'KES 4.2M', l: 'Processed MTD' },
            ].map(s => (
              <div key={s.l} style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{s.v}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', marginTop: 4 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom: features */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { icon: '🔒', text: 'Secured M-Pesa payments' },
            { icon: '📍', text: 'Real-time GPS tracking' },
            { icon: '🤖', text: 'AI-powered smart pricing' },
          ].map(f => (
            <div key={f.text} style={{ color: 'rgba(255,255,255,.5)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 15 }}>{f.icon}</span>
              {f.text}
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="auth-right">
        <div className="auth-form-box fade-in">
          <div style={{ marginBottom: 30 }}>
            <h2 style={{ fontSize: '1.6rem', marginBottom: 6 }}>Sign in</h2>
            <p style={{ color: 'var(--gray-400)', fontSize: 14 }}>
              Don't have an account?{' '}
              <Link to="/auth/register" style={{ color: 'var(--brand)', fontWeight: 600 }}>Create one free</Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label">Email address</label>
              <input className={`input${errors.email ? ' has-error' : ''}`}
                type="email" placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
              {errors.email && <span className="form-error">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <PwdInput placeholder="••••••••" value={form.password} onChange={v => setForm(p => ({ ...p, password: v }))} hasError={!!errors.password} />
              {errors.password && <span className="form-error">{errors.password}</span>}
              <div style={{ textAlign: 'right', marginTop: 6 }}>
                <span style={{ fontSize: 13, color: 'var(--brand)', cursor: 'pointer' }}>Forgot password?</span>
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-lg btn-full" disabled={isLoading}
              style={{ marginTop: 4 }}>
              {isLoading ? 'Signing in…' : 'Sign in →'}
            </button>
          </form>

          <p style={{ fontSize: 12, color: 'var(--gray-400)', textAlign: 'center', marginTop: 24 }}>
            By signing in you agree to our{' '}
            <span style={{ color: 'var(--brand)', cursor: 'pointer' }}>Terms of Service</span> and{' '}
            <span style={{ color: 'var(--brand)', cursor: 'pointer' }}>Privacy Policy</span>
          </p>
        </div>
      </div>
    </div>
  );
}

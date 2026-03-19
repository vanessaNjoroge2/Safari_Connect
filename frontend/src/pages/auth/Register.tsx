import type { FormEvent } from 'react';
import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import type { UserRole } from '../../types';

function PwdInput({ placeholder, value, onChange, className }: { placeholder: string; value: string; onChange: (v: string) => void; className?: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="pwd-field">
      <input
        className={`input${className ? ' ' + className : ''}`}
        type={show ? 'text' : 'password'}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
      <button type="button" className="pwd-toggle" onClick={() => setShow(s => !s)} title={show ? 'Hide password' : 'Show password'}>
        {show ? (
          /* Eye-off: password is visible, click to hide */
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
            <line x1="1" y1="1" x2="23" y2="23"/>
          </svg>
        ) : (
          /* Eye: password is hidden, click to show */
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        )}
      </button>
    </div>
  );
}

const ROLE_META: Record<UserRole, { label: string; color: string; icon: string; dashboard: string }> = {
  passenger: { label: 'Passenger',   color: 'var(--brand)', icon: '👤', dashboard: '/passenger/home' },
  owner:     { label: 'SACCO Owner', color: '#3b82f6',      icon: '🏢', dashboard: '/owner/dashboard' },
  admin:     { label: 'Super Admin', color: '#7c3aed',      icon: '🛡️', dashboard: '/admin/dashboard' },
};

interface FormState {
  firstName: string; lastName: string;
  email: string; phone: string;
  idNumber: string;
  password: string; confirmPassword: string;
  agreeTerms: boolean;
  // Owner fields
  saccoName: string; regNumber: string; category: string;
}
type FormErrors = Partial<Record<keyof FormState, string>>;

export default function Register() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const role = (params.get('role') ?? 'passenger') as UserRole;
  const meta = ROLE_META[role] ?? ROLE_META.passenger;
  const { register, isLoading } = useAuth();
  const toast = useToast();

  const [form, setForm] = useState<FormState>({
    firstName: '', lastName: '', email: '', phone: '',
    idNumber: '', password: '', confirmPassword: '', agreeTerms: false,
    saccoName: '', regNumber: '', category: 'bus',
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const set = (k: keyof FormState, v: string | boolean) =>
    setForm(p => ({ ...p, [k]: v }));

  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!form.firstName)   e.firstName = 'Required';
    if (!form.lastName)    e.lastName  = 'Required';
    if (!form.email)       e.email     = 'Required';
    if (!form.phone)       e.phone     = 'Required';
    if (form.password.length < 6)      e.password = 'Minimum 6 characters';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    if (!form.agreeTerms)  e.agreeTerms = 'You must agree to continue';
    if (role === 'owner' && !form.saccoName) e.saccoName = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      await register({
        firstName: form.firstName, lastName: form.lastName,
        email: form.email, phone: form.phone, password: form.password,
        role, idNumber: form.idNumber,
        saccoName: form.saccoName || undefined,
        regNumber: form.regNumber || undefined,
        category: form.category || undefined,
      });
      toast('Account created! Welcome to SafiriConnect 🎉');
      navigate(meta.dashboard);
    } catch {
      toast('Registration failed. Please try again.', 'error');
    }
  };

  return (
    <div className="auth-root">
      {/* Left */}
      <div className="auth-left">
        {/* Top: brand + badge + heading */}
        <div>
          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 36 }}>
            Safiri<span style={{ color: 'var(--brand)' }}>Connect</span>
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.12)', padding: '6px 14px', borderRadius: 99, marginBottom: 18 }}>
            <span>{meta.icon}</span>
            <span style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>New {meta.label} account</span>
          </div>
          <h2 style={{ color: '#fff', fontSize: '1.875rem', lineHeight: 1.25, marginBottom: 12 }}>
            Join SafiriConnect<br />in seconds.
          </h2>
          <p style={{ color: 'rgba(255,255,255,.55)', lineHeight: 1.75, fontSize: 14 }}>
            {role === 'passenger'
              ? 'Create your account and start booking Kenya-wide transport instantly.'
              : role === 'owner'
              ? 'Register your SACCO and start reaching thousands of passengers daily.'
              : 'Admin accounts are provisioned by the platform team.'}
          </p>
        </div>

        {/* Center: logo emblem + features */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28, padding: '8px 0' }}>
          {/* Brand emblem */}
          <div style={{ position: 'relative', width: 120, height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* Outer ring */}
            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '1.5px solid rgba(14,163,113,.25)', animation: 'pulse 3s ease-in-out infinite' }} />
            {/* Mid ring */}
            <div style={{ position: 'absolute', inset: 12, borderRadius: '50%', border: '1.5px solid rgba(14,163,113,.35)' }} />
            {/* Inner filled circle */}
            <div style={{
              position: 'absolute', inset: 24, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--brand), #065f46)',
              boxShadow: '0 0 32px rgba(14,163,113,.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '-.02em' }}>SC</span>
            </div>
          </div>

          {/* Trust features */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%' }}>
            {[
              { icon: '🔒', title: 'Bank-grade security', desc: 'End-to-end encrypted payments' },
              { icon: '📍', title: 'Live GPS tracking',   desc: 'Know where your bus is at all times' },
              { icon: '⚡', title: 'Instant confirmation', desc: 'Ticket in your inbox within seconds' },
            ].map(f => (
              <div key={f.title} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 9,
                  background: 'rgba(14,163,113,.15)',
                  border: '1px solid rgba(14,163,113,.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, flexShrink: 0,
                }}>{f.icon}</div>
                <div>
                  <div style={{ color: '#fff', fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{f.title}</div>
                  <div style={{ color: 'rgba(255,255,255,.4)', fontSize: 12 }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,.4)' }}>
          Already have an account?{' '}
          <Link to={`/auth/login?role=${role}`} style={{ color: 'var(--brand-mid)', fontWeight: 600 }}>Sign in →</Link>
        </p>
      </div>

      {/* Right */}
      <div className="auth-right" style={{ alignItems: 'flex-start' }}>
        <div className="auth-form-box fade-in">
          <div style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: 6 }}>Create your account</h2>
            <p style={{ fontSize: 14, color: 'var(--gray-400)' }}>
              Registering as <strong style={{ color: 'var(--gray-700)' }}>{meta.label}</strong> ·{' '}
              <Link to={`/auth/login?role=${role}`} style={{ color: 'var(--brand)', fontWeight: 600 }}>sign in instead</Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">First name</label>
                <input className={`input${errors.firstName ? ' has-error' : ''}`} placeholder="Jane"
                  value={form.firstName} onChange={e => set('firstName', e.target.value)} />
                {errors.firstName && <span className="form-error">{errors.firstName}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Last name</label>
                <input className={`input${errors.lastName ? ' has-error' : ''}`} placeholder="Mwangi"
                  value={form.lastName} onChange={e => set('lastName', e.target.value)} />
                {errors.lastName && <span className="form-error">{errors.lastName}</span>}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email address</label>
              <input className={`input${errors.email ? ' has-error' : ''}`} type="email" placeholder="jane@example.com"
                value={form.email} onChange={e => set('email', e.target.value)} />
              {errors.email && <span className="form-error">{errors.email}</span>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Phone number</label>
                <input className={`input${errors.phone ? ' has-error' : ''}`} placeholder="07XX XXX XXX"
                  value={form.phone} onChange={e => set('phone', e.target.value)} />
                {errors.phone && <span className="form-error">{errors.phone}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">{role === 'passenger' ? 'National ID' : 'ID / PIN'}</label>
                <input className="input" placeholder="ID number"
                  value={form.idNumber} onChange={e => set('idNumber', e.target.value)} />
              </div>
            </div>

            {role === 'owner' && (
              <>
                <div className="form-group">
                  <label className="form-label">SACCO / Business name</label>
                  <input className={`input${errors.saccoName ? ' has-error' : ''}`} placeholder="Modern Coast Sacco"
                    value={form.saccoName} onChange={e => set('saccoName', e.target.value)} />
                  {errors.saccoName && <span className="form-error">{errors.saccoName}</span>}
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">NTSA registration no.</label>
                    <input className="input" placeholder="NTSA/SACCO/XXXX"
                      value={form.regNumber} onChange={e => set('regNumber', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Service category</label>
                    <select className="select" value={form.category} onChange={e => set('category', e.target.value)}>
                      <option value="bus">Buses (long haul)</option>
                      <option value="matatu">Matatu</option>
                      <option value="motorbike">Motorbike / Boda</option>
                      <option value="carrier">Carrier services</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Password</label>
                <PwdInput placeholder="Min 6 characters" className={errors.password ? 'has-error' : ''} value={form.password} onChange={v => set('password', v)} />
                {errors.password && <span className="form-error">{errors.password}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Confirm password</label>
                <PwdInput placeholder="Repeat password" className={errors.confirmPassword ? 'has-error' : ''} value={form.confirmPassword} onChange={v => set('confirmPassword', v)} />
                {errors.confirmPassword && <span className="form-error">{errors.confirmPassword}</span>}
              </div>
            </div>

            <label className="form-check mb-4">
              <input type="checkbox" checked={form.agreeTerms} onChange={e => set('agreeTerms', e.target.checked)} />
              <span>
                I agree to the{' '}
                <span style={{ color: 'var(--brand)', cursor: 'pointer' }}>Terms of Service</span> and{' '}
                <span style={{ color: 'var(--brand)', cursor: 'pointer' }}>Privacy Policy</span>
              </span>
            </label>
            {errors.agreeTerms && <span className="form-error" style={{ display: 'block', marginBottom: 12 }}>{errors.agreeTerms}</span>}

            <button type="submit" className="btn btn-primary btn-lg btn-full" disabled={isLoading}
              style={{ background: meta.color, borderColor: meta.color }}>
              {isLoading ? 'Creating account…' : `Create ${meta.label} account →`}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

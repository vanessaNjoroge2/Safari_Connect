import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { Steps, MapEmbed } from '../../components/UI';
import { useToast } from '../../hooks/useToast';
import type { DeliverySpeed } from '../../types';

const SPEEDS: { id: DeliverySpeed; icon: string; label: string; price: string; desc: string }[] = [
  { id:'express',   icon:'⚡', label:'Express 2hr',  price:'KES 400–600', desc:'Guaranteed delivery within 2 hours' },
  { id:'sameday',   icon:'📅', label:'Same-day',      price:'KES 200–350', desc:'Delivered by end of business day' },
  { id:'scheduled', icon:'🕐', label:'Scheduled',     price:'KES 150–250', desc:'Pick your preferred time window' },
];

export default function DocumentCourier() {
  const navigate = useNavigate();
  const toast = useToast();
  const [step, setStep] = useState(0);
  const [speed, setSpeed] = useState<DeliverySpeed>('express');
  const [signature, setSignature] = useState(true);
  const sel = SPEEDS.find(s => s.id === speed)!;

  return (
    <DashboardLayout title="✉️ Document Courier" subtitle="Secure delivery of contracts, legal papers, and documents"
      actions={<button className="btn btn-sm" onClick={() => navigate('/carrier')}>← Back</button>}>
      <Steps steps={['Route','Details','Speed','Pay']} current={step} />

      {step === 0 && (
        <div className="grid-2">
          <div className="card">
            <div className="card-title">Pickup & delivery details</div>
            <div className="form-group"><label className="form-label">Pickup address</label><input className="input" defaultValue="Upper Hill, Nairobi" /></div>
            <div className="form-group"><label className="form-label">Pickup contact name</label><input className="input" defaultValue="Jane Mwangi" /></div>
            <div className="form-group"><label className="form-label">Pickup contact phone</label><input className="input" defaultValue="0712 345 678" /></div>
            <div className="divider-line" />
            <div className="form-group"><label className="form-label">Drop-off address</label><input className="input" defaultValue="Westlands, Nairobi" /></div>
            <div className="form-group"><label className="form-label">Recipient name</label><input className="input" placeholder="Full name of recipient" /></div>
            <div className="form-group"><label className="form-label">Recipient phone</label><input className="input" placeholder="07XX XXX XXX" /></div>
            <button className="btn btn-primary btn-lg" onClick={() => setStep(1)}>Next →</button>
          </div>
          <div>
            <MapEmbed
              height={320}
              label="Upper Hill → Westlands · 7.2 km"
              pickup="Upper Hill"
              dropoff="Westlands"
            />
            <div className="card card-sm mt-3">
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:4 }}><span style={{ color:'var(--gray-400)' }}>Distance</span><strong>7.2 km</strong></div>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:13 }}><span style={{ color:'var(--gray-400)' }}>Min delivery time</span><strong style={{ color:'var(--warning)' }}>~25 min (express)</strong></div>
            </div>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="grid-2">
          <div className="card">
            <div className="card-title">Document details</div>
            <div className="form-group"><label className="form-label">Document type</label><select className="select"><option>Legal contracts / agreements</option><option>Government documents</option><option>Medical records</option><option>Financial documents</option><option>Academic certificates</option><option>Passports / IDs</option><option>Other</option></select></div>
            <div className="form-group"><label className="form-label">Number of pages / items</label><input className="input" type="number" placeholder="e.g. 10" /></div>
            <div className="form-group"><label className="form-label">Special instructions</label><textarea className="textarea" placeholder="e.g. Do not fold, deliver to reception only, keep dry…" /></div>
            <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:18 }}>
              <label className="form-check"><input type="checkbox" checked={signature} onChange={e => setSignature(e.target.checked)} /> ✍️ Require recipient signature (digital confirmation sent)</label>
              <label className="form-check"><input type="checkbox" /> 🔒 Confidential — sealed envelope, do not open</label>
              <label className="form-check"><input type="checkbox" /> 📸 Photo proof of delivery required</label>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button className="btn" onClick={() => setStep(0)}>← Back</button>
              <button className="btn btn-primary" style={{ flex:1 }} onClick={() => setStep(2)}>Choose speed →</button>
            </div>
          </div>
          <div className="card">
            <div className="card-title">🔒 Security guarantee</div>
            {[['🛡️','Vetted couriers','All background-checked and ID-verified'],['📱','Live tracking','Track your document in real-time'],['✍️','Digital signature','E-signature confirmation sent instantly'],['📋','Chain of custody','Full audit trail pickup to delivery']].map(([i,t,d]) => (
              <div key={t} style={{ display:'flex', gap:12, marginBottom:14, paddingBottom:14, borderBottom:'1px solid var(--gray-100)' }}>
                <span style={{ fontSize:22 }}>{i}</span>
                <div><div style={{ fontWeight:600, fontSize:13 }}>{t}</div><p className="text-xs text-muted mt-1">{d}</p></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="grid-2">
          <div className="card">
            <div className="card-title">Delivery speed</div>
            {SPEEDS.map(s => (
              <div key={s.id} onClick={() => setSpeed(s.id)}
                style={{ display:'flex', alignItems:'center', gap:16, padding:'16px 18px', border:`2px solid ${speed===s.id?'var(--warning)':'var(--gray-200)'}`, borderRadius:'var(--r-lg)', cursor:'pointer', background:speed===s.id?'var(--warning-light)':'#fff', marginBottom:10, transition:'all .12s' }}>
                <span style={{ fontSize:28 }}>{s.icon}</span>
                <div style={{ flex:1 }}><div style={{ fontWeight:700, fontSize:14 }}>{s.label}</div><p className="text-xs text-muted mt-1">{s.desc}</p></div>
                <div style={{ fontWeight:800, fontSize:15, color:'#92400e' }}>{s.price}</div>
                {speed===s.id && <div style={{ width:22, height:22, background:'var(--warning)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:12 }}>✓</div>}
              </div>
            ))}
            {speed === 'scheduled' && (
              <div className="form-row mt-3">
                <div className="form-group"><label className="form-label">Date</label><input className="input" type="date" /></div>
                <div className="form-group"><label className="form-label">Time window</label><select className="select"><option>8–10 AM</option><option>10 AM–12 PM</option><option>2–4 PM</option><option>4–6 PM</option></select></div>
              </div>
            )}
            <div style={{ display:'flex', gap:8, marginTop:8 }}>
              <button className="btn" onClick={() => setStep(1)}>← Back</button>
              <button className="btn btn-primary" style={{ flex:1 }} onClick={() => setStep(3)}>Review & pay →</button>
            </div>
          </div>
          <div>
            <MapEmbed height={240} pickup="Upper Hill" dropoff="Westlands" />
            <div className="card card-sm mt-3">
              <p className="text-sm font-semibold mb-3">Order summary</p>
              {[['From','Upper Hill'],['To','Westlands'],['Speed',sel.label],['Signature required',signature?'Yes':'No'],['Est. price',sel.price]].map(([l,v]) => (
                <div key={l} style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:6 }}><span style={{ color:'var(--gray-400)' }}>{l}</span><span style={{ fontWeight:600 }}>{v}</span></div>
              ))}
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div style={{ maxWidth:520 }}>
          <div className="card text-center" style={{ padding:'44px 36px' }}>
            <div style={{ fontSize:64, marginBottom:16 }} className="pulse-icon">📱</div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:32, fontWeight:800, marginBottom:6 }}>KES 500</div>
            <p className="text-muted mb-5">{sel.label} · Upper Hill → Westlands</p>
            <div style={{ background:'var(--warning-light)', border:'1px solid #fde68a', borderRadius:'var(--r)', padding:16, marginBottom:22 }}>
              <div style={{ fontWeight:700, color:'#92400e' }}>STK push sent to 0712 345 678</div>
              <div style={{ fontSize:13, color:'#92400e', marginTop:4 }}>Enter your M-Pesa PIN to dispatch courier</div>
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button className="btn btn-ghost btn-full">Resend</button>
              <button className="btn btn-primary btn-full" onClick={() => { toast('Courier dispatched! Track in My Orders.'); navigate('/carrier'); }}>
                Confirm ✓
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

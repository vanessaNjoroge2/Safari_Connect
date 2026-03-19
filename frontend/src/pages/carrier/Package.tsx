import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { Steps, MapEmbed } from '../../components/UI';
import { useToast } from '../../hooks/useToast';
import type { VehicleType } from '../../types';

type PkgSize = 'small' | 'medium' | 'large' | 'custom';

interface VehicleOpt { id: VehicleType; icon: string; label: string; cap: string; price: string; eta: string; color: string; }
const VEHICLES: VehicleOpt[] = [
  { id:'motorbike', icon:'🏍️', label:'Motorbike',   cap:'Up to 10 kg',  price:'KES 250–450',    eta:'15–25 min', color:'var(--brand)' },
  { id:'van',       icon:'🚐', label:'Van / Pickup', cap:'10–200 kg',    price:'KES 800–1,800',  eta:'25–45 min', color:'var(--info)' },
  { id:'truck',     icon:'🚛', label:'Truck',         cap:'200 kg+',      price:'KES 2,500–8,000',eta:'45–90 min', color:'#7c3aed' },
];

export default function PackageDelivery() {
  const navigate = useNavigate();
  const toast = useToast();
  const [step, setStep] = useState(0);
  const [vehicle, setVehicle] = useState<VehicleType>('motorbike');
  const [pkgSize, setPkgSize] = useState<PkgSize>('medium');
  const [fragile, setFragile] = useState(false);
  const [urgent,  setUrgent]  = useState(false);
  const sel = VEHICLES.find(v => v.id === vehicle)!;

  const steps = ['Route', 'Package', 'Vehicle', 'Confirm', 'Pay'];

  return (
    <DashboardLayout title="📦 Package Delivery" subtitle="Same-day delivery with live tracking"
      actions={<button className="btn btn-sm" onClick={() => navigate('/carrier')}>← Back</button>}>
      <Steps steps={steps} current={step} />

      {/* STEP 0 — ROUTE */}
      {step === 0 && (
        <div className="grid-2">
          <div className="card">
            <div className="card-title">Set pickup & drop-off</div>
            <div className="form-group"><label className="form-label">Pickup address</label><input className="input" defaultValue="Nairobi CBD, Tom Mboya St" /></div>
            <div className="form-group"><label className="form-label">Drop-off address</label><input className="input" defaultValue="Karen, Nairobi" /></div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Date</label><input className="input" type="date" /></div>
              <div className="form-group"><label className="form-label">Time</label><input className="input" type="time" defaultValue="10:00" /></div>
            </div>
            <div style={{ background:'var(--brand-light)', borderRadius:'var(--r)', padding:'12px 14px', marginBottom:18 }}>
              {[['Distance','18.4 km'],['Est. travel','34 min'],['Traffic status','🟢 Light traffic']].map(([l,v]) => (
                <div key={l} style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:4 }}>
                  <span style={{ color:'var(--gray-500)' }}>{l}</span><strong>{v}</strong>
                </div>
              ))}
            </div>
            <button className="btn btn-primary btn-lg" onClick={() => setStep(1)}>Confirm route →</button>
          </div>
          <div>
            <p className="text-sm font-semibold mb-2">Route preview — Nairobi CBD → Karen</p>
            <MapEmbed
              height={380}
              label="Pickup (green) and drop-off (red) pins shown on map"
              pickup="Nairobi CBD"
              dropoff="Karen"
            />
          </div>
        </div>
      )}

      {/* STEP 1 — PACKAGE */}
      {step === 1 && (
        <div className="grid-2">
          <div className="card">
            <div className="card-title">Package details</div>
            <div className="form-group">
              <label className="form-label">Package size</label>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                {([['small','📄','Small','Envelope / shoe box'],['medium','📦','Medium','Backpack size'],['large','🗃️','Large','Suitcase size'],['custom','⚖️','Custom','I will specify weight']] as [PkgSize,string,string,string][]).map(([id,ic,l,d]) => (
                  <div key={id} onClick={() => setPkgSize(id)} style={{ padding:'12px 14px', border:`2px solid ${pkgSize===id?'var(--brand)':'var(--gray-200)'}`, borderRadius:'var(--r)', cursor:'pointer', background:pkgSize===id?'var(--brand-light)':'#fff', transition:'all .12s' }}>
                    <div style={{ fontSize:22, marginBottom:4 }}>{ic}</div>
                    <div style={{ fontWeight:700, fontSize:13 }}>{l}</div>
                    <div className="text-xs text-muted">{d}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="form-group"><label className="form-label">Package contents</label><input className="input" placeholder="e.g. Electronics, clothing, documents" /></div>
            <div className="form-group"><label className="form-label">Recipient name</label><input className="input" placeholder="Full name" /></div>
            <div className="form-group"><label className="form-label">Recipient phone</label><input className="input" placeholder="07XX XXX XXX" /></div>
            <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:18 }}>
              <label className="form-check"><input type="checkbox" checked={fragile} onChange={e => setFragile(e.target.checked)} /> ⚠️ Fragile — handle with care</label>
              <label className="form-check"><input type="checkbox" checked={urgent}  onChange={e => setUrgent(e.target.checked)}  /> ⚡ Urgent delivery (+KES 150)</label>
              <label className="form-check"><input type="checkbox" /> ✍️ Signature required on delivery</label>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button className="btn" onClick={() => setStep(0)}>← Back</button>
              <button className="btn btn-primary" style={{ flex:1 }} onClick={() => setStep(2)}>Choose vehicle →</button>
            </div>
          </div>
          <div className="card">
            <div className="card-title">Order summary</div>
            {[['From','Nairobi CBD'],['To','Karen, Nairobi'],['Distance','18.4 km'],['Size',pkgSize.charAt(0).toUpperCase()+pkgSize.slice(1)],['Fragile',fragile?'Yes ⚠️':'No'],['Urgent',urgent?'Yes ⚡ (+KES 150)':'No']].map(([l,v]) => (
              <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'9px 0', borderBottom:'1px solid var(--gray-100)', fontSize:13.5 }}>
                <span style={{ color:'var(--gray-400)' }}>{l}</span><span style={{ fontWeight:600 }}>{v}</span>
              </div>
            ))}
            <div style={{ background:'var(--brand-light)', borderRadius:'var(--r)', padding:'14px 16px', marginTop:16 }}>
              <div style={{ fontWeight:600, color:'var(--brand-dark)', marginBottom:4 }}>🤖 AI estimate</div>
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:24, fontWeight:800, color:'var(--brand)' }}>KES 250 – 800</div>
              <p className="text-xs text-muted mt-2">Final price after selecting vehicle</p>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2 — VEHICLE */}
      {step === 2 && (
        <div className="grid-2">
          <div className="card">
            <div className="card-title">Select vehicle type</div>
            {VEHICLES.map(v => (
              <div key={v.id} onClick={() => setVehicle(v.id)}
                style={{ display:'flex', alignItems:'center', gap:16, padding:'16px 18px', border:`2px solid ${vehicle===v.id?v.color:'var(--gray-200)'}`, borderRadius:'var(--r-lg)', cursor:'pointer', background:vehicle===v.id?`${v.color}0d`:'#fff', marginBottom:10, transition:'all .12s' }}>
                <span style={{ fontSize:34 }}>{v.icon}</span>
                <div style={{ flex:1 }}><div style={{ fontWeight:700, fontSize:14 }}>{v.label}</div><div className="text-xs text-muted mt-2">{v.cap} · ETA {v.eta}</div></div>
                <div style={{ textAlign:'right' }}><div style={{ fontWeight:800, fontSize:15, color:v.color }}>{v.price}</div><div className="text-xs text-muted">estimated</div></div>
                {vehicle===v.id && <div style={{ width:22, height:22, background:v.color, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:12 }}>✓</div>}
              </div>
            ))}
            <div style={{ display:'flex', gap:8, marginTop:8 }}>
              <button className="btn" onClick={() => setStep(1)}>← Back</button>
              <button className="btn btn-primary" style={{ flex:1 }} onClick={() => setStep(3)}>Review order →</button>
            </div>
          </div>
          <div className="card">
            <div className="card-title">Available drivers nearby</div>
            {[['James Odhiambo','4.9','234','4 min','🏍️ Motorbike'],['Peter Waweru','4.7','189','7 min','🏍️ Motorbike'],['Ali Hassan','4.8','312','12 min','🚐 Van']].map(([n,r,t,e,v]) => (
              <div key={n} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom:'1px solid var(--gray-100)' }}>
                <div style={{ width:40, height:40, background:'var(--brand-light)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>👤</div>
                <div style={{ flex:1 }}><div style={{ fontWeight:600, fontSize:13 }}>{n}</div><div className="text-xs text-muted">{v}</div></div>
                <div style={{ textAlign:'right' }}><div style={{ fontSize:12, fontWeight:600 }}>⭐ {r} · {t} trips</div><div style={{ fontSize:11, color:'var(--brand)', fontWeight:600 }}>ETA {e}</div></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STEP 3 — CONFIRM */}
      {step === 3 && (
        <div className="grid-2">
          <div className="card">
            <div style={{ background:'var(--brand)', borderRadius:'var(--r)', padding:'14px 16px', marginBottom:18 }}>
              <div style={{ fontSize:11, color:'rgba(255,255,255,.7)', fontWeight:700, textTransform:'uppercase', marginBottom:4 }}>Delivery route</div>
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:800, color:'#fff' }}>Nairobi CBD → Karen</div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,.8)', marginTop:4 }}>18.4 km · Est. 34 min · {sel.icon} {sel.label}</div>
            </div>
            {[['Vehicle',`${sel.icon} ${sel.label}`],['Package','Medium'],['Fragile',fragile?'Yes':'No'],['Urgent',urgent?'Yes (+KES 150)':'No'],['Total',`KES ${urgent?550:400}`]].map(([l,v]) => (
              <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'9px 0', borderBottom:'1px solid var(--gray-100)', fontSize:13.5 }}>
                <span style={{ color:'var(--gray-400)' }}>{l}</span>
                <span style={{ fontWeight:600, color:l==='Total'?'var(--brand)':undefined }}>{v}</span>
              </div>
            ))}
            <div className="form-group mt-4"><label className="form-label">M-Pesa number</label><input className="input" placeholder="07XX XXX XXX" defaultValue="0712 345 678" /></div>
            <div style={{ display:'flex', gap:8 }}>
              <button className="btn" onClick={() => setStep(2)}>← Back</button>
              <button className="btn btn-primary" style={{ flex:1 }} onClick={() => setStep(4)}>Pay KES {urgent?550:400} →</button>
            </div>
          </div>
          <div>
            <MapEmbed height={260} pickup="Nairobi CBD" dropoff="Karen" />
            <div className="card card-sm mt-3">
              <div style={{ fontSize:11, fontWeight:600, color:'var(--gray-400)', textTransform:'uppercase', marginBottom:6 }}>AI fraud check</div>
              <div style={{ display:'flex', gap:8, alignItems:'center', fontSize:13 }}><span style={{ color:'var(--brand)', fontSize:18 }}>✓</span> Order verified · Trust score 94/100</div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4 — PAY */}
      {step === 4 && (
        <div style={{ maxWidth:520 }}>
          <div className="card text-center" style={{ padding:'44px 36px' }}>
            <div style={{ fontSize:66, marginBottom:20 }} className="pulse-icon">📱</div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:36, fontWeight:800, marginBottom:6 }}>KES {urgent?550:400}</div>
            <p className="text-muted mb-5">STK push sent to <strong>0712 345 678</strong></p>
            <div style={{ background:'var(--warning-light)', border:'1px solid #fde68a', borderRadius:'var(--r)', padding:16, marginBottom:24 }}>
              <div style={{ fontWeight:700, color:'#92400e' }}>Check your phone</div>
              <div style={{ fontSize:13, color:'#92400e', marginTop:4 }}>Enter your M-Pesa PIN to dispatch the driver</div>
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button className="btn btn-ghost btn-full">Resend STK</button>
              <button className="btn btn-primary btn-full" onClick={() => { toast('Payment successful! Driver dispatched 🏍️'); navigate('/carrier/tracking'); }}>
                Simulate success ✓
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

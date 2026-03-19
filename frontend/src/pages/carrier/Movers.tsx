import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { Steps, MapEmbed } from '../../components/UI';
import { useToast } from '../../hooks/useToast';

type MovePkg = 'basic' | 'standard' | 'premium';

const PACKAGES = [
  { id:'basic'    as MovePkg, icon:'🚛', label:'Basic',    price:'KES 4,500 – 8,000',   features:['1 truck','2 movers','Loading & offloading','No packing service'],                           color:'var(--gray-600)' },
  { id:'standard' as MovePkg, icon:'✨', label:'Standard', price:'KES 8,000 – 14,000',  features:['1 large truck','3 movers','Basic packing materials','Furniture disassembly'],              color:'var(--brand)', recommended:true },
  { id:'premium'  as MovePkg, icon:'🏆', label:'Premium',  price:'KES 14,000 – 28,000', features:['Multiple trucks as needed','4–6 movers','Full packing service','Insurance included','Optional cleaning crew'], color:'#7c3aed' },
];

const SPECIAL_ITEMS = ['Piano / Organ','Large TV (60"+)','Fridge / Freezer','Washing Machine','Sofa / Couch','Dining Table','Wardrobe','Safe / Heavy box','Artworks','Gym equipment'];

export default function Movers() {
  const navigate = useNavigate();
  const toast = useToast();
  const [step, setStep] = useState(0);
  const [rooms, setRooms] = useState('2 Bedrooms');
  const [specials, setSpecials] = useState<string[]>([]);
  const [pkg, setPkg] = useState<MovePkg>('standard');
  const [elevator, setElevator] = useState(false);
  const toggle = (item: string) => setSpecials(p => p.includes(item) ? p.filter(i=>i!==item) : [...p,item]);
  const selPkg = PACKAGES.find(p => p.id === pkg)!;

  return (
    <DashboardLayout title="🚛 Movers & Relocation" subtitle="Professional moving for homes, offices, and businesses"
      actions={<button className="btn btn-sm" onClick={() => navigate('/carrier')}>← Back</button>}>
      <Steps steps={['Locations','Inventory','Package','Confirm','Pay']} current={step} />

      {step === 0 && (
        <div className="grid-2">
          <div className="card">
            <div className="card-title">Moving from & to</div>
            <div className="form-group"><label className="form-label">Current address (pickup)</label><input className="input" defaultValue="Ngong Road, Nairobi" /></div>
            <div className="form-group"><label className="form-label">Pickup floor</label><select className="select"><option>Ground floor</option><option>1st floor</option><option>2nd floor</option><option>3rd floor +</option></select></div>
            <div className="form-group"><label className="form-label">New address (drop-off)</label><input className="input" defaultValue="Kilimani, Nairobi" /></div>
            <div className="form-group"><label className="form-label">Drop-off floor</label><select className="select"><option>Ground floor</option><option>1st floor</option><option>2nd floor</option><option>3rd floor +</option></select></div>
            <label className="form-check mb-4"><input type="checkbox" checked={elevator} onChange={e => setElevator(e.target.checked)} /> 🛗 Elevator available at pickup building</label>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Moving date</label><input className="input" type="date" /></div>
              <div className="form-group"><label className="form-label">Start time</label><select className="select"><option>6:00 AM</option><option>7:00 AM</option><option>8:00 AM</option><option>9:00 AM</option></select></div>
            </div>
            <div style={{ background:'var(--info-light)', borderRadius:'var(--r)', padding:'12px 14px', marginBottom:18 }}>
              {[['Distance','8.4 km'],['Est. duration','3–6 hours']].map(([l,v]) => (
                <div key={l} style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:4 }}><span style={{ color:'#1e40af' }}>{l}</span><strong>{v}</strong></div>
              ))}
            </div>
            <button className="btn btn-primary btn-lg" onClick={() => setStep(1)}>Next: Add inventory →</button>
          </div>
          <div>
            <MapEmbed
              height={360}
              label="Route from pickup to new home"
              pickup="Ngong Road"
              dropoff="Kilimani"
            />
            <div className="card card-sm mt-3 text-sm text-muted">
              {elevator ? '✓ No extra floor charges.' : '⚠️ Non-ground floors without elevator may attract extra charge.'}
            </div>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="grid-2">
          <div className="card">
            <div className="card-title">What are you moving?</div>
            <div className="form-group">
              <label className="form-label">Property type</label>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                {['Studio','1 Bedroom','2 Bedrooms','3 Bedrooms','4 Bedrooms','Office'].map(r => (
                  <div key={r} onClick={() => setRooms(r)} style={{ padding:'10px 14px', border:`2px solid ${rooms===r?'var(--brand)':'var(--gray-200)'}`, borderRadius:'var(--r)', cursor:'pointer', background:rooms===r?'var(--brand-light)':'#fff', fontSize:13, fontWeight:rooms===r?600:400, transition:'all .12s' }}>{r}</div>
                ))}
              </div>
            </div>
            <div className="form-group mt-4">
              <label className="form-label">Special / heavy items</label>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                {SPECIAL_ITEMS.map(item => (
                  <label key={item} className="form-check" style={{ padding:'8px 10px', border:`1.5px solid ${specials.includes(item)?'var(--brand)':'var(--gray-200)'}`, borderRadius:'var(--r)', background:specials.includes(item)?'var(--brand-light)':'#fff', fontSize:12, transition:'all .12s' }}>
                    <input type="checkbox" checked={specials.includes(item)} onChange={() => toggle(item)} />{item}
                  </label>
                ))}
              </div>
            </div>
            <div style={{ display:'flex', gap:8, marginTop:8 }}>
              <button className="btn" onClick={() => setStep(0)}>← Back</button>
              <button className="btn btn-primary" style={{ flex:1 }} onClick={() => setStep(2)}>Choose package →</button>
            </div>
          </div>

          <div className="card">
            <div className="card-title">🤖 AI inventory estimate</div>
            <div style={{ background:'var(--brand-light)', borderRadius:'var(--r)', padding:'14px 16px', marginBottom:14 }}>
              <p className="text-xs text-muted mb-3">Based on {rooms} + {specials.length} special items:</p>
              {[['Recommended truck', rooms.includes('4')?'Large truck (8T)':'1.5T van'],['Movers needed',specials.length>3?'4 movers':'2–3 movers'],['Est. move time',rooms==='Studio'?'2–3 hours':'4–6 hours']].map(([l,v]) => (
                <div key={l} style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:6 }}><span style={{ color:'var(--brand-dark)' }}>{l}</span><strong>{v}</strong></div>
              ))}
            </div>
            {specials.length > 0 && (
              <div>
                <p className="text-xs font-semibold mb-2">Selected special items:</p>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  {specials.map(s => <span key={s} className="badge badge-amber">{s}</span>)}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <h3 className="mb-2">Choose your moving package</h3>
          <p className="text-muted text-sm mb-5">All packages include insured transport and professional movers</p>
          <div className="grid-3 mb-5">
            {PACKAGES.map(p => (
              <div key={p.id} onClick={() => setPkg(p.id)}
                style={{ background:'#fff', border:`2px solid ${pkg===p.id?p.color:'var(--gray-200)'}`, borderRadius:'var(--r-xl)', padding:26, cursor:'pointer', position:'relative', transition:'all .15s', boxShadow:pkg===p.id?`0 6px 24px ${p.color}22`:'none' }}>
                {p.recommended && <div style={{ position:'absolute', top:-12, left:'50%', transform:'translateX(-50%)', background:p.color, color:'#fff', fontSize:11, fontWeight:700, padding:'3px 14px', borderRadius:99, whiteSpace:'nowrap' }}>⭐ Recommended</div>}
                <div style={{ fontSize:32, marginBottom:10 }}>{p.icon}</div>
                <h3 style={{ marginBottom:6 }}>{p.label}</h3>
                <div style={{ fontFamily:"'Syne',sans-serif", fontSize:18, fontWeight:800, color:p.color, marginBottom:18 }}>{p.price}</div>
                {p.features.map(f => <div key={f} style={{ display:'flex', gap:8, fontSize:13, marginBottom:8, color:'var(--gray-600)' }}><span style={{ color:p.color, fontWeight:700 }}>✓</span>{f}</div>)}
              </div>
            ))}
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button className="btn" onClick={() => setStep(1)}>← Back</button>
            <button className="btn btn-primary btn-lg" onClick={() => setStep(3)}>Review & confirm →</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="grid-2">
          <div className="card">
            <div style={{ background:'var(--brand)', borderRadius:'var(--r)', padding:'14px 16px', marginBottom:18 }}>
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:800, color:'#fff' }}>Ngong Road → Kilimani</div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,.8)', marginTop:4 }}>8.4 km · {selPkg.label} package</div>
            </div>
            {[['Rooms',rooms],['Special items',specials.length>0?`${specials.slice(0,2).join(', ')}${specials.length>2?` +${specials.length-2} more`:''}` : 'None'],['Package',selPkg.label],['Elevator',elevator?'Yes':'No']].map(([l,v]) => (
              <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'9px 0', borderBottom:'1px solid var(--gray-100)', fontSize:13.5 }}>
                <span style={{ color:'var(--gray-400)' }}>{l}</span><span style={{ fontWeight:600 }}>{v}</span>
              </div>
            ))}
            <div style={{ display:'flex', justifyContent:'space-between', padding:'14px 0', fontSize:16, fontWeight:700 }}>
              <div><div>AI estimate (30% deposit now)</div><p className="text-xs text-muted">Balance paid after move</p></div>
              <span style={{ fontFamily:"'Syne',sans-serif", fontSize:22, color:'var(--brand)' }}>{selPkg.price}</span>
            </div>
            <div className="form-group"><label className="form-label">M-Pesa number</label><input className="input" defaultValue="0712 345 678" /></div>
            <p className="text-sm text-muted mb-4" style={{ background:'var(--gray-50)', borderRadius:'var(--r)', padding:'10px 12px' }}>
              💡 30% deposit confirms your booking. Remaining balance is paid after the move is complete.
            </p>
            <div style={{ display:'flex', gap:8 }}>
              <button className="btn" onClick={() => setStep(2)}>← Back</button>
              <button className="btn btn-primary" style={{ flex:1 }} onClick={() => setStep(4)}>Pay deposit →</button>
            </div>
          </div>
          <div>
            <MapEmbed height={260} pickup="Ngong Road" dropoff="Kilimani" />
            <div className="card card-sm mt-3">
              <p className="text-xs font-semibold mb-3" style={{ color:'var(--gray-400)', textTransform:'uppercase', letterSpacing:'.06em' }}>What happens next</p>
              {['Deposit payment confirms your booking','Movers team lead calls you within 2 hours','Full crew arrives on moving day at agreed time','Final payment after everything is moved in'].map((s,i) => (
                <div key={i} style={{ display:'flex', gap:10, fontSize:13, marginBottom:8, alignItems:'flex-start' }}>
                  <span style={{ width:22, height:22, background:'var(--brand)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:10, fontWeight:700, flexShrink:0 }}>{i+1}</span>
                  <span style={{ color:'var(--gray-600)' }}>{s}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {step === 4 && (
        <div style={{ maxWidth:500 }}>
          <div className="card text-center" style={{ padding:'44px 36px' }}>
            <div style={{ fontSize:64, marginBottom:16 }} className="pulse-icon">📱</div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:30, fontWeight:800, marginBottom:4 }}>KES 2,940</div>
            <p className="text-muted mb-2">30% deposit · {selPkg.label} package</p>
            <p style={{ fontSize:12, color:'var(--brand)', fontWeight:600, marginBottom:22 }}>Balance of ~KES 6,860 paid after completion</p>
            <div style={{ background:'var(--warning-light)', border:'1px solid #fde68a', borderRadius:'var(--r)', padding:14, marginBottom:22 }}>
              <div style={{ fontWeight:700, color:'#92400e' }}>STK push sent to 0712 345 678</div>
              <div style={{ fontSize:13, color:'#92400e', marginTop:4 }}>Enter your PIN to confirm deposit and lock your moving date</div>
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button className="btn btn-ghost btn-full">Resend</button>
              <button className="btn btn-primary btn-full" onClick={() => { toast('Moving booked! Our team will call you within 2 hours.'); navigate('/carrier'); }}>
                Confirm ✓
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

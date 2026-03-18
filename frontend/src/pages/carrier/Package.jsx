import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MapView from '../../components/MapView';
import { Steps, AiBanner } from '../../components/UI';

const VEHICLE_TYPES = [
  { id: 'motorbike', icon: '🏍️', label: 'Motorbike', cap: 'Up to 10 kg', price: 'KES 250–450', eta: '15–25 min', color: '#0ea371' },
  { id: 'van', icon: '🚐', label: 'Van / Pickup', cap: '10–200 kg', price: 'KES 800–1,800', eta: '25–45 min', color: '#3b82f6' },
  { id: 'truck', icon: '🚛', label: 'Truck', cap: '200 kg+', price: 'KES 2,500–8,000', eta: '45–90 min', color: '#8b5cf6' },
];

const PACKAGE_SIZES = [
  { id: 'small', label: 'Small', desc: 'Envelope / shoe box', icon: '📄' },
  { id: 'medium', label: 'Medium', desc: 'Backpack size', icon: '📦' },
  { id: 'large', label: 'Large', desc: 'Suitcase size', icon: '🗃️' },
  { id: 'custom', label: 'Custom', desc: 'I will specify weight', icon: '⚖️' },
];

// Nairobi locations
const LOCATIONS = {
  pickup: { lat: -1.2864, lng: 36.8172, label: 'Pickup', color: '#0ea371', popup: 'Pickup: Nairobi CBD' },
  dropoff: { lat: -1.3031, lng: 36.7073, label: 'Drop-off', color: '#ef4444', popup: 'Drop-off: Karen' },
};

const ROUTE = [
  [-1.2864, 36.8172],
  [-1.2921, 36.8000],
  [-1.2980, 36.7700],
  [-1.3031, 36.7073],
];

export default function PackageDelivery() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [vehicle, setVehicle] = useState('motorbike');
  const [pkgSize, setPkgSize] = useState('medium');
  const [fragile, setFragile] = useState(false);
  const [urgent, setUrgent] = useState(false);

  const steps = ['Route', 'Package', 'Vehicle', 'Confirm', 'Pay'];
  const sel = VEHICLE_TYPES.find(v => v.id === vehicle);

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">📦 Package Delivery</div>
          <div className="page-sub">Same-day delivery across Nairobi and beyond</div>
        </div>
        <div className="page-actions">
          <button className="btn btn-sm" onClick={() => navigate('/carrier')}>← Back</button>
        </div>
      </div>

      <div className="page-body">
        <Steps steps={steps} current={step} />

        {/* STEP 0 — ROUTE */}
        {step === 0 && (
          <div className="two-col">
            <div>
              <div className="card" style={{ marginBottom: 14 }}>
                <div className="card-title">📍 Set your route</div>
                <div className="form-group">
                  <label className="form-label">Pickup location</label>
                  <input className="form-input" defaultValue="Nairobi CBD, Tom Mboya St" />
                </div>
                <div className="form-group">
                  <label className="form-label">Drop-off location</label>
                  <input className="form-input" defaultValue="Karen, Nairobi" />
                </div>
                <div className="form-group">
                  <label className="form-label">Pickup date & time</label>
                  <div className="form-row">
                    <input className="form-input" type="date" />
                    <input className="form-input" type="time" defaultValue="10:00" />
                  </div>
                </div>
                <div style={{ background: 'var(--green-light)', borderRadius: 10, padding: '12px 14px', fontSize: 13, marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ color: 'var(--gray-600)' }}>Distance</span><strong>18.4 km</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ color: 'var(--gray-600)' }}>Est. travel time</span><strong>34 min</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--gray-600)' }}>AI traffic status</span><strong style={{ color: 'var(--green-dark)' }}>Light traffic ✓</strong>
                  </div>
                </div>
                <button className="btn btn-primary btn-full" onClick={() => setStep(1)}>Confirm route →</button>
              </div>
            </div>
            <div>
              <div style={{ marginBottom: 8, fontWeight: 600, fontSize: 13 }}>Route preview</div>
              <MapView
                height={420}
                markers={[LOCATIONS.pickup, LOCATIONS.dropoff]}
                route={ROUTE}
                center={[-1.295, 36.762]}
                zoom={12}
              />
              <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 10, height: 10, background: '#0ea371', borderRadius: '50%', display: 'inline-block' }} />Pickup</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 10, height: 10, background: '#ef4444', borderRadius: '50%', display: 'inline-block' }} />Drop-off</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 20, height: 3, background: '#0ea371', display: 'inline-block', borderRadius: 2 }} />Route</div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 1 — PACKAGE DETAILS */}
        {step === 1 && (
          <div className="two-col">
            <div className="card">
              <div className="card-title">📦 Package details</div>
              <div style={{ marginBottom: 14 }}>
                <div className="form-label" style={{ marginBottom: 8 }}>Package size</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {PACKAGE_SIZES.map(p => (
                    <div
                      key={p.id}
                      onClick={() => setPkgSize(p.id)}
                      style={{
                        padding: '14px 16px',
                        border: `2px solid ${pkgSize === p.id ? 'var(--green)' : 'var(--gray-200)'}`,
                        borderRadius: 10,
                        cursor: 'pointer',
                        background: pkgSize === p.id ? 'var(--green-light)' : '#fff',
                        transition: 'all .12s',
                      }}
                    >
                      <div style={{ fontSize: 22, marginBottom: 4 }}>{p.icon}</div>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{p.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{p.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
              {pkgSize === 'custom' && (
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Weight (kg)</label><input className="form-input" type="number" placeholder="e.g. 15" /></div>
                  <div className="form-group"><label className="form-label">Dimensions (cm)</label><input className="form-input" placeholder="L × W × H" /></div>
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Package description</label>
                <input className="form-input" placeholder="e.g. Electronics, clothing, food items..." />
              </div>
              <div className="form-group">
                <label className="form-label">Recipient name</label>
                <input className="form-input" placeholder="Full name" />
              </div>
              <div className="form-group">
                <label className="form-label">Recipient phone</label>
                <input className="form-input" placeholder="07XX XXX XXX" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13 }}>
                  <input type="checkbox" checked={fragile} onChange={e => setFragile(e.target.checked)} style={{ width: 16, height: 16 }} />
                  <span>⚠️ Fragile — handle with care</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13 }}>
                  <input type="checkbox" checked={urgent} onChange={e => setUrgent(e.target.checked)} style={{ width: 16, height: 16 }} />
                  <span>⚡ Urgent — prioritise delivery (+KES 150)</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13 }}>
                  <input type="checkbox" style={{ width: 16, height: 16 }} />
                  <span>✍️ Signature required on delivery</span>
                </label>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn" onClick={() => setStep(0)}>← Back</button>
                <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setStep(2)}>Choose vehicle →</button>
              </div>
            </div>
            <div className="card">
              <div className="card-title">Order so far</div>
              <div style={{ fontSize: 13, display: 'flex', flexDirection: 'column', gap: 9 }}>
                {[['From', 'Nairobi CBD'], ['To', 'Karen, Nairobi'], ['Distance', '18.4 km'], ['Size', PACKAGE_SIZES.find(p => p.id === pkgSize)?.label || '—'], ['Fragile', fragile ? 'Yes' : 'No'], ['Urgent', urgent ? 'Yes (+KES 150)' : 'No']].map(([l, v]) => (
                  <div key={l} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid var(--gray-100)' }}>
                    <span style={{ color: 'var(--gray-400)' }}>{l}</span>
                    <span style={{ fontWeight: 600 }}>{v}</span>
                  </div>
                ))}
              </div>
              <div style={{ background: 'var(--green-light)', borderRadius: 10, padding: '12px 14px', marginTop: 16, fontSize: 13 }}>
                <div style={{ fontWeight: 600, marginBottom: 4, color: 'var(--green-dark)' }}>🤖 AI price estimate</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--green)', fontFamily: "'Syne',sans-serif" }}>KES 250 – 800</div>
                <div style={{ fontSize: 11, color: 'var(--gray-500)', marginTop: 2 }}>Final price after selecting vehicle</div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2 — VEHICLE SELECTION */}
        {step === 2 && (
          <div className="two-col">
            <div>
              <div className="card" style={{ marginBottom: 14 }}>
                <div className="card-title">🚗 Select vehicle type</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {VEHICLE_TYPES.map(v => (
                    <div
                      key={v.id}
                      onClick={() => setVehicle(v.id)}
                      style={{
                        padding: '16px 18px',
                        border: `2px solid ${vehicle === v.id ? v.color : 'var(--gray-200)'}`,
                        borderRadius: 12,
                        cursor: 'pointer',
                        background: vehicle === v.id ? `${v.color}11` : '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 16,
                        transition: 'all .12s',
                      }}
                    >
                      <span style={{ fontSize: 32 }}>{v.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{v.label}</div>
                        <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 2 }}>{v.cap} · ETA {v.eta}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 800, fontSize: 15, color: v.color }}>{v.price}</div>
                        <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>estimated</div>
                      </div>
                      {vehicle === v.id && <div style={{ width: 20, height: 20, background: v.color, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12 }}>✓</div>}
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                  <button className="btn" onClick={() => setStep(1)}>← Back</button>
                  <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setStep(3)}>Review order →</button>
                </div>
              </div>
            </div>
            <div>
              <div className="card" style={{ marginBottom: 14 }}>
                <div className="card-title">Available drivers nearby</div>
                {[
                  { name: 'James Odhiambo', rating: 4.9, trips: 234, eta: '4 min', vehicle: 'Motorbike · KDA 123B', color: '#0ea371' },
                  { name: 'Peter Waweru', rating: 4.7, trips: 189, eta: '7 min', vehicle: 'Motorbike · KDB 456C', color: '#0ea371' },
                  { name: 'Ali Hassan', rating: 4.8, trips: 312, eta: '12 min', vehicle: 'Van · KCA 789D', color: '#3b82f6' },
                ].map(d => (
                  <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--gray-100)' }}>
                    <div style={{ width: 40, height: 40, background: `${d.color}22`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>👤</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{d.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{d.vehicle}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>⭐ {d.rating} · {d.trips} trips</div>
                      <div style={{ fontSize: 11, color: d.color, fontWeight: 600 }}>ETA {d.eta}</div>
                    </div>
                  </div>
                ))}
              </div>
              <MapView height={220} markers={[LOCATIONS.pickup, LOCATIONS.dropoff]} route={ROUTE} center={[-1.295, 36.762]} zoom={12} />
            </div>
          </div>
        )}

        {/* STEP 3 — CONFIRM */}
        {step === 3 && (
          <div className="two-col">
            <div className="card">
              <div className="card-title">📋 Order summary</div>
              <div style={{ background: 'var(--green)', borderRadius: 10, padding: '14px 16px', marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.7)', marginBottom: 4 }}>DELIVERY ROUTE</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', fontFamily: "'Syne',sans-serif" }}>Nairobi CBD → Karen</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,.8)', marginTop: 4 }}>18.4 km · Est. 34 min</div>
              </div>
              {[['Vehicle', `${sel?.icon} ${sel?.label}`], ['Package size', 'Medium'], ['Fragile', fragile ? 'Yes ⚠️' : 'No'], ['Urgent', urgent ? 'Yes ⚡' : 'No'], ['Recipient', 'David Ochieng'], ['Phone', '0722 111 222']].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '8px 0', borderBottom: '1px solid var(--gray-100)' }}>
                  <span style={{ color: 'var(--gray-400)' }}>{l}</span><span style={{ fontWeight: 600 }}>{v}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700, margin: '12px 0', padding: '12px 0', borderTop: '2px solid var(--gray-200)' }}>
                <span>Total</span>
                <span style={{ color: 'var(--green)', fontFamily: "'Syne',sans-serif", fontSize: 20 }}>KES {urgent ? 550 : 400}</span>
              </div>
              <div className="form-group">
                <label className="form-label">M-Pesa phone number</label>
                <input className="form-input" placeholder="07XX XXX XXX" defaultValue="0712 345 678" />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn" onClick={() => setStep(2)}>← Back</button>
                <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setStep(4)}>Pay via M-Pesa →</button>
              </div>
            </div>
            <div>
              <MapView height={300} markers={[LOCATIONS.pickup, LOCATIONS.dropoff]} route={ROUTE} center={[-1.295, 36.762]} zoom={12} />
              <div className="card card-sm" style={{ marginTop: 14 }}>
                <div style={{ fontSize: 11, color: 'var(--gray-400)', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase' }}>AI fraud check</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ color: 'var(--green)', fontSize: 18 }}>✓</span>
                  <div><div style={{ fontSize: 13, fontWeight: 600 }}>Order verified · Trust score 94/100</div><div style={{ fontSize: 11, color: 'var(--gray-400)' }}>No suspicious activity detected</div></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4 — PAYMENT + TRACKING */}
        {step === 4 && (
          <div className="two-col">
            <div className="card">
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: 56, marginBottom: 14 }} className="pulse">📱</div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 28, fontWeight: 800, marginBottom: 6 }}>KES 400</div>
                <div style={{ fontSize: 13, color: 'var(--gray-400)', marginBottom: 20 }}>STK push sent to <strong>0712 345 678</strong></div>
                <div style={{ background: 'var(--amber-light)', borderRadius: 10, padding: 14, marginBottom: 20, border: '1px solid #fcd34d' }}>
                  <div style={{ fontSize: 13, color: '#92400e', fontWeight: 700 }}>Waiting for M-Pesa PIN…</div>
                  <div style={{ fontSize: 12, color: '#92400e', marginTop: 4 }}>Enter your PIN on your phone to dispatch driver</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn" style={{ flex: 1, justifyContent: 'center' }}>Resend</button>
                  <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => navigate('/carrier/track/PKG-2026-001')}>Payment success → Track</button>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="card-title">Order details</div>
              {[['Order ID', 'PKG-2026-001'], ['From', 'Nairobi CBD'], ['To', 'Karen'], ['Vehicle', `${sel?.icon} ${sel?.label}`], ['Status', 'Awaiting payment']].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '7px 0', borderBottom: '1px solid var(--gray-100)' }}>
                  <span style={{ color: 'var(--gray-400)' }}>{l}</span><span style={{ fontWeight: 600 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

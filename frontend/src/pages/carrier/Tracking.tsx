import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { MapEmbed } from '../../components/UI';
import { useLiveGpsTracking } from '../../hooks/useLiveGpsTracking';

const STATUS_STEPS = ['Order confirmed','Driver assigned','Package picked up','En route to drop-off','Delivered'];

export default function LiveTracking() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [eta,      setEta]      = useState(28);

  const tracking = useLiveGpsTracking({
    start: { lat: -1.286389, lon: 36.817223 },
    end: { lat: -1.319, lon: 36.707 },
    simulateStep: 0.16,
    simulateIntervalMs: 3500,
  });

  useEffect(() => {
    const t = setInterval(() => {
      setProgress(p => {
        if (p >= 4) { clearInterval(t); return 4; }
        setEta(e => Math.max(0, e - 7));
        return p + 1;
      });
    }, 4000);
    return () => clearInterval(t);
  }, []);

  const bannerColors = ['var(--info)','var(--info)','var(--brand)','var(--warning)','var(--brand)'];
  const bannerLabels = ['📦 Order confirmed','🏍️ Driver assigned','📦 Package collected','🚀 Driver en route','✅ Delivered!'];

  return (
    <DashboardLayout title="📡 Live Tracking" subtitle="Order PKG-2026-001 · Nairobi CBD → Karen"
      actions={<button className="btn btn-sm" onClick={() => navigate('/carrier')}>← Back</button>}>
      {/* Status banner */}
      <div style={{ background:bannerColors[progress], borderRadius:'var(--r-lg)', padding:'14px 20px', marginBottom:24, display:'flex', alignItems:'center', gap:16 }}>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:800, color:'#fff' }}>{bannerLabels[progress]}</div>
          <div style={{ fontSize:13, color:'rgba(255,255,255,.85)', marginTop:3 }}>
            {['Waiting for driver allocation','Your driver is heading to pickup','Package in hand, en route to Karen','Almost there!','Your delivery is complete.'][progress]}
          </div>
        </div>
        {progress < 4 && (
          <div style={{ background:'rgba(255,255,255,.2)', borderRadius:'var(--r)', padding:'10px 20px', textAlign:'center' }}>
            <div style={{ fontFamily:"'Syne',sans-serif", fontSize:28, fontWeight:800, color:'#fff' }}>{eta}</div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,.8)' }}>min ETA</div>
          </div>
        )}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'minmax(0,2fr) minmax(0,1fr)', gap:18 }}>
        {/* Map */}
        <div>
          <MapEmbed
            height={460}
            label="Driver position updates every 4 seconds in production"
            pickup="Nairobi CBD"
            dropoff="Karen"
            livePosition={tracking.position}
          />
          <p className="text-xs text-muted mt-2">
            🟢 Pickup · 🔴 Drop-off · 🟡 Driver ({tracking.position.source === 'gps' ? 'live GPS' : 'simulated fallback'})
          </p>
          <div className="card" style={{ marginTop: 10, padding: '10px 12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 12 }}>
              <span style={{ color: 'var(--gray-500)' }}>Tracker status</span>
              <strong>{tracking.position.source === 'gps' ? 'GPS active' : 'Simulation active'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 12, marginTop: 6 }}>
              <span style={{ color: 'var(--gray-500)' }}>Coordinates</span>
              <strong>{tracking.position.lat.toFixed(5)}, {tracking.position.lon.toFixed(5)}</strong>
            </div>
            {typeof tracking.position.accuracy === 'number' && (
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 12, marginTop: 6 }}>
                <span style={{ color: 'var(--gray-500)' }}>Accuracy</span>
                <strong>{Math.round(tracking.position.accuracy)}m</strong>
              </div>
            )}
            {tracking.trackingError && (
              <div style={{ marginTop: 8, fontSize: 12, color: 'var(--warning)' }}>{tracking.trackingError}</div>
            )}
          </div>
        </div>

        {/* Side panel */}
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div className="card">
            <div className="card-title">Your driver</div>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
              <div style={{ width:52, height:52, background:'var(--brand-light)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24 }}>👤</div>
              <div><div style={{ fontWeight:700, fontSize:15 }}>James Odhiambo</div><div className="text-xs text-muted">⭐ 4.9 · 234 deliveries</div></div>
            </div>
            {[['Vehicle','🏍️ Motorbike'],['Plate','KDA 123B']].map(([l,v]) => (
              <div key={l} style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:6 }}>
                <span style={{ color:'var(--gray-400)' }}>{l}</span><strong>{v}</strong>
              </div>
            ))}
            <div style={{ display:'flex', gap:8, marginTop:14 }}>
              <button className="btn btn-sm" style={{ flex:1, justifyContent:'center' }}>📞 Call</button>
              <button className="btn btn-sm" style={{ flex:1, justifyContent:'center' }}>💬 Message</button>
            </div>
          </div>

          <div className="card">
            <div className="card-title">Delivery progress</div>
            {STATUS_STEPS.map((s, i) => (
              <div key={s} style={{ display:'flex', gap:10, alignItems:'center', padding:'8px 0', borderBottom: i < 4 ? '1px solid var(--gray-100)' : 'none' }}>
                <div style={{ width:24, height:24, borderRadius:'50%', background: i<=progress?'var(--brand)':'var(--gray-200)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, color: i<=progress?'#fff':'var(--gray-400)', fontWeight:700, flexShrink:0 }}>
                  {i <= progress ? '✓' : i + 1}
                </div>
                <span style={{ fontSize:13, color: i<=progress?'var(--gray-900)':'var(--gray-400)', fontWeight: i===progress?600:400 }}>{s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

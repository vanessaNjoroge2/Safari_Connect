import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { AiBanner, AiAgentPanel } from '../../components/UI';
import { useAuth } from '../../context/AuthContext';

export default function PassengerHome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const firstName = user?.name?.split(' ')[0] ?? 'there';

  const transportCats = [
    { id: 'bus',       icon: '🚌', name: 'Buses',      desc: 'Long-distance · AC · Comfortable',  path: '/passenger/search?cat=bus' },
    { id: 'matatu',    icon: '🚐', name: 'Matatu',     desc: 'City & town routes',                path: '/passenger/search?cat=matatu' },
    { id: 'motorbike', icon: '🏍️', name: 'Motorbikes', desc: 'Fast · Last mile · Boda boda',      path: '/passenger/search?cat=motorbike' },
  ];

  const otherServices = [
    { id: 'package', icon: '📦', name: 'Package Delivery',   desc: 'Send parcels countrywide with GPS tracking', color: 'var(--brand)',   path: '/carrier/package' },
    { id: 'movers',  icon: '🚛', name: 'Movers & Relocation', desc: 'Home or office moves with instant AI quote',  color: 'var(--info)',    path: '/carrier/movers' },
    { id: 'courier', icon: '✉️', name: 'Document Courier',   desc: 'Secure delivery with digital signature',      color: 'var(--warning)', path: '/carrier/courier' },
  ];

  const popular = [
    { from: 'Nairobi', to: 'Nakuru',  from_price: 'From KES 850',   trips: 4 },
    { from: 'Nairobi', to: 'Mombasa', from_price: 'From KES 1,500', trips: 2 },
    { from: 'Nairobi', to: 'Kisumu',  from_price: 'From KES 1,100', trips: 3 },
    { from: 'Nairobi', to: 'Eldoret', from_price: 'From KES 900',   trips: 2 },
    { from: 'Thika',   to: 'Nairobi', from_price: 'From KES 200',   trips: 8 },
    { from: 'Kisumu',  to: 'Nairobi', from_price: 'From KES 1,100', trips: 3 },
  ];

  return (
    <DashboardLayout title="Home" subtitle="What would you like to book today?"
      actions={<button className="btn btn-primary btn-sm" onClick={() => navigate('/passenger/search')}>Search trips</button>}>

      <AiBanner
        text={`<strong>Good morning, ${firstName}!</strong> Nairobi → Nakuru is your top route. Next departure in 42 min — 14 seats left.`}
        action={<button className="btn btn-primary btn-sm" onClick={() => navigate('/passenger/search')}>Quick book →</button>}
      />

      {/* Transport categories */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h3 style={{ margin: 0 }}>Transport categories</h3>
      </div>
      <div className="grid-3 mb-6">
        {transportCats.map(c => (
          <div key={c.id} className="card card-hover" onClick={() => navigate(c.path)}>
            <div style={{ fontSize: 38, marginBottom: 12 }}>{c.icon}</div>
            <h4 style={{ marginBottom: 4 }}>{c.name}</h4>
            <p className="text-sm text-muted mb-4">{c.desc}</p>
            <span className="btn btn-outline btn-sm">Browse →</span>
          </div>
        ))}
      </div>

      {/* AI Agent Panel */}
      <AiAgentPanel
        title="AI Travel Assistant"
        subtitle="Autonomous decisions to help you travel smarter"
        cols={3}
        cards={[
          {
            type: 'Trip Recommendation',
            icon: '🎯',
            result: 'Nairobi → Nakuru · 8:00 AM',
            detail: 'Ranked #1 of 4 trips — lowest fare, highest reliability score. 14 seats remaining.',
            confidence: 94,
            actionLabel: 'Book this trip',
            onAction: () =>
              navigate(
                '/passenger/search?cat=bus&from=Nairobi&to=Nakuru&auto=1'
              ),
            accentColor: 'var(--brand)',
          },
          {
            type: 'Dynamic Pricing Insight',
            icon: '📈',
            result: 'Fare may rise +12% by evening',
            detail: 'Current demand: High. Suggest booking before 2 PM to lock in KES 850 fare.',
            confidence: 81,
            accentColor: '#f59e0b',
          },
          {
            type: 'Delay Risk Prediction',
            icon: '⏱️',
            result: 'Low delay risk — 8 min avg',
            detail: 'Clear weather on Nakuru highway. Route risk score: 14/100. Safe to proceed.',
            confidence: 88,
            accentColor: '#3b82f6',
          },
        ]}
      />

      {/* Other Services */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h3 style={{ margin: 0 }}>Other services</h3>
          <p className="text-sm text-muted" style={{ marginTop: 4 }}>Carrier services for packages, moves, and documents</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/carrier')}>View all →</button>
      </div>
      <div className="grid-3 mb-6">
        {otherServices.map(s => (
          <div key={s.id}
            className="card card-hover"
            onClick={() => navigate(s.path)}
            style={{ borderLeft: `3px solid ${s.color}` }}>
            <div style={{ fontSize: 30, marginBottom: 10 }}>{s.icon}</div>
            <h4 style={{ marginBottom: 4 }}>{s.name}</h4>
            <p className="text-sm text-muted">{s.desc}</p>
          </div>
        ))}
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-title">Popular routes today</div>
          {popular.map(r => (
            <div key={r.from + r.to}
              onClick={() => navigate(`/passenger/search?from=${r.from}&to=${r.to}`)}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--gray-100)', cursor: 'pointer', transition: 'all .12s' }}
              onMouseEnter={e => (e.currentTarget.style.paddingLeft = '6px')}
              onMouseLeave={e => (e.currentTarget.style.paddingLeft = '0')}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{r.from} → {r.to}</div>
                <div className="text-xs text-muted mt-2">{r.from_price} · {r.trips} trips/day</div>
              </div>
              <span style={{ color: 'var(--brand)', fontSize: 13, fontWeight: 600 }}>Book →</span>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="card-title">Recent bookings</div>
          {[
            { route: 'Nairobi → Nakuru',  date: 'Wed 18 Mar 2026', status: 'Upcoming',  v: 'amber' as const },
            { route: 'Nairobi → Mombasa', date: 'Sat 20 Mar 2026', status: 'Confirmed', v: 'green' as const },
            { route: 'Nairobi → Kisumu',  date: 'Mon 10 Mar 2026', status: 'Completed', v: 'gray'  as const },
          ].map(t => (
            <div key={t.route + t.date}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 0', borderBottom: '1px solid var(--gray-100)' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{t.route}</div>
                <div className="text-xs text-muted mt-2">{t.date}</div>
              </div>
              <span className={`badge badge-${t.v}`}>{t.status}</span>
            </div>
          ))}
          <button className="btn btn-ghost btn-sm mt-4" onClick={() => navigate('/passenger/mybookings')}>
            View all bookings →
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}

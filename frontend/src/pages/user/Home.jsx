import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AiBanner, Modal } from '../../components/UI';
import { requestSafe } from '../../lib/api';

export default function UserHome() {
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [tripType, setTripType] = useState('one');
  const [from, setFrom] = useState('Nairobi CBD');
  const [to, setTo] = useState('Nakuru');
  const [travelDate, setTravelDate] = useState('');
  const [travelTime, setTravelTime] = useState('08:00');
  const [aiText, setAiText] = useState('<strong>Good morning, Jane!</strong> Based on your history, Nairobi → Nakuru is your top route. Next departure in 42 minutes — 14 seats left.');

  const cats = [
    { id: 'bus', icon: '🚌', name: 'Buses', desc: 'Long-distance · AC · Comfortable' },
    { id: 'matatu', icon: '🚐', name: 'Matatu', desc: 'City & town routes' },
    { id: 'motorbike', icon: '🏍️', name: 'Motorbikes', desc: 'Fast · Last mile · Boda boda' },
    { id: 'carrier', icon: '🚚', name: 'Carrier Services', desc: 'Packages · Moving · Documents' },
  ];

  const handleBrowse = (catId) => {
    if (catId === 'carrier') {
      navigate('/carrier');
    } else {
      setSearchOpen(true);
    }
  };

  const runAiHint = async () => {
    const response = await requestSafe('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({
        text: `Share one short travel tip for ${from} to ${to} around ${travelTime}`,
        language: 'en'
      })
    });

    const message = response?.data?.message || response?.message;
    if (message) {
      setAiText(`<strong>AI tip:</strong> ${message}`);
    }
  };

  const submitSearch = async () => {
    setSearchOpen(false);
    await runAiHint();
    navigate('/user/results', {
      state: {
        origin: from,
        destination: to,
        date: travelDate,
        time: travelTime,
        tripType
      }
    });
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Find your trip</div>
        <div className="page-actions">
          <button className="btn btn-sm" onClick={() => navigate('/user/mybookings')}>My bookings</button>
        </div>
      </div>
      <div className="page-body">
        <AiBanner
          text={aiText}
          action={<button className="btn btn-primary btn-sm" onClick={submitSearch}>Quick book →</button>}
        />

        {/* Transport Categories */}
        <div className="section-title">Transport categories</div>
        <div className="cat-grid">
          {cats.map(c => (
            <div key={c.id} className="cat-card">
              <div className="cat-icon">{c.icon}</div>
              <div className="cat-name">{c.name}</div>
              <div className="cat-desc">{c.desc}</div>
              <button className="btn-browse" onClick={() => handleBrowse(c.id)}>
                Browse →
              </button>
            </div>
          ))}
        </div>

        {/* Popular routes */}
        <div className="section-title" style={{ marginTop: 8 }}>Popular routes today</div>
        <div className="three-col" style={{ marginBottom: 24 }}>
          {[['Nairobi → Nakuru', 'From KES 850 · 4 trips'], ['Nairobi → Mombasa', 'From KES 1,500 · 2 trips'], ['Nairobi → Kisumu', 'From KES 1,100 · 3 trips']].map(([r, s]) => (
            <div
              key={r}
              className="card card-sm"
              style={{ cursor: 'pointer' }}
              onClick={() => {
                const [origin, destination] = r.split(' → ');
                navigate('/user/results', { state: { origin, destination, date: travelDate, time: travelTime, tripType } });
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 14 }}>{r}</div>
              <div style={{ fontSize: 11, color: 'var(--green)', marginTop: 3 }}>{s}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Search trips modal */}
      <Modal open={searchOpen} onClose={() => setSearchOpen(false)} title="🔍 Search trips">
        <div className="form-row">
          <div className="form-group"><label className="form-label">From</label><input className="form-input" value={from} onChange={(event) => setFrom(event.target.value)} /></div>
          <div className="form-group"><label className="form-label">To</label><input className="form-input" value={to} onChange={(event) => setTo(event.target.value)} placeholder="Destination" /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Travel date</label><input className="form-input" type="date" value={travelDate} onChange={(event) => setTravelDate(event.target.value)} /></div>
          <div className="form-group"><label className="form-label">Travel time</label><input className="form-input" type="time" value={travelTime} onChange={(event) => setTravelTime(event.target.value)} /></div>
        </div>
        <div className="form-group">
          <label className="form-label">Trip type</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className={`btn btn-sm${tripType === 'one' ? ' btn-primary' : ''}`} onClick={() => setTripType('one')}>One-way</button>
            <button className={`btn btn-sm${tripType === 'two' ? ' btn-primary' : ''}`} onClick={() => setTripType('two')}>Two-way</button>
          </div>
        </div>
        {tripType === 'two' && (
          <div className="form-row">
            <div className="form-group"><label className="form-label">Return date</label><input className="form-input" type="date" /></div>
            <div className="form-group"><label className="form-label">Return time</label><input className="form-input" type="time" defaultValue="14:00" /></div>
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setSearchOpen(false)}>Cancel</button>
          <button className="btn btn-primary" style={{ flex: 2, justifyContent: 'center' }} onClick={submitSearch}>Search trips →</button>
        </div>
      </Modal>
    </div>
  );
}
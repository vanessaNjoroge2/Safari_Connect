import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AiBanner, Badge } from '../../components/UI';
import { requestSafe } from '../../lib/api';

const buses = [
  { sacco:'Modern Coast Sacco', plate:'KBZ 123A · 50 seats · ⭐ 4.8', price:'KES 1,050', priceLabel:'AI dynamic price', dep:'8:00 AM', arr:'11:30 AM', dur:'3h 30m', seats:18, classes:['Economy','Business','VIP'], left:'green', priceNum:1050 },
  { sacco:'Easy Coach Sacco', plate:'KCA 456B · 50 seats · ⭐ 4.6', price:'KES 850', priceLabel:'Standard fare', dep:'10:00 AM', arr:'1:30 PM', dur:'3h 30m', seats:4, classes:['Economy','Business'], left:'amber', priceNum:850 },
  { sacco:'Eldoret Express', plate:'KDB 789C · 33 seats · ⭐ 4.3', price:'KES 780', priceLabel:'Budget fare', dep:'2:00 PM', arr:'5:45 PM', dur:'3h 45m', seats:27, classes:['Economy'], left:'green', dim:true, priceNum:780 },
];

export default function Results() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchSacco, setSearchSacco] = useState('');
  const [maxPrice, setMaxPrice] = useState(2000);
  const [selectedClass, setSelectedClass] = useState('');
  const [items, setItems] = useState(buses);
  const [aiText, setAiText] = useState('<strong>High demand detected.</strong> Fares dynamically priced up 24% today — 89% of seats already filled. Book now to secure your seat.');

  const origin = useMemo(() => location.state?.origin || 'Nairobi', [location.state]);
  const destination = useMemo(() => location.state?.destination || 'Nakuru', [location.state]);
  const date = useMemo(() => location.state?.date || '', [location.state]);
  const time = useMemo(() => location.state?.time || '', [location.state]);
  const tripType = useMemo(() => (location.state?.tripType === 'two' ? 'ROUND_TRIP' : 'ONE_WAY'), [location.state]);

  useEffect(() => {
    let mounted = true;
    const loadTrips = async () => {
      const response = await requestSafe(`/trips/search?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&date=${encodeURIComponent(date)}&time=${encodeURIComponent(time)}&tripType=${encodeURIComponent(tripType)}`);
      const list = response?.data;
      if (!mounted || !Array.isArray(list) || !list.length) return;

      const mapped = list.map((trip) => {
        const basePrice = Number(trip.basePrice || 0);
        return {
          id: trip.id,
          sacco: trip.sacco?.name || 'Sacco',
          plate: `${trip.bus?.plateNumber || '-'} · ${trip.bus?.seatCapacity || '-'} seats`,
          price: `KES ${basePrice.toLocaleString()}`,
          priceLabel: 'Live fare',
          dep: new Date(trip.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          arr: new Date(trip.arrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          dur: trip.duration || '-',
          seats: Number(trip.availableSeatsCount || 0),
          classes: trip.seatClasses || ['Economy'],
          left: Number(trip.availableSeatsCount || 0) < 5 ? 'amber' : 'green',
          priceNum: basePrice,
          apiTrip: trip
        };
      });

      setItems(mapped);
    };

    const loadAi = async () => {
      const response = await requestSafe('/ai/assist', {
        method: 'POST',
        body: JSON.stringify({
          route: `${origin}-${destination}`,
          departureTime: date ? `${date}T${time || '08:00'}:00.000Z` : new Date().toISOString(),
          currentPrice: 1200,
          riskFactors: { weatherRisk: 0.2, trafficRisk: 0.5, routeRisk: 0.3 },
          fraudSignals: { attemptsLast24h: 0, cardMismatch: false, rapidRetries: 0, geoMismatch: false },
          prompt: `Suggest the best booking strategy for ${origin} to ${destination}`,
          language: 'en',
          trips: []
        })
      });
      const message = response?.data?.summary?.passengerMessage;
      if (message && mounted) {
        setAiText(`<strong>AI guidance:</strong> ${message}`);
      }
    };

    loadTrips();
    loadAi();

    return () => {
      mounted = false;
    };
  }, [origin, destination, date, time, tripType]);

  const filteredBuses = items.filter(b => {
    const matchesSacco = b.sacco.toLowerCase().includes(searchSacco.toLowerCase());
    const matchesPrice = b.priceNum <= maxPrice;
    const matchesClass = !selectedClass || b.classes.includes(selectedClass);
    return matchesSacco && matchesPrice && matchesClass;
  });

  return (
    <div>
      <div className="page-header">
        <div><div className="page-title">{origin} → {destination}</div><div className="page-sub">{date || 'Today'} · Buses · {filteredBuses.length} results</div></div>
        <div className="page-actions"><button className="btn btn-sm" onClick={() => navigate('/user')}>Change search</button></div>
      </div>
      <div className="page-body">
        {/* Hero search bar */}
        <div className="search-hero">
          <div className="search-hero-icon">🔍</div>
          <input
            className="search-hero-input"
            type="text"
            placeholder="Search trips by SACCO name, route, or time..."
            value={searchSacco}
            onChange={(e) => setSearchSacco(e.target.value)}
            autoFocus
          />
          {searchSacco && (
            <button className="search-hero-clear" onClick={() => setSearchSacco('')}>✕</button>
          )}
        </div>

        <AiBanner text={aiText} />
        
        <div style={{ background: '#fff', border: '1px solid var(--gray-200)', borderRadius: 12, padding: 16, marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: 'var(--gray-700)' }}>Filter trips</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Search SACCO</label>
              <input 
                className="form-input" 
                placeholder="SACCO name..." 
                value={searchSacco}
                onChange={(e) => setSearchSacco(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Max price: KES {maxPrice}</label>
              <input 
                type="range" 
                min="500" 
                max="2000" 
                step="50"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Seat class</label>
              <select 
                className="form-input" 
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
              >
                <option value="">All classes</option>
                <option value="Economy">Economy</option>
                <option value="Business">Business</option>
                <option value="VIP">VIP</option>
              </select>
            </div>
          </div>
        </div>

        {filteredBuses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--gray-400)' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>No trips match your filters</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>Try adjusting your search criteria</div>
          </div>
        ) : (
          filteredBuses.map((b,i) => (
          <div key={i} className="bus-card" style={b.dim?{opacity:.75}:{}}>
            <div className="bus-header">
              <div><div className="sacco-name">{b.sacco}</div><div style={{fontSize:11,color:'var(--gray-400)',marginTop:2}}>{b.plate}</div></div>
              <div style={{textAlign:'right'}}><div className="bus-price">{b.price}</div><div className="bus-price-label">{b.priceLabel}</div></div>
            </div>
            <div className="bus-timing">
              <div className="time-block"><div className="time-val">{b.dep}</div><div className="time-label">Departs</div></div>
              <div className="time-arrow" style={{flex:1,textAlign:'center',color:'var(--gray-300)',fontSize:18}}>——→</div>
              <div className="duration-pill">{b.dur}</div>
              <div className="time-arrow" style={{flex:1,textAlign:'center',color:'var(--gray-300)',fontSize:18}}>——→</div>
              <div className="time-block"><div className="time-val">{b.arr}</div><div className="time-label">Arrives</div></div>
            </div>
            <div className="bus-footer">
              <Badge variant={b.left}>{b.seats} seats left</Badge>
              {b.classes.map(c => <Badge key={c} variant="blue">{c}</Badge>)}
              <button
                className={`btn${i===0?' btn-primary':''}`}
                style={{marginLeft:'auto'}}
                onClick={() => navigate('/user/seat', { state: { selectedTrip: b.apiTrip || b, from: origin, to: destination, date } })}
              >
                Select bus →
              </button>
            </div>
          </div>
        ))
        )}
      </div>
    </div>
  );
}
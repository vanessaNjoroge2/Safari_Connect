import type { FormEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { useBooking } from '../../context/BookingContext';
import type { SearchQuery, Category, TripType } from '../../types';
import { searchTripsApi } from '../../lib/api';
import { useToast } from '../../hooks/useToast';

function toFrontendSeatClass(classes: Array<'VIP' | 'FIRST_CLASS' | 'BUSINESS'>) {
  const mapped = new Set<'economy' | 'business' | 'vip'>();
  classes.forEach((c) => {
    if (c === 'VIP') mapped.add('vip');
    else if (c === 'FIRST_CLASS') mapped.add('business');
    else mapped.add('economy');
  });

  if (mapped.size === 0) mapped.add('economy');
  return Array.from(mapped);
}

function mapTrips(
  trips: Awaited<ReturnType<typeof searchTripsApi>>['data'],
  maxFare?: number
) {
  const mapped = trips.map((trip, idx) => ({
    id: trip.id,
    busId: trip.bus.id,
    routeId: trip.route.id,
    saccoName: trip.sacco.name,
    plateInfo: `${trip.bus.plateNumber} · ${trip.bus.seatCapacity} seats`,
    rating: 0,
    departureTime: new Date(trip.departureTime).toLocaleTimeString('en-KE', { hour: 'numeric', minute: '2-digit' }),
    arrivalTime: new Date(trip.arrivalTime).toLocaleTimeString('en-KE', { hour: 'numeric', minute: '2-digit' }),
    duration: trip.duration,
    price: Number(trip.basePrice),
    priceLabel: 'Live fare',
    seatsLeft: trip.availableSeatsCount,
    classes: toFrontendSeatClass(trip.seatClasses),
    highlighted: idx === 0,
  }));

  const filtered = Number.isFinite(maxFare)
    ? mapped.filter((trip) => trip.price <= Number(maxFare))
    : mapped;

  return filtered.map((trip, idx) => ({
    ...trip,
    highlighted: idx === 0,
  }));
}

export default function Search() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { setSearch, setSearchResults } = useBooking();
  const toast = useToast();
  const [isSearching, setIsSearching] = useState(false);
  const autoTriggeredRef = useRef(false);
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const maxFareParam = Number(params.get('maxFare'));
  const parsedMaxFare = Number.isFinite(maxFareParam) ? maxFareParam : undefined;

  const [form, setForm] = useState<SearchQuery>({
    category:   (params.get('cat') ?? 'bus') as Category,
    from:       params.get('from') ?? '',
    to:         params.get('to') ?? '',
    date:       params.get('date') ?? tomorrow,
    time:       params.get('time') ?? '08:00',
    tripType:   'one-way',
    returnDate: '',
    returnTime: '17:00',
    passengers: 1,
  });

  const [errors, setErrors] = useState<{ from?: string; to?: string; date?: string }>({});

  const set = <K extends keyof SearchQuery>(k: K, v: SearchQuery[K]) =>
    setForm(p => ({ ...p, [k]: v }));

  const validate = () => {
    const e: typeof errors = {};
    if (!form.from) e.from = 'Please enter a departure location';
    if (!form.to)   e.to   = 'Please enter a destination';
    if (!form.date) e.date = 'Please select a travel date';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSearching(true);
    try {
      const result = await searchTripsApi(form);
      const mapped = mapTrips(result.data, parsedMaxFare);

      setSearch(form);
      setSearchResults(mapped);
      const autoMode = params.get('auto') === '1';
      navigate(autoMode ? '/passenger/results?auto=1' : '/passenger/results');
    } catch (error) {
      toast((error as Error).message || 'Unable to fetch trips right now', 'error');
    } finally {
      setIsSearching(false);
    }
  };

  const CATS: { id: Category; icon: string; label: string }[] = [
    { id: 'bus',       icon: '🚌', label: 'Bus' },
    { id: 'matatu',    icon: '🚐', label: 'Matatu' },
    { id: 'motorbike', icon: '🏍️', label: 'Motorbike' },
  ];

  useEffect(() => {
    if (autoTriggeredRef.current) return;

    const auto = params.get('auto') === '1';
    if (!auto) return;
    if (!form.from || !form.to || !form.date) return;

    autoTriggeredRef.current = true;
    const run = async () => {
      setIsSearching(true);
      try {
        const result = await searchTripsApi(form);
        const mapped = mapTrips(result.data, parsedMaxFare);

        setSearch(form);
        setSearchResults(mapped);
        navigate('/passenger/results?auto=1');
      } catch (error) {
        toast((error as Error).message || 'Unable to fetch trips right now', 'error');
      } finally {
        setIsSearching(false);
      }
    };

    void run();
  }, [form, navigate, params, parsedMaxFare, setSearch, setSearchResults, toast]);

  return (
    <DashboardLayout title="Search trips" subtitle="Find available transport on your route">
      <div style={{ maxWidth: 660 }}>
        {/* Category selector */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {CATS.map(c => (
            <button key={c.id}
              className={`btn${form.category === c.id ? ' btn-primary' : ''}`}
              onClick={() => set('category', c.id)}>
              {c.icon} {c.label}
            </button>
          ))}
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} noValidate>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Departure (from)</label>
                <input className={`input${errors.from ? ' has-error' : ''}`}
                  placeholder="e.g. Nairobi CBD"
                  value={form.from} onChange={e => set('from', e.target.value)} />
                {errors.from && <span className="form-error">{errors.from}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Destination (to)</label>
                <input className={`input${errors.to ? ' has-error' : ''}`}
                  placeholder="e.g. Nakuru"
                  value={form.to} onChange={e => set('to', e.target.value)} />
                {errors.to && <span className="form-error">{errors.to}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Travel date</label>
                <input className={`input${errors.date ? ' has-error' : ''}`}
                  type="date" value={form.date} onChange={e => set('date', e.target.value)} />
                {errors.date && <span className="form-error">{errors.date}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Preferred time</label>
                <input className="input" type="time" value={form.time} onChange={e => set('time', e.target.value)} />
              </div>
            </div>

            {/* Trip type */}
            <div className="form-group">
              <label className="form-label">Trip type</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['one-way', 'return'] as TripType[]).map(t => (
                  <button key={t} type="button"
                    className={`btn${form.tripType === t ? ' btn-primary' : ''}`}
                    onClick={() => set('tripType', t)}>
                    {t === 'one-way' ? 'One-way' : 'Return trip'}
                  </button>
                ))}
              </div>
            </div>

            {form.tripType === 'return' && (
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Return date</label>
                  <input className="input" type="date"
                    value={form.returnDate ?? ''} onChange={e => set('returnDate', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Return time</label>
                  <input className="input" type="time"
                    value={form.returnTime ?? ''} onChange={e => set('returnTime', e.target.value)} />
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Passengers</label>
              <select className="select" value={form.passengers}
                onChange={e => set('passengers', Number(e.target.value))}>
                {[1,2,3,4,5].map(n => (
                  <option key={n} value={n}>{n} passenger{n > 1 ? 's' : ''}</option>
                ))}
              </select>
            </div>

            <button type="submit" className="btn btn-primary btn-lg" style={{ minWidth: 220 }} disabled={isSearching}>
              {isSearching ? 'Searching trips…' : 'Search available trips →'}
            </button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}

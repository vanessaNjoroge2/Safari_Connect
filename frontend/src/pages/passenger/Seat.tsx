import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { Steps, SeatMap, Modal } from '../../components/UI';
import { useBooking } from '../../context/BookingContext';
import type { SeatClass, PassengerDetails } from '../../types';
import { getTripSeatsApi } from '../../lib/api';
import { useToast } from '../../hooks/useToast';

const CLASSES: { id: SeatClass; label: string; price: number; sub: string; color: string; bg: string; icon: string; perks: string[] }[] = [
  {
    id: 'vip', label: 'VIP', price: 1800, icon: '👑', color: '#7c3aed', bg: '#f5f3ff',
    sub: 'Row 1', perks: ['Fully reclining seat', 'Complimentary snacks', 'Extra legroom', 'Priority boarding'],
  },
  {
    id: 'business', label: 'Business', price: 1200, icon: '💼', color: '#3b82f6', bg: '#eff6ff',
    sub: 'Rows 2–3', perks: ['Extra legroom', 'Priority boarding', 'Dedicated overhead storage'],
  },
  {
    id: 'economy', label: 'Economy', price: 850, icon: '🎫', color: 'var(--brand)', bg: 'var(--brand-light)',
    sub: 'Rows 4–10', perks: ['Standard comfortable seating', 'Window & aisle options', 'Overhead storage'],
  },
];

const EMPTY_PAX: PassengerDetails = { firstName: '', lastName: '', idNumber: '', residence: '', email: '' };

export default function SeatSelection() {
  const navigate = useNavigate();
  const { booking, setTripSeats, selectSeat, setPassenger } = useBooking();
  const toast = useToast();

  const [seatClass, setSeatClass] = useState<SeatClass>('economy');
  const [seatLabel, setSeatLabel] = useState<string | null>(null);
  const [paxOpen, setPaxOpen] = useState(false);
  const [pax, setPax] = useState<PassengerDetails>(EMPTY_PAX);
  const [paxSaved, setPaxSaved] = useState(false);
  const [loadingSeats, setLoadingSeats] = useState(false);

  useEffect(() => {
    const tripId = booking.selectedTripId || booking.selectedBus?.id;
    if (!tripId) return;

    setLoadingSeats(true);
    void (async () => {
      try {
        const result = await getTripSeatsApi(tripId);
        const seats = result.data.seats.map((seat) => {
          const mappedClass: SeatClass =
            seat.seatClass === 'VIP'
              ? 'vip'
              : seat.seatClass === 'FIRST_CLASS'
                ? 'business'
                : 'economy';

          return {
          id: seat.id,
          seatNumber: seat.seatNumber,
          seatClass: mappedClass,
          price: Number(seat.price),
          isBooked: seat.isBooked,
          };
        });

        setTripSeats(seats);
      } catch (error) {
        toast((error as Error).message || 'Unable to fetch seats for this trip', 'error');
      } finally {
        setLoadingSeats(false);
      }
    })();
  }, [booking.selectedTripId, booking.selectedBus?.id, setTripSeats, toast]);

  const cls = CLASSES.find(c => c.id === seatClass)!;

  const seatCounts = useMemo(() => {
    const available = booking.tripSeats.filter((s) => !s.isBooked);
    return {
      vip: available.filter((s) => s.seatClass === 'vip').length,
      business: available.filter((s) => s.seatClass === 'business').length,
      economy: available.filter((s) => s.seatClass === 'economy').length,
    };
  }, [booking.tripSeats]);

  const handleSeatClick = (label: string, type: SeatClass) => {
    setSeatClass(type);
    setSeatLabel(label);
    setPaxOpen(true);
  };

  const savePax = () => {
    if (!seatLabel) return;
    const selected = booking.tripSeats.find((s) => s.seatNumber === seatLabel);
    selectSeat(seatLabel, seatClass, selected?.price ?? cls.price);
    setPassenger(pax);
    setPaxSaved(true);
    setPaxOpen(false);
  };

  return (
    <DashboardLayout
      title="Seat selection"
      subtitle={`${booking.selectedBus?.saccoName ?? 'Modern Coast'} · Nairobi → Nakuru · 8:00 AM`}
    >
      <Steps steps={['Search', 'Results', 'Seat', 'Confirm', 'Payment', 'Ticket']} current={2} />

      {/* ── 3-column layout ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr 280px', gap: 20, alignItems: 'start' }}>

        {/* ── LEFT: class selector ── */}
        <div>
          <div className="card" style={{ padding: '20px 18px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--gray-400)', marginBottom: 14 }}>
              Select class
            </div>
            {CLASSES.map(c => (
              <div
                key={c.id}
                onClick={() => setSeatClass(c.id)}
                style={{
                  padding: '14px 14px',
                  borderRadius: 10,
                  border: `2px solid ${seatClass === c.id ? c.color : 'var(--gray-200)'}`,
                  background: seatClass === c.id ? c.bg : '#fff',
                  cursor: 'pointer',
                  marginBottom: 10,
                  transition: 'all .15s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 18 }}>{c.icon}</span>
                  <span style={{ fontWeight: 700, fontSize: 14, color: seatClass === c.id ? c.color : 'var(--gray-800)' }}>{c.label}</span>
                  <span style={{ marginLeft: 'auto', fontWeight: 800, fontSize: 14, color: c.color }}>
                    KES {c.price.toLocaleString()}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--gray-400)', marginBottom: seatClass === c.id ? 10 : 0 }}>{c.sub}</div>
                {seatClass === c.id && (
                  <ul style={{ margin: 0, paddingLeft: 16, listStyle: 'none' }}>
                    {c.perks.map(p => (
                      <li key={p} style={{ fontSize: 11, color: 'var(--gray-500)', marginBottom: 3, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ color: c.color, fontSize: 10 }}>✓</span> {p}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}

            {/* Seat count info */}
            <div style={{ marginTop: 8, padding: '10px 12px', background: 'var(--gray-50)', borderRadius: 8, fontSize: 12, color: 'var(--gray-500)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span>VIP available</span><span style={{ fontWeight: 600, color: '#7c3aed' }}>{seatCounts.vip} seats</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span>Business available</span><span style={{ fontWeight: 600, color: '#3b82f6' }}>{seatCounts.business} seats</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Economy available</span><span style={{ fontWeight: 600, color: 'var(--brand)' }}>{seatCounts.economy} seats</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── CENTER: seat map ── */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--gray-900)' }}>
                Bus map — {booking.selectedBus?.plateInfo?.split('·')[0]?.trim() ?? 'KBZ 123A'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 2 }}>
                Click any available seat to select it
              </div>
            </div>
            {seatLabel && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--brand-light)', border: '1px solid var(--brand-mid)', borderRadius: 8, padding: '6px 12px' }}>
                <span style={{ fontSize: 13 }}>💺</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--brand-dark)' }}>Seat {seatLabel} selected</span>
              </div>
            )}
          </div>
          <SeatMap onSelect={handleSeatClick} selectedClass={seatClass} />
          {loadingSeats && <p className="text-xs text-muted mt-2">Loading live seats…</p>}
        </div>

        {/* ── RIGHT: booking summary ── */}
        <div>
          <div className="card" style={{ padding: '20px 18px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--gray-400)', marginBottom: 14 }}>
              Booking summary
            </div>

            {[
              ['Route',    'Nairobi → Nakuru'],
              ['Date',     booking.searchQuery?.date ?? 'Wed 18 Mar 2026'],
              ['Departs',  '8:00 AM'],
              ['SACCO',    booking.selectedBus?.saccoName ?? 'Modern Coast'],
              ['Class',    cls.label],
            ].map(([l, v]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--gray-100)', fontSize: 13 }}>
                <span style={{ color: 'var(--gray-400)' }}>{l}</span>
                <span style={{ fontWeight: 600 }}>{v}</span>
              </div>
            ))}

            {/* Seat */}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--gray-100)', fontSize: 13 }}>
              <span style={{ color: 'var(--gray-400)' }}>Seat</span>
              <span style={{ fontWeight: 600, color: seatLabel ? 'var(--brand)' : 'var(--gray-300)' }}>
                {seatLabel ? `Seat ${seatLabel}` : 'Not selected'}
              </span>
            </div>

            {/* Fare */}
            <div style={{ padding: '14px 0 10px', textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'var(--gray-400)', marginBottom: 4 }}>Total fare</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: cls.color, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
                KES {cls.price.toLocaleString()}
              </div>
              <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 4 }}>Incl. taxes & M-Pesa</div>
            </div>

            <button
              className="btn btn-primary btn-full btn-lg"
              disabled={!paxSaved}
              style={{ opacity: paxSaved ? 1 : 0.4, background: cls.color, borderColor: cls.color }}
              onClick={() => navigate('/passenger/confirm')}
            >
              Continue to confirm →
            </button>
            {!paxSaved && (
              <p style={{ fontSize: 11, color: 'var(--gray-400)', textAlign: 'center', marginTop: 10 }}>
                {seatLabel ? 'Complete passenger details' : 'Select a seat on the map'}
              </p>
            )}

            {paxSaved && (
              <div style={{ marginTop: 12, padding: '10px 12px', background: 'var(--brand-light)', borderRadius: 8, fontSize: 12, color: 'var(--brand-dark)', display: 'flex', gap: 6 }}>
                <span>✓</span>
                <span>Seat {seatLabel} reserved for {pax.firstName} {pax.lastName}</span>
              </div>
            )}
          </div>

          {/* M-Pesa note */}
          <div style={{ marginTop: 12, padding: '12px 14px', background: 'var(--gray-50)', border: '1px solid var(--gray-200)', borderRadius: 10, fontSize: 12, color: 'var(--gray-500)', display: 'flex', gap: 10 }}>
            <span style={{ fontSize: 18 }}>💳</span>
            <span>Payment via M-Pesa STK push. You'll confirm on your phone after this step.</span>
          </div>
        </div>
      </div>

      {/* ── Passenger details modal ── */}
      <Modal open={paxOpen} onClose={() => setPaxOpen(false)} title={`Passenger details — Seat ${seatLabel} · ${cls.label}`}>
        <div style={{ padding: '2px 0 12px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <span style={{ fontSize: 20 }}>{cls.icon}</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: cls.color }}>{cls.label} class</div>
            <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>KES {cls.price.toLocaleString()} · {cls.perks[0]}</div>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">First name</label>
            <input className="input" placeholder="Jane"
              value={pax.firstName} onChange={e => setPax(p => ({ ...p, firstName: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Last name</label>
            <input className="input" placeholder="Mwangi"
              value={pax.lastName} onChange={e => setPax(p => ({ ...p, lastName: e.target.value }))} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">National ID number</label>
          <input className="input" placeholder="23456789"
            value={pax.idNumber} onChange={e => setPax(p => ({ ...p, idNumber: e.target.value }))} />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Residence</label>
            <input className="input" placeholder="Nairobi"
              value={pax.residence} onChange={e => setPax(p => ({ ...p, residence: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Email address</label>
            <input className="input" type="email" placeholder="jane@email.com"
              value={pax.email} onChange={e => setPax(p => ({ ...p, email: e.target.value }))} />
          </div>
        </div>
        <button className="btn btn-primary btn-full btn-lg" style={{ background: cls.color, borderColor: cls.color }} onClick={savePax}>
          Reserve Seat {seatLabel} →
        </button>
      </Modal>
    </DashboardLayout>
  );
}

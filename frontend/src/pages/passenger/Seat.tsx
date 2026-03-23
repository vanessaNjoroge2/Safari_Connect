import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { Steps, Modal } from '../../components/UI';
import { useBooking } from '../../context/BookingContext';
import type { SeatClass, PassengerDetails, TripSeat } from '../../types';
import { getBookingAutofillApi, getTripSeatsApi } from '../../lib/api';
import { useToast } from '../../hooks/useToast';

const CLASS_META: Record<
  SeatClass,
  { label: string; sub: string; color: string; bg: string; icon: string; perks: string[] }
> = {
  vip: {
    label: 'VIP',
    icon: '👑',
    color: '#7c3aed',
    bg: '#f5f3ff',
    sub: 'Premium section',
    perks: ['Reclining seat', 'Extra legroom', 'Priority boarding'],
  },
  business: {
    label: 'Business',
    icon: '💼',
    color: '#3b82f6',
    bg: '#eff6ff',
    sub: 'Comfort section',
    perks: ['Extra legroom', 'Priority boarding', 'Overhead storage'],
  },
  economy: {
    label: 'Economy',
    icon: '🎫',
    color: 'var(--brand)',
    bg: 'var(--brand-light)',
    sub: 'Standard section',
    perks: ['Comfort seating', 'Window and aisle options', 'Overhead storage'],
  },
};

const EMPTY_PAX: PassengerDetails = {
  firstName: '',
  lastName: '',
  idNumber: '',
  residence: '',
  email: '',
};

function getSeatClassPrice(seats: TripSeat[], seatClass: SeatClass) {
  const classSeats = seats.filter((s) => s.seatClass === seatClass && !s.isBooked);
  if (!classSeats.length) return 0;
  return Math.min(...classSeats.map((s) => Number(s.price) || 0));
}

function sortSeatNumber(a: string, b: string) {
  const am = a.match(/(\d+)([A-Za-z]+)/);
  const bm = b.match(/(\d+)([A-Za-z]+)/);
  if (!am || !bm) return a.localeCompare(b);
  const an = Number(am[1]);
  const bn = Number(bm[1]);
  if (an !== bn) return an - bn;
  return am[2].localeCompare(bm[2]);
}

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
  const [autofillApplied, setAutofillApplied] = useState(false);

  useEffect(() => {
    if (booking.passenger) {
      setPax(booking.passenger);
      setAutofillApplied(true);
      return;
    }

    if (autofillApplied) return;

    void (async () => {
      try {
        const result = await getBookingAutofillApi();
        setPax((current) => ({
          ...current,
          ...result.data.passenger,
        }));
      } catch {
        // Autofill should not block booking flow.
      } finally {
        setAutofillApplied(true);
      }
    })();
  }, [autofillApplied, booking.passenger]);

  useEffect(() => {
    const tripId = booking.selectedTripId || booking.selectedBus?.id;
    if (!tripId) return;

    setLoadingSeats(true);
    void (async () => {
      try {
        const result = await getTripSeatsApi(tripId);
        const seats = result.data.seats.map((seat) => {
          const mappedClass: SeatClass =
            seat.seatClass === 'VIP' ? 'vip' : seat.seatClass === 'FIRST_CLASS' ? 'business' : 'economy';

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

  const routeLabel = `${booking.searchQuery?.from ?? '-'} -> ${booking.searchQuery?.to ?? '-'}`;
  const departureLabel = booking.selectedBus?.departureTime ?? '-';

  const classPricing = useMemo(
    () => ({
      vip: getSeatClassPrice(booking.tripSeats, 'vip'),
      business: getSeatClassPrice(booking.tripSeats, 'business'),
      economy: getSeatClassPrice(booking.tripSeats, 'economy'),
    }),
    [booking.tripSeats]
  );

  const seatCounts = useMemo(() => {
    const available = booking.tripSeats.filter((s) => !s.isBooked);
    return {
      vip: available.filter((s) => s.seatClass === 'vip').length,
      business: available.filter((s) => s.seatClass === 'business').length,
      economy: available.filter((s) => s.seatClass === 'economy').length,
    };
  }, [booking.tripSeats]);

  const sortedSeats = useMemo(
    () => [...booking.tripSeats].sort((a, b) => sortSeatNumber(a.seatNumber, b.seatNumber)),
    [booking.tripSeats]
  );

  const selectedSeatData = useMemo(
    () => booking.tripSeats.find((s) => s.seatNumber === seatLabel) || null,
    [booking.tripSeats, seatLabel]
  );

  const activeFare = selectedSeatData ? Number(selectedSeatData.price) : classPricing[seatClass] || 0;
  const cls = CLASS_META[seatClass];

  const handleSeatClick = (seat: TripSeat) => {
    if (seat.isBooked) return;
    setSeatClass(seat.seatClass);
    setSeatLabel(seat.seatNumber);
    setPaxOpen(true);
  };

  const savePax = () => {
    if (!seatLabel) return;
    const selected = booking.tripSeats.find((s) => s.seatNumber === seatLabel);
    selectSeat(seatLabel, selected?.seatClass || seatClass, Number(selected?.price || activeFare));
    setPassenger(pax);
    setPaxSaved(true);
    setPaxOpen(false);
  };

  return (
    <DashboardLayout
      title="Seat selection"
      subtitle={`${booking.selectedBus?.saccoName ?? '-'} | ${routeLabel} | ${departureLabel}`}
    >
      <Steps steps={['Search', 'Results', 'Seat', 'Confirm', 'Payment', 'Ticket']} current={2} />

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr 280px', gap: 20, alignItems: 'start' }}>
        <div>
          <div className="card" style={{ padding: '20px 18px' }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '.08em',
                color: 'var(--gray-400)',
                marginBottom: 14,
              }}
            >
              Select class
            </div>
            {(Object.keys(CLASS_META) as SeatClass[]).map((id) => {
              const meta = CLASS_META[id];
              const price = classPricing[id];
              const available = seatCounts[id];
              return (
                <div
                  key={id}
                  onClick={() => setSeatClass(id)}
                  style={{
                    padding: '14px 14px',
                    borderRadius: 10,
                    border: `2px solid ${seatClass === id ? meta.color : 'var(--gray-200)'}`,
                    background: seatClass === id ? meta.bg : '#fff',
                    cursor: 'pointer',
                    marginBottom: 10,
                    transition: 'all .15s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 18 }}>{meta.icon}</span>
                    <span style={{ fontWeight: 700, fontSize: 14, color: seatClass === id ? meta.color : 'var(--gray-800)' }}>{meta.label}</span>
                    <span style={{ marginLeft: 'auto', fontWeight: 800, fontSize: 14, color: meta.color }}>
                      {price > 0 ? `KES ${price.toLocaleString()}` : 'N/A'}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--gray-400)', marginBottom: seatClass === id ? 10 : 0 }}>
                    {meta.sub} · {available} seats available
                  </div>
                  {seatClass === id && (
                    <ul style={{ margin: 0, paddingLeft: 16, listStyle: 'none' }}>
                      {meta.perks.map((p) => (
                        <li
                          key={p}
                          style={{ fontSize: 11, color: 'var(--gray-500)', marginBottom: 3, display: 'flex', alignItems: 'center', gap: 6 }}
                        >
                          <span style={{ color: meta.color, fontSize: 10 }}>✓</span> {p}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--gray-900)' }}>
                Live seat inventory — {booking.selectedBus?.plateInfo?.split('·')[0]?.trim() ?? '-'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 2 }}>
                Seats rendered directly from backend seat records
              </div>
            </div>
            {seatLabel && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--brand-light)', border: '1px solid var(--brand-mid)', borderRadius: 8, padding: '6px 12px' }}>
                <span style={{ fontSize: 13 }}>💺</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--brand-dark)' }}>Seat {seatLabel} selected</span>
              </div>
            )}
          </div>

          <div className="card" style={{ padding: 16 }}>
            {loadingSeats && <p className="text-xs text-muted">Loading live seats...</p>}
            {!loadingSeats && sortedSeats.length === 0 && (
              <p className="text-xs text-muted">No seats returned by backend for this trip.</p>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))', gap: 10 }}>
              {sortedSeats.map((seat) => {
                const meta = CLASS_META[seat.seatClass];
                const isSelected = seatLabel === seat.seatNumber;
                return (
                  <button
                    key={seat.id}
                    type="button"
                    onClick={() => handleSeatClick(seat)}
                    disabled={seat.isBooked}
                    style={{
                      borderRadius: 10,
                      border: `1.5px solid ${
                        seat.isBooked
                          ? '#fca5a5'
                          : isSelected
                            ? meta.color
                            : seat.seatClass === 'vip'
                              ? '#c4b5fd'
                              : seat.seatClass === 'business'
                                ? '#93c5fd'
                                : '#86efac'
                      }`,
                      background: seat.isBooked
                        ? '#fee2e2'
                        : isSelected
                          ? meta.bg
                          : seat.seatClass === 'vip'
                            ? '#f5f3ff'
                            : seat.seatClass === 'business'
                              ? '#eff6ff'
                              : '#ecfdf5',
                      padding: '10px 8px',
                      cursor: seat.isBooked ? 'not-allowed' : 'pointer',
                      textAlign: 'center',
                    }}
                    title={seat.isBooked ? 'Booked seat' : `Seat ${seat.seatNumber}`}
                  >
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{seat.seatNumber}</div>
                    <div style={{ fontSize: 10, color: 'var(--gray-500)' }}>{meta.label}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: seat.isBooked ? '#991b1b' : meta.color }}>
                      {seat.isBooked ? 'Booked' : `KES ${Number(seat.price).toLocaleString()}`}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div>
          <div className="card" style={{ padding: '20px 18px' }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '.08em',
                color: 'var(--gray-400)',
                marginBottom: 14,
              }}
            >
              Booking summary
            </div>

            {[
              ['Route', routeLabel],
              ['Date', booking.searchQuery?.date ?? '-'],
              ['Departs', departureLabel],
              ['SACCO', booking.selectedBus?.saccoName ?? '-'],
              ['Class', cls.label],
            ].map(([l, v]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--gray-100)', fontSize: 13 }}>
                <span style={{ color: 'var(--gray-400)' }}>{l}</span>
                <span style={{ fontWeight: 600 }}>{v}</span>
              </div>
            ))}

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--gray-100)', fontSize: 13 }}>
              <span style={{ color: 'var(--gray-400)' }}>Seat</span>
              <span style={{ fontWeight: 600, color: seatLabel ? 'var(--brand)' : 'var(--gray-300)' }}>{seatLabel ? `Seat ${seatLabel}` : 'Not selected'}</span>
            </div>

            <div style={{ padding: '14px 0 10px', textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'var(--gray-400)', marginBottom: 4 }}>Total fare</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: cls.color, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
                KES {activeFare.toLocaleString()}
              </div>
              <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 4 }}>From live seat pricing</div>
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
                {seatLabel ? 'Complete passenger details' : 'Select a live seat from backend inventory'}
              </p>
            )}

            {paxSaved && (
              <div style={{ marginTop: 12, padding: '10px 12px', background: 'var(--brand-light)', borderRadius: 8, fontSize: 12, color: 'var(--brand-dark)', display: 'flex', gap: 6 }}>
                <span>✓</span>
                <span>
                  Seat {seatLabel} reserved for {pax.firstName} {pax.lastName}
                </span>
              </div>
            )}
          </div>

          <div style={{ marginTop: 12, padding: '12px 14px', background: 'var(--gray-50)', border: '1px solid var(--gray-200)', borderRadius: 10, fontSize: 12, color: 'var(--gray-500)', display: 'flex', gap: 10 }}>
            <span style={{ fontSize: 18 }}>💳</span>
            <span>Payment is processed via M-Pesa STK push after this step.</span>
          </div>
        </div>
      </div>

      <Modal open={paxOpen} onClose={() => setPaxOpen(false)} title={`Passenger details — Seat ${seatLabel} · ${cls.label}`}>
        <div style={{ padding: '2px 0 12px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <span style={{ fontSize: 20 }}>{cls.icon}</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: cls.color }}>{cls.label} class</div>
            <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>
              KES {activeFare.toLocaleString()} · {cls.perks[0]}
            </div>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">First name</label>
            <input className="input" placeholder="First name" value={pax.firstName} onChange={(e) => setPax((p) => ({ ...p, firstName: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Last name</label>
            <input className="input" placeholder="Last name" value={pax.lastName} onChange={(e) => setPax((p) => ({ ...p, lastName: e.target.value }))} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">National ID number</label>
          <input className="input" placeholder="National ID" value={pax.idNumber} onChange={(e) => setPax((p) => ({ ...p, idNumber: e.target.value }))} />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Residence</label>
            <input className="input" placeholder="Residence" value={pax.residence} onChange={(e) => setPax((p) => ({ ...p, residence: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Email address</label>
            <input className="input" type="email" placeholder="Email" value={pax.email} onChange={(e) => setPax((p) => ({ ...p, email: e.target.value }))} />
          </div>
        </div>
        <button className="btn btn-primary btn-full btn-lg" style={{ background: cls.color, borderColor: cls.color }} onClick={savePax}>
          Reserve Seat {seatLabel} →
        </button>
      </Modal>
    </DashboardLayout>
  );
}

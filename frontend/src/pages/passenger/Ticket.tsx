import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { Steps, Badge, MapEmbed } from '../../components/UI';
import { useBooking } from '../../context/BookingContext';
import { getBookingByIdApi } from '../../lib/api';
import { useToast } from '../../hooks/useToast';
import { useLiveGpsTracking } from '../../hooks/useLiveGpsTracking';

const KNOWN_POINTS: Record<string, { lat: number; lon: number }> = {
  nairobi: { lat: -1.286389, lon: 36.817223 },
  karen: { lat: -1.319, lon: 36.707 },
  mombasa: { lat: -4.0435, lon: 39.6682 },
  kisumu: { lat: -0.1022, lon: 34.7617 },
  nakuru: { lat: -0.3031, lon: 36.08 },
  eldoret: { lat: 0.5143, lon: 35.2698 },
  westlands: { lat: -1.267, lon: 36.81 },
  kilimani: { lat: -1.2921, lon: 36.7836 },
  thika: { lat: -1.0332, lon: 37.0692 },
};

const LAST_BOOKING_ID_KEY = 'safiri_last_booking_id';

function resolvePoint(name?: string | null) {
  if (!name) return KNOWN_POINTS.nairobi;
  const input = name.toLowerCase();
  for (const [key, point] of Object.entries(KNOWN_POINTS)) {
    if (input.includes(key)) return point;
  }
  return KNOWN_POINTS.nairobi;
}

export default function Ticket() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { booking, reset } = useBooking();
  const toast = useToast();

  const bookingId = params.get('bookingId') || booking.bookingId || localStorage.getItem(LAST_BOOKING_ID_KEY) || '';
  const [liveTicket, setLiveTicket] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!bookingId) return;

    setLoading(true);
    void (async () => {
      try {
        const result = await getBookingByIdApi(bookingId);
        setLiveTicket(result.data);
        if (result.data?.id) {
          localStorage.setItem(LAST_BOOKING_ID_KEY, result.data.id);
        }
      } catch (error) {
        toast((error as Error).message || 'Failed to load latest ticket details', 'warning');
      } finally {
        setLoading(false);
      }
    })();
  }, [bookingId, toast]);

  const ref = liveTicket?.bookingCode || booking.bookingRef || 'N/A';
  const passengerName = liveTicket
    ? `${liveTicket.firstName} ${liveTicket.lastName}`
    : `${booking.passenger?.firstName ?? '-'} ${booking.passenger?.lastName ?? ''}`.trim();
  const passengerId = liveTicket?.nationalId || booking.passenger?.idNumber || '-';
  const saccoName = liveTicket?.trip?.sacco?.name || booking.selectedBus?.saccoName || '-';
  const routeName = liveTicket
    ? `${liveTicket.trip?.route?.origin ?? '-'} to ${liveTicket.trip?.route?.destination ?? '-'}`
    : `${booking.searchQuery?.from ?? '-'} to ${booking.searchQuery?.to ?? '-'}`;
  const tripDate = liveTicket
    ? new Date(liveTicket.trip.departureTime).toLocaleDateString('en-KE', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : booking.searchQuery?.date || '-';
  const departure = liveTicket
    ? new Date(liveTicket.trip.departureTime).toLocaleTimeString('en-KE', { hour: 'numeric', minute: '2-digit' })
    : booking.selectedBus?.departureTime || '-';
  const arrival = liveTicket
    ? new Date(liveTicket.trip.arrivalTime).toLocaleTimeString('en-KE', { hour: 'numeric', minute: '2-digit' })
    : booking.selectedBus?.arrivalTime || '-';
  const seat = liveTicket
    ? `${liveTicket.seat?.seatNumber ?? '-'} · ${liveTicket.seat?.seatClass ?? ''}`
    : `${booking.selectedSeat ?? '-'} · ${booking.seatClass ?? '-'}`;
  const amount = liveTicket?.amount ?? booking.fare ?? 0;
  const fromName = liveTicket?.trip?.route?.origin || booking.searchQuery?.from || 'Nairobi';
  const toName = liveTicket?.trip?.route?.destination || booking.searchQuery?.to || 'Nairobi';
  const gps = useLiveGpsTracking({
    start: resolvePoint(fromName),
    end: resolvePoint(toName),
    simulateStep: 0.09,
    simulateIntervalMs: 4500,
  });

  return (
    <DashboardLayout title="Booking confirmed" subtitle="Your e-ticket is ready">
      <div className="no-print">
        <Steps steps={['Search', 'Results', 'Seat', 'Confirm', 'Payment', 'Ticket']} current={5} />
      </div>

      {!bookingId && (
        <p className="text-sm" style={{ color: 'var(--danger)', marginBottom: 10 }}>
          No booking reference found. Open your booking from My bookings to load a saved receipt.
        </p>
      )}

      {loading && <p className="text-sm text-muted mb-3 no-print">Refreshing ticket details...</p>}

      <div className="no-print" style={{ background: 'var(--brand-light)', border: '1px solid var(--brand-mid)', borderRadius: 'var(--r-lg)', padding: '14px 20px', marginBottom: 28, display: 'flex', alignItems: 'center', gap: 14 }}>
        <span className="ai-chip">Confirmed</span>
        <span style={{ fontSize: 14, color: 'var(--gray-700)' }}>
          <strong>Payment received.</strong> Your seat {liveTicket?.seat?.seatNumber ?? booking.selectedSeat ?? '-'} is reserved.
          Arrive at the stage by 7:40 AM. Safe journey!
        </span>
      </div>

      <div style={{ display: 'flex', gap: 28, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div className="ticket-print-area">
          <div className="ticket">
          <div className="ticket-head">
            <div className="ticket-brand">SafiriConnect · E-Ticket</div>
            <div className="ticket-route">{routeName}</div>
            <div className="ticket-ref">Ref: {ref}</div>
          </div>

          <div className="ticket-body">
            {[
              ['Passenger', passengerName],
              ['ID number', passengerId],
              ['SACCO', saccoName],
              ['Date', tripDate],
              ['Departure', departure],
              ['Arrival', arrival],
              ['Seat', seat],
            ].map(([l, v]) => (
              <div key={l} className="ticket-row">
                <span className="ticket-row-label">{l}</span>
                <span style={{ fontWeight: 600, color: 'var(--gray-900)' }}>{v}</span>
              </div>
            ))}

            <div className="ticket-row">
              <span className="ticket-row-label">Amount paid</span>
              <strong style={{ color: 'var(--brand)', fontSize: 16 }}>
                KES {Number(amount).toLocaleString()}
              </strong>
            </div>

            <div className="ticket-row">
              <span className="ticket-row-label">Status</span>
              <Badge variant="green">Confirmed</Badge>
            </div>
          </div>

          <div className="ticket-qr">
            <div style={{ fontFamily: 'monospace', fontSize: 40, letterSpacing: -2, color: 'var(--gray-700)' }}>########</div>
            <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 6 }}>{ref} · Present at boarding gate</div>
          </div>
        </div>
        </div>

        <div className="no-print" style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 200 }}>
          <button className="btn btn-primary" onClick={() => window.print()}>Print ticket</button>
          <button className="btn" onClick={() => navigate('/passenger/mybookings')}>View all bookings</button>
          <button
            className="btn btn-outline mt-2"
            onClick={() => {
              reset();
              navigate('/passenger/search');
            }}
          >
            Book another trip
          </button>
        </div>
      </div>

      <div className="card no-print" style={{ marginTop: 20 }}>
        <div className="card-title">Travel GPS tracking</div>
        <p className="text-sm text-muted" style={{ marginBottom: 10 }}>
          Route: {fromName} to {toName} · Tracker source: {gps.position.source === 'gps' ? 'Live GPS' : 'Simulated fallback'}
        </p>
        <MapEmbed
          height={280}
          pickup={fromName}
          dropoff={toName}
          label={`${fromName} → ${toName}`}
          livePosition={gps.position}
        />
        {gps.trackingError && <p className="text-xs" style={{ marginTop: 8, color: 'var(--warning)' }}>{gps.trackingError}</p>}
      </div>
    </DashboardLayout>
  );
}

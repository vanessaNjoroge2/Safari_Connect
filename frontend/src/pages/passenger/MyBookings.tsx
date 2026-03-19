import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { Badge } from '../../components/UI';
import type { BadgeVariant } from '../../types';
import { getMyBookingsApi } from '../../lib/api';
import { useToast } from '../../hooks/useToast';

interface BookingRow {
  id: string;
  ref: string; route: string; sacco: string;
  date: string; seat: string; fare: string;
  status: string; variant: BadgeVariant;
}

function mapBookingStatus(status: string): { text: string; variant: BadgeVariant } {
  if (status === 'CONFIRMED') return { text: 'Confirmed', variant: 'green' };
  if (status === 'PENDING') return { text: 'Awaiting payment', variant: 'amber' };
  if (status === 'CANCELLED') return { text: 'Cancelled', variant: 'red' };
  return { text: status, variant: 'gray' };
}

export default function MyBookings() {
  const navigate = useNavigate();
  const toast = useToast();
  const [rows, setRows] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const result = await getMyBookingsApi();
        const mapped = result.data.map((b) => {
          const mappedStatus = mapBookingStatus(b.status);
          return {
            id: b.id,
            ref: b.bookingCode,
            route: `${b.trip.route.origin} → ${b.trip.route.destination}`,
            sacco: b.trip.sacco.name,
            date: new Date(b.trip.departureTime).toLocaleDateString('en-KE', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            }),
            seat: `${b.seat.seatNumber} ${b.seat.seatClass}`,
            fare: `KES ${Number(b.amount).toLocaleString()}`,
            status: mappedStatus.text,
            variant: mappedStatus.variant,
          };
        });
        setRows(mapped);
      } catch (error) {
        toast((error as Error).message || 'Failed to load bookings', 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, [toast]);

  return (
    <DashboardLayout
      title="My bookings"
      subtitle="All your trip history and upcoming journeys"
      actions={<button className="btn btn-primary btn-sm" onClick={() => navigate('/passenger/search')}>+ Book new trip</button>}
    >
      {loading && <div className="card text-center">Loading bookings…</div>}

      {!loading && rows.length === 0 && (
        <div className="card text-center" style={{ padding: '28px 20px' }}>
          <h4 style={{ marginBottom: 8 }}>No bookings yet</h4>
          <p className="text-muted mb-3">Your confirmed and pending bookings will appear here.</p>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/passenger/search')}>Book first trip</button>
        </div>
      )}

      {!loading && rows.length > 0 && (
      <div className="table-wrap">
        <table className="sc-table">
          <thead>
            <tr>
              <th>Booking ref</th><th>Route</th><th>SACCO</th><th>Date</th>
              <th>Seat</th><th>Fare</th><th>Status</th><th>Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(b => (
              <tr key={b.id}>
                <td className="td-primary">{b.ref}</td>
                <td style={{ fontWeight:500 }}>{b.route}</td>
                <td>{b.sacco}</td>
                <td>{b.date}</td>
                <td>{b.seat}</td>
                <td style={{ fontWeight:600 }}>{b.fare}</td>
                <td><Badge variant={b.variant}>{b.status}</Badge></td>
                <td>
                  <button className="btn btn-sm" onClick={() => navigate(`/passenger/ticket?bookingId=${b.id}`)}>
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}
    </DashboardLayout>
  );
}

import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { getOwnerTripsApi } from '../../lib/api';
import { useToast } from '../../hooks/useToast';

export default function OwnerBookings() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [trips, setTrips] = useState<any[]>([]);

  const loadBookings = async (silent = false) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const result = await getOwnerTripsApi();
      setTrips(result.data || []);
    } catch (error) {
      toast((error as Error).message || 'Failed to load owner bookings', 'error');
    } finally {
      if (silent) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    void loadBookings();
  }, [toast]);

  const rows = useMemo(() => {
    const flattened: Array<any> = [];
    trips.forEach((trip) => {
      (trip.bookings || []).forEach((booking: any) => {
        flattened.push({
          id: booking.id,
          bookingCode: booking.bookingCode,
          route: trip.route ? `${trip.route.origin} -> ${trip.route.destination}` : '-',
          passengerName: `${booking.firstName || ''} ${booking.lastName || ''}`.trim() || '-',
          phone: booking.phone || '-',
          amount: Number(booking.amount) || 0,
          status: booking.status || '-',
          createdAt: booking.createdAt,
        });
      });
    });
    return flattened.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [trips]);

  return (
    <DashboardLayout
      title="Bookings"
      subtitle="All passenger reservations"
      actions={
        <button className="btn btn-primary btn-sm" disabled={refreshing} onClick={() => void loadBookings(true)}>
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      }
    >
      <div className="card">
        {loading && <p className="text-muted">Loading bookings from backend...</p>}

        {!loading && rows.length === 0 && <p className="text-muted">No booking records found for your trips.</p>}

        {!loading && rows.length > 0 && (
          <div className="table-wrap">
            <table className="sc-table">
              <thead>
                <tr>
                  <th>Booking ref</th>
                  <th>Passenger</th>
                  <th>Route</th>
                  <th>Phone</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 200).map((row) => (
                  <tr key={row.id}>
                    <td style={{ fontFamily: 'monospace' }}>{row.bookingCode}</td>
                    <td className="td-primary">{row.passengerName}</td>
                    <td>{row.route}</td>
                    <td>{row.phone}</td>
                    <td>KES {Math.round(row.amount).toLocaleString()}</td>
                    <td>{row.status}</td>
                    <td>{new Date(row.createdAt).toLocaleString('en-KE')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

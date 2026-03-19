import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { getOwnerTripsApi } from '../../lib/api';
import { useToast } from '../../hooks/useToast';

export default function OwnerCustomers() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [trips, setTrips] = useState<any[]>([]);

  const loadCustomers = async (silent = false) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const result = await getOwnerTripsApi();
      setTrips(result.data || []);
    } catch (error) {
      toast((error as Error).message || 'Failed to load customer records', 'error');
    } finally {
      if (silent) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    void loadCustomers();
  }, [toast]);

  const customers = useMemo(() => {
    const map = new Map<string, { name: string; phone: string; trips: number; spent: number }>();

    trips.forEach((trip) => {
      (trip.bookings || []).forEach((booking: any) => {
        const key = booking.phone || booking.bookingCode;
        const current = map.get(key) || {
          name: `${booking.firstName || ''} ${booking.lastName || ''}`.trim() || 'Unknown',
          phone: booking.phone || '-',
          trips: 0,
          spent: 0,
        };
        current.trips += 1;
        if (booking.status === 'CONFIRMED') {
          current.spent += Number(booking.amount) || 0;
        }
        map.set(key, current);
      });
    });

    return Array.from(map.values()).sort((a, b) => b.trips - a.trips);
  }, [trips]);

  return (
    <DashboardLayout
      title="Customers"
      subtitle="Passenger data and history"
      actions={
        <button className="btn btn-primary btn-sm" disabled={refreshing} onClick={() => void loadCustomers(true)}>
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      }
    >
      <div className="card">
        {loading && <p className="text-muted">Loading customers from backend...</p>}

        {!loading && customers.length === 0 && <p className="text-muted">No customer records found for this owner yet.</p>}

        {!loading && customers.length > 0 && (
          <div className="table-wrap">
            <table className="sc-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Phone</th>
                  <th>Trips</th>
                  <th>Confirmed spend</th>
                </tr>
              </thead>
              <tbody>
                {customers.slice(0, 200).map((customer) => (
                  <tr key={`${customer.phone}-${customer.name}`}>
                    <td className="td-primary">{customer.name}</td>
                    <td>{customer.phone}</td>
                    <td>{customer.trips}</td>
                    <td>KES {Math.round(customer.spent).toLocaleString()}</td>
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

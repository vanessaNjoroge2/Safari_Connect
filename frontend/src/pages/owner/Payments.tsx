import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { aiContextApi, getOwnerTripsApi } from '../../lib/api';
import { useToast } from '../../hooks/useToast';

export default function OwnerPayments() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [trips, setTrips] = useState<any[]>([]);
  const [revenueTrend, setRevenueTrend] = useState<Array<{ day: string; amount: number }>>([]);

  const loadPayments = async (silent = false) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const [tripsRes, ctxRes] = await Promise.all([getOwnerTripsApi(), aiContextApi()]);
      setTrips(tripsRes.data || []);
      setRevenueTrend((ctxRes.data.analytics?.revenueTrend || []).map((r) => ({ day: r.day, amount: r.amount })));
    } catch (error) {
      toast((error as Error).message || 'Failed to load owner payments data', 'error');
    } finally {
      if (silent) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    void loadPayments();
  }, [toast]);

  const stats = useMemo(() => {
    let total = 0;
    let pending = 0;
    let confirmed = 0;
    let cancelled = 0;

    trips.forEach((trip) => {
      (trip.bookings || []).forEach((booking: any) => {
        const amount = Number(booking.amount) || 0;
        if (booking.status === 'CONFIRMED') {
          total += amount;
          confirmed += 1;
        } else if (booking.status === 'PENDING') {
          pending += 1;
        } else if (booking.status === 'CANCELLED') {
          cancelled += 1;
        }
      });
    });

    return { total, pending, confirmed, cancelled };
  }, [trips]);

  return (
    <DashboardLayout
      title="Payments"
      subtitle="Payment tracking and withdrawals"
      actions={
        <button className="btn btn-primary btn-sm" disabled={refreshing} onClick={() => void loadPayments(true)}>
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      }
    >
      <div className="stat-grid mb-6">
        <div className="stat-tile"><div className="stat-label">Confirmed revenue</div><div className="stat-value">KES {Math.round(stats.total).toLocaleString()}</div></div>
        <div className="stat-tile"><div className="stat-label">Confirmed bookings</div><div className="stat-value">{stats.confirmed}</div></div>
        <div className="stat-tile"><div className="stat-label">Pending payments</div><div className="stat-value">{stats.pending}</div></div>
        <div className="stat-tile"><div className="stat-label">Cancelled bookings</div><div className="stat-value">{stats.cancelled}</div></div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-title">Revenue trend (7 days)</div>
          {loading && <p className="text-muted">Loading payment trend...</p>}
          {!loading && revenueTrend.length === 0 && <p className="text-muted">No revenue trend records from backend yet.</p>}
          {!loading && revenueTrend.length > 0 && (
            <div className="table-wrap">
              <table className="sc-table">
                <thead>
                  <tr><th>Day</th><th>Amount</th></tr>
                </thead>
                <tbody>
                  {revenueTrend.map((row) => (
                    <tr key={row.day}>
                      <td className="td-primary">{row.day}</td>
                      <td>KES {Math.round(row.amount).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-title">Payment status logic</div>
          <p className="text-sm text-muted" style={{ marginBottom: 10 }}>
            Booking and payment statuses are backend-authoritative. Revenue totals include confirmed bookings only.
          </p>
          <ul className="text-sm text-muted" style={{ margin: 0, paddingLeft: 18 }}>
            <li>Confirmed booking contributes to revenue.</li>
            <li>Pending booking tracked as awaiting payment confirmation.</li>
            <li>Cancelled booking excluded from revenue.</li>
          </ul>
        </div>
      </div>
    </DashboardLayout>
  );
}

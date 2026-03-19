import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { Badge, Modal } from '../../components/UI';
import { useToast } from '../../hooks/useToast';
import { getAdminBookingsApi } from '../../lib/api';
import type { BadgeVariant } from '../../types';

interface Booking {
  id: string;
  ref: string;
  passenger: string;
  route: string;
  sacco: string;
  date: string;
  seat: string;
  fare: string;
  status: string;
  variant: BadgeVariant;
  payment: string;
}

const FILTERS = ['All', 'Upcoming', 'On Route', 'Completed', 'Cancelled', 'Disputed'];

const statusToBadge: Record<string, BadgeVariant> = {
  Upcoming: 'amber',
  'On Route': 'blue',
  Completed: 'gray',
  Cancelled: 'red',
  Disputed: 'red',
};

const statusToApiFilter: Record<string, 'ALL' | 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'EXPIRED'> = {
  All: 'ALL',
  Upcoming: 'PENDING',
  'On Route': 'CONFIRMED',
  Completed: 'CONFIRMED',
  Cancelled: 'CANCELLED',
  Disputed: 'PENDING',
};

export default function AdminBookings() {
  const toast = useToast();
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Booking[]>([]);
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      setLoading(true);
      try {
        const response = await getAdminBookingsApi({
          status: statusToApiFilter[filter],
          q: search.trim() || undefined,
          limit: 300,
        });

        if (!mounted) return;

        const mapped = response.data
          .map((item) => ({
            id: item.id,
            ref: item.bookingCode,
            passenger: item.passengerName,
            route: item.route,
            sacco: item.saccoName,
            date: new Date(item.createdAt).toLocaleDateString('en-KE', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            }),
            seat: item.seatLabel,
            fare: `KES ${Math.round(item.amount).toLocaleString()}`,
            status: item.statusLabel,
            variant: statusToBadge[item.statusLabel] || 'gray',
            payment: item.paymentLabel,
          }))
          .filter((item) => (filter === 'Disputed' ? item.status === 'Disputed' : true));

        setRows(mapped);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void run();
    return () => {
      mounted = false;
    };
  }, [filter, search]);

  const visible = useMemo(() => rows, [rows]);

  const exportCsv = () => {
    if (visible.length === 0) {
      toast('No bookings to export', 'warning');
      return;
    }

    const headers = ['Booking Ref', 'Passenger', 'Route', 'SACCO', 'Date', 'Seat', 'Fare', 'Payment', 'Status'];
    const escapeValue = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
    const lines = [
      headers.map(escapeValue).join(','),
      ...visible.map((b) => [
        b.ref,
        b.passenger,
        b.route,
        b.sacco,
        b.date,
        b.seat,
        b.fare,
        b.payment,
        b.status,
      ].map(escapeValue).join(',')),
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bookings-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast('Bookings exported', 'success');
  };

  return (
    <DashboardLayout
      title="Booking Oversight"
      subtitle="All platform bookings — monitor, filter, and investigate"
      actions={<button className="btn btn-primary btn-sm" onClick={exportCsv}>Export</button>}
    >
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <input className="input" placeholder="Search by ref, passenger, route…"
          style={{ maxWidth: 280, fontSize: 13 }}
          value={search} onChange={e => setSearch(e.target.value)} />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {FILTERS.map(f => (
            <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setFilter(f)}>{f}</button>
          ))}
        </div>
        <span className="text-muted" style={{ fontSize: 12, marginLeft: 'auto' }}>{loading ? 'Loading...' : `${visible.length} results`}</span>
      </div>

      <div className="table-wrap">
        <table className="sc-table">
          <thead>
            <tr><th>Booking ref</th><th>Passenger</th><th>Route</th><th>SACCO</th>
              <th>Date</th><th>Seat</th><th>Fare</th><th>Payment</th><th>Status</th><th>Action</th></tr>
          </thead>
          <tbody>
            {visible.map(b => (
              <tr key={b.ref}>
                <td className="td-primary" style={{ fontFamily:'monospace', fontSize:12 }}>{b.ref}</td>
                <td style={{ fontWeight:500 }}>{b.passenger}</td>
                <td>{b.route}</td>
                <td>{b.sacco}</td>
                <td>{b.date}</td>
                <td style={{ fontSize:12 }}>{b.seat}</td>
                <td style={{ fontWeight:600 }}>{b.fare}</td>
                <td style={{ fontSize:12, color: b.payment.includes('✓') ? 'var(--brand)' : b.payment==='Refunded' ? 'var(--warning)' : 'var(--danger)' }}>
                  {b.payment}
                </td>
                <td><Badge variant={b.variant}>{b.status}</Badge></td>
                <td><button className="btn btn-sm" onClick={() => setActiveBooking(b)}>View</button></td>
              </tr>
            ))}
            {!loading && visible.length === 0 && (
              <tr><td colSpan={10} style={{ textAlign:'center', color:'var(--gray-400)', padding:32 }}>No bookings match this filter.</td></tr>
            )}
            {loading && (
              <tr><td colSpan={10} style={{ textAlign:'center', color:'var(--gray-400)', padding:32 }}>Loading bookings...</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={Boolean(activeBooking)}
        onClose={() => setActiveBooking(null)}
        title="Booking details"
        width={520}
      >
        {activeBooking && (
          <div style={{ padding: 20, display: 'grid', gap: 12, fontSize: 13 }}>
            <div><strong>Booking ref:</strong> {activeBooking.ref}</div>
            <div><strong>Passenger:</strong> {activeBooking.passenger}</div>
            <div><strong>Route:</strong> {activeBooking.route}</div>
            <div><strong>SACCO:</strong> {activeBooking.sacco}</div>
            <div><strong>Date:</strong> {activeBooking.date}</div>
            <div><strong>Seat:</strong> {activeBooking.seat}</div>
            <div><strong>Fare:</strong> {activeBooking.fare}</div>
            <div><strong>Payment:</strong> {activeBooking.payment}</div>
            <div><strong>Status:</strong> {activeBooking.status}</div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}

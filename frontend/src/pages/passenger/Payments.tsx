import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { Badge } from '../../components/UI';
import type { BadgeVariant } from '../../types';
import { getMyBookingsApi } from '../../lib/api';
import { useToast } from '../../hooks/useToast';

interface PayRow {
  id: string;
  ref: string; bookingRef: string; route: string;
  date: string; method: string; amount: string;
  status: string; variant: BadgeVariant;
  mpesaCode: string;
}

function mapPaymentStatus(status: string): { text: string; variant: BadgeVariant } {
  if (status === 'SUCCESS') return { text: 'Confirmed', variant: 'green' };
  if (status === 'PENDING') return { text: 'Pending', variant: 'amber' };
  if (status === 'FAILED') return { text: 'Failed', variant: 'red' };
  return { text: status || 'Not started', variant: 'gray' };
}

export default function PassengerPayments() {
  const toast = useToast();
  const [rows, setRows] = useState<PayRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const result = await getMyBookingsApi();
        const mapped = result.data.map((b, idx) => {
          const pay = mapPaymentStatus(b.payment?.status || 'PENDING');
          return {
            id: b.id,
            ref: `PAY-${String(idx + 1).padStart(6, '0')}`,
            bookingRef: b.bookingCode,
            route: `${b.trip.route.origin} → ${b.trip.route.destination}`,
            date: new Date(b.createdAt).toLocaleDateString('en-KE', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            }),
            method: 'M-Pesa',
            amount: `KES ${Number(b.amount).toLocaleString()}`,
            status: pay.text,
            variant: pay.variant,
            mpesaCode: b.payment?.transactionRef || '—',
          };
        });

        setRows(mapped);
      } catch (error) {
        toast((error as Error).message || 'Failed to load payment history', 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, [toast]);

  const total = useMemo(() => {
    return rows
      .filter((p) => p.status !== 'Refunded' && p.status !== 'Failed')
      .reduce((sum, p) => sum + Number(p.amount.replace(/[^0-9]/g, '') || 0), 0);
  }, [rows]);

  return (
    <DashboardLayout
      title="My payments"
      subtitle="Your M-Pesa transaction history with SafiriConnect"
    >
      {/* Summary strip */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, marginBottom:28 }}>
        {[
          { label:'Total spent',      value:`KES ${total.toLocaleString()}`, sub:'All time' },
          { label:'Transactions',     value:rows.length,                     sub:'All time' },
          { label:'Last payment',     value:rows[0]?.amount ?? 'KES 0',      sub:rows[0]?.date ?? '—' },
        ].map(c => (
          <div key={c.label} className="card" style={{ padding:'20px 24px' }}>
            <div className="kpi-label">{c.label}</div>
            <div className="kpi-value">{c.value}</div>
            <div className="text-xs text-muted mt-1">{c.sub}</div>
          </div>
        ))}
      </div>

      {loading && <div className="card text-center">Loading payments…</div>}

      {!loading && rows.length === 0 && (
        <div className="card text-center" style={{ padding: '28px 20px' }}>
          <h4 style={{ marginBottom: 8 }}>No payments yet</h4>
          <p className="text-muted">Your M-Pesa transactions will appear here once you complete payment.</p>
        </div>
      )}

      {/* Transactions table */}
      {!loading && rows.length > 0 && (
      <div className="table-wrap">
        <table className="sc-table">
          <thead>
            <tr>
              <th>Transaction ID</th>
              <th>Booking ref</th>
              <th>Route</th>
              <th>Date</th>
              <th>Method</th>
              <th>M-Pesa code</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(p => (
              <tr key={p.id}>
                <td className="td-primary" style={{ fontFamily:'monospace', fontSize:12 }}>{p.ref}</td>
                <td style={{ fontFamily:'monospace', fontSize:12, color:'var(--gray-500)' }}>{p.bookingRef}</td>
                <td style={{ fontWeight:500 }}>{p.route}</td>
                <td>{p.date}</td>
                <td>
                  <span style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:13, fontWeight:600, color:'var(--brand)' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" fill="#00bf63" opacity=".15"/>
                      <text x="12" y="16" textAnchor="middle" fontSize="10" fill="#00bf63" fontWeight="bold">M</text>
                    </svg>
                    {p.method}
                  </span>
                </td>
                <td style={{ fontFamily:'monospace', fontSize:12, letterSpacing:'.5px' }}>{p.mpesaCode}</td>
                <td style={{ fontWeight:700 }}>{p.amount}</td>
                <td><Badge variant={p.variant}>{p.status}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}

      <p className="text-xs text-muted mt-3" style={{ display:'flex', alignItems:'center', gap:6 }}>
        🔒 All payments processed securely via Safaricom M-Pesa. For disputes contact{' '}
        <strong>support@safiriconnect.co.ke</strong>
      </p>
    </DashboardLayout>
  );
}

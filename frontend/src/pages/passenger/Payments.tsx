import DashboardLayout from '../../components/DashboardLayout';
import { Badge } from '../../components/UI';
import type { BadgeVariant } from '../../types';

interface PayRow {
  ref: string; bookingRef: string; route: string;
  date: string; method: string; amount: string;
  status: string; variant: BadgeVariant;
  mpesaCode: string;
}

const PAYMENTS: PayRow[] = [
  { ref:'PAY-20260318-001', bookingRef:'SC-2026-00892', route:'Nairobi → Nakuru',  date:'18 Mar 2026', method:'M-Pesa', amount:'KES 850',   status:'Confirmed', variant:'green', mpesaCode:'RGK7YX2891' },
  { ref:'PAY-20260318-002', bookingRef:'SC-2026-00788', route:'Nairobi → Mombasa', date:'18 Mar 2026', method:'M-Pesa', amount:'KES 2,200', status:'Confirmed', variant:'green', mpesaCode:'RGK8MN3012' },
  { ref:'PAY-20260310-003', bookingRef:'SC-2026-00541', route:'Nairobi → Kisumu',  date:'10 Mar 2026', method:'M-Pesa', amount:'KES 1,100', status:'Confirmed', variant:'green', mpesaCode:'RGJ4PQ1234' },
  { ref:'PAY-20260302-004', bookingRef:'SC-2026-00399', route:'Nairobi → Nakuru',  date:'2 Mar 2026',  method:'M-Pesa', amount:'KES 1,200', status:'Confirmed', variant:'green', mpesaCode:'RGH2AB5678' },
  { ref:'PAY-20260214-005', bookingRef:'SC-2026-00211', route:'Nairobi → Eldoret', date:'14 Feb 2026', method:'M-Pesa', amount:'KES 900',   status:'Refunded',  variant:'amber', mpesaCode:'RGF9CD9012' },
];

const total = PAYMENTS.filter(p => p.status !== 'Refunded').reduce((sum, p) => {
  const n = parseInt(p.amount.replace(/[^0-9]/g, ''), 10);
  return sum + n;
}, 0);

export default function PassengerPayments() {
  return (
    <DashboardLayout
      title="My payments"
      subtitle="Your M-Pesa transaction history with SafiriConnect"
    >
      {/* Summary strip */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, marginBottom:28 }}>
        {[
          { label:'Total spent',      value:`KES ${total.toLocaleString()}`, sub:'All time' },
          { label:'Transactions',     value:PAYMENTS.length,                 sub:'All time' },
          { label:'Last payment',     value:'KES 2,200',                     sub:'18 Mar 2026' },
        ].map(c => (
          <div key={c.label} className="card" style={{ padding:'20px 24px' }}>
            <div className="kpi-label">{c.label}</div>
            <div className="kpi-value">{c.value}</div>
            <div className="text-xs text-muted mt-1">{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Transactions table */}
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
            {PAYMENTS.map(p => (
              <tr key={p.ref}>
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

      <p className="text-xs text-muted mt-3" style={{ display:'flex', alignItems:'center', gap:6 }}>
        🔒 All payments processed securely via Safaricom M-Pesa. For disputes contact{' '}
        <strong>support@safiriconnect.co.ke</strong>
      </p>
    </DashboardLayout>
  );
}

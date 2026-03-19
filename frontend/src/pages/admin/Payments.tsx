import { useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { Badge, StatTile } from '../../components/UI';
import type { BadgeVariant } from '../../types';

interface PayRow {
  txId: string; bookingRef: string; passenger: string; sacco: string;
  route: string; date: string; amount: string; commission: string;
  mpesaCode: string; status: string; variant: BadgeVariant;
}

const PAYMENTS: PayRow[] = [
  { txId:'PAY-20260318-001', bookingRef:'SC-2026-00892', passenger:'Virginia Wamaitha', sacco:'Modern Coast', route:'Nairobi → Nakuru',  date:'18 Mar 2026', amount:'KES 850',   commission:'KES 43',  mpesaCode:'RGK7YX2891', status:'Settled',  variant:'green' },
  { txId:'PAY-20260318-002', bookingRef:'SC-2026-00891', passenger:'James Kariuki',     sacco:'Easy Coach',   route:'Nairobi → Mombasa', date:'18 Mar 2026', amount:'KES 2,200', commission:'KES 110', mpesaCode:'RGK8MN3012', status:'Settled',  variant:'green' },
  { txId:'PAY-20260317-003', bookingRef:'SC-2026-00890', passenger:'Faith Njeri',       sacco:'Modern Coast', route:'Nairobi → Kisumu',  date:'17 Mar 2026', amount:'KES 1,100', commission:'KES 55',  mpesaCode:'RGJ4PQ1234', status:'Settled',  variant:'green' },
  { txId:'PAY-20260317-004', bookingRef:'SC-2026-00889', passenger:'Peter Odhiambo',    sacco:'Eldoret Exp.', route:'Nairobi → Eldoret', date:'17 Mar 2026', amount:'KES 1,200', commission:'KES 60',  mpesaCode:'RGJ2AB5678', status:'Settled',  variant:'green' },
  { txId:'PAY-20260316-005', bookingRef:'SC-2026-00887', passenger:'Samuel Mutua',      sacco:'City Express', route:'Nairobi → Nakuru',  date:'16 Mar 2026', amount:'KES 850',   commission:'KES 43',  mpesaCode:'RGI9CD9012', status:'Refunded', variant:'amber' },
  { txId:'PAY-20260315-006', bookingRef:'SC-2026-00885', passenger:'Brian Kimani',      sacco:'Modern Coast', route:'Nairobi → Kisumu',  date:'15 Mar 2026', amount:'KES 1,800', commission:'KES 90',  mpesaCode:'RGH3EF3456', status:'Disputed', variant:'red'   },
  { txId:'PAY-20260315-007', bookingRef:'SC-2026-00884', passenger:'Grace Muthoni',     sacco:'Eldoret Exp.', route:'Nairobi → Eldoret', date:'15 Mar 2026', amount:'KES 900',   commission:'KES 45',  mpesaCode:'RGH1GH7890', status:'Settled',  variant:'green' },
  { txId:'PAY-20260314-008', bookingRef:'SC-2026-00883', passenger:'Kevin Otieno',      sacco:'Modern Coast', route:'Nairobi → Nakuru',  date:'14 Mar 2026', amount:'KES 850',   commission:'KES 43',  mpesaCode:'RGG5IJ1234', status:'Settled',  variant:'green' },
];

const FILTERS = ['All', 'Settled', 'Refunded', 'Disputed'];

export default function AdminPayments() {
  const [filter, setFilter] = useState('All');

  const visible = PAYMENTS.filter(p => filter === 'All' || p.status === filter);
  const totalRevenue = PAYMENTS.filter(p=>p.status==='Settled').reduce((a,p)=>a+parseInt(p.amount.replace(/[^0-9]/g,'')),0);
  const totalCommission = PAYMENTS.filter(p=>p.status==='Settled').reduce((a,p)=>a+parseInt(p.commission.replace(/[^0-9]/g,'')),0);

  return (
    <DashboardLayout
      title="Payments Overview"
      subtitle="All M-Pesa transactions — revenue, commissions, refunds, disputes"
      actions={<button className="btn btn-primary btn-sm">Export CSV</button>}
    >
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:24 }}>
        <StatTile label="Total Revenue (shown)" value={`KES ${totalRevenue.toLocaleString()}`} sub="Settled only" />
        <StatTile label="Platform Commission"   value={`KES ${totalCommission.toLocaleString()}`} sub="5% avg rate" />
        <StatTile label="Refunds"               value={PAYMENTS.filter(p=>p.status==='Refunded').length} sub="This period" />
        <StatTile label="Disputes"              value={PAYMENTS.filter(p=>p.status==='Disputed').length} sub="Needs review" />
      </div>

      <div style={{ display:'flex', gap:8, marginBottom:16 }}>
        {FILTERS.map(f => (
          <button key={f} className={`btn btn-sm ${filter===f ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setFilter(f)}>{f}</button>
        ))}
      </div>

      <div className="table-wrap">
        <table className="sc-table">
          <thead>
            <tr><th>Transaction</th><th>Booking ref</th><th>Passenger</th><th>SACCO</th>
              <th>Route</th><th>Date</th><th>Amount</th><th>Commission</th><th>M-Pesa code</th><th>Status</th></tr>
          </thead>
          <tbody>
            {visible.map(p => (
              <tr key={p.txId}>
                <td className="td-primary" style={{ fontFamily:'monospace', fontSize:11 }}>{p.txId}</td>
                <td style={{ fontFamily:'monospace', fontSize:11, color:'var(--gray-500)' }}>{p.bookingRef}</td>
                <td style={{ fontWeight:500, fontSize:13 }}>{p.passenger}</td>
                <td style={{ fontSize:13 }}>{p.sacco}</td>
                <td style={{ fontSize:13 }}>{p.route}</td>
                <td style={{ fontSize:12, color:'var(--gray-500)' }}>{p.date}</td>
                <td style={{ fontWeight:700 }}>{p.amount}</td>
                <td style={{ fontWeight:600, color:'var(--brand)' }}>{p.commission}</td>
                <td style={{ fontFamily:'monospace', fontSize:12, letterSpacing:'.5px' }}>{p.mpesaCode}</td>
                <td><Badge variant={p.variant}>{p.status}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}

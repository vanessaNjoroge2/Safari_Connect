import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { Badge, StatTile } from '../../components/UI';
import { useToast } from '../../hooks/useToast';
import { getAdminPaymentsApi } from '../../lib/api';
import type { BadgeVariant } from '../../types';

interface PayRow {
  txId: string;
  bookingRef: string;
  passenger: string;
  sacco: string;
  route: string;
  date: string;
  amount: number;
  commission: number;
  mpesaCode: string;
  status: string;
  variant: BadgeVariant;
}

const FILTERS = ['All', 'Settled', 'Refunded', 'Disputed'];

const statusToApiFilter: Record<string, 'ALL' | 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED'> = {
  All: 'ALL',
  Settled: 'SUCCESS',
  Refunded: 'REFUNDED',
  Disputed: 'FAILED',
};

const statusToVariant: Record<string, BadgeVariant> = {
  Settled: 'green',
  Refunded: 'amber',
  Disputed: 'red',
  Pending: 'blue',
};

export default function AdminPayments() {
  const toast = useToast();
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<PayRow[]>([]);

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      setLoading(true);
      try {
        const response = await getAdminPaymentsApi({
          status: statusToApiFilter[filter],
          limit: 300,
        });

        if (!mounted) return;

        const mapped: PayRow[] = response.data.map((item) => ({
          txId: item.id,
          bookingRef: item.bookingCode,
          passenger: item.passengerName,
          sacco: item.saccoName,
          route: item.route,
          date: new Date(item.createdAt).toLocaleDateString('en-KE', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          }),
          amount: item.amount,
          commission: item.commission,
          mpesaCode: item.transactionRef,
          status: item.statusLabel,
          variant: statusToVariant[item.statusLabel] || 'gray',
        }));

        setRows(mapped);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void run();
    return () => {
      mounted = false;
    };
  }, [filter]);

  const visible = useMemo(() => rows, [rows]);
  const totalRevenue = useMemo(
    () => visible.filter((p) => p.status === 'Settled').reduce((a, p) => a + p.amount, 0),
    [visible]
  );
  const totalCommission = useMemo(
    () => visible.filter((p) => p.status === 'Settled').reduce((a, p) => a + p.commission, 0),
    [visible]
  );

  const exportCsv = () => {
    if (visible.length === 0) {
      toast('No payments to export', 'warning');
      return;
    }

    const headers = ['Transaction', 'Booking Ref', 'Passenger', 'SACCO', 'Route', 'Date', 'Amount', 'Commission', 'M-Pesa Code', 'Status'];
    const escapeValue = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
    const lines = [
      headers.map(escapeValue).join(','),
      ...visible.map((p) => [
        p.txId,
        p.bookingRef,
        p.passenger,
        p.sacco,
        p.route,
        p.date,
        Math.round(p.amount),
        Math.round(p.commission),
        p.mpesaCode,
        p.status,
      ].map(escapeValue).join(',')),
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `payments-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast('Payments exported', 'success');
  };

  return (
    <DashboardLayout
      title="Payments Overview"
      subtitle="All M-Pesa transactions — revenue, commissions, refunds, disputes"
      actions={<button className="btn btn-primary btn-sm" onClick={exportCsv}>Export CSV</button>}
    >
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:24 }}>
        <StatTile label="Total Revenue (shown)" value={`KES ${totalRevenue.toLocaleString()}`} sub="Settled only" />
        <StatTile label="Platform Commission"   value={`KES ${totalCommission.toLocaleString()}`} sub="5% avg rate" />
        <StatTile label="Refunds"               value={visible.filter(p=>p.status==='Refunded').length} sub="This period" />
        <StatTile label="Disputes"              value={visible.filter(p=>p.status==='Disputed').length} sub="Needs review" />
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
                <td style={{ fontWeight:700 }}>{`KES ${Math.round(p.amount).toLocaleString()}`}</td>
                <td style={{ fontWeight:600, color:'var(--brand)' }}>{`KES ${Math.round(p.commission).toLocaleString()}`}</td>
                <td style={{ fontFamily:'monospace', fontSize:12, letterSpacing:'.5px' }}>{p.mpesaCode}</td>
                <td><Badge variant={p.variant}>{p.status}</Badge></td>
              </tr>
            ))}
            {loading && (
              <tr><td colSpan={10} style={{ textAlign:'center', color:'var(--gray-400)', padding:32 }}>Loading payments...</td></tr>
            )}
            {!loading && visible.length === 0 && (
              <tr><td colSpan={10} style={{ textAlign:'center', color:'var(--gray-400)', padding:32 }}>No payments found for this filter.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}

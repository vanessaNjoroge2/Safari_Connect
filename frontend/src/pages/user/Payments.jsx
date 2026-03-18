import { useState } from 'react';
import { Badge } from '../../components/UI';

const PAYMENTS = [
  { id: 'PAY-001', date: '2026-03-18', route: 'Nairobi → Nakuru', amount: 1050, ref: 'SCI3K7M9XZ', status: 'Completed', method: 'M-Pesa' },
  { id: 'PAY-002', date: '2026-03-15', route: 'Nairobi → Mombasa', amount: 1500, ref: 'SCJ8R2P4QW', status: 'Completed', method: 'M-Pesa' },
  { id: 'PAY-003', date: '2026-03-12', route: 'Nairobi → Kisumu', amount: 1100, ref: 'SCL5N0V6YT', status: 'Completed', method: 'M-Pesa' },
  { id: 'PAY-004', date: '2026-03-10', route: 'Nakuru → Eldoret', amount: 780, ref: 'SCF1H8B3KM', status: 'Completed', method: 'M-Pesa' },
  { id: 'PAY-005', date: '2026-03-08', route: 'Nairobi → Nakuru', amount: 850, ref: 'SCA4D9G7UX', status: 'Completed', method: 'M-Pesa' },
  { id: 'PAY-006', date: '2026-03-06', route: 'Nairobi → Thika', amount: 250, ref: 'SCE2W5J0RP', status: 'Failed', method: 'M-Pesa' },
  { id: 'PAY-007', date: '2026-03-04', route: 'Mombasa → Nairobi', amount: 1500, ref: null, status: 'Pending', method: 'M-Pesa' },
];

const STATUS_VARIANT = { Completed: 'green', Pending: 'amber', Failed: 'red' };

export default function UserPayments() {
  const [filter, setFilter] = useState('All');

  const filtered = filter === 'All' ? PAYMENTS : PAYMENTS.filter(p => p.status === filter);
  const total = PAYMENTS.filter(p => p.status === 'Completed').reduce((s, p) => s + p.amount, 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Payments</div>
          <div className="page-sub">Your complete payment history</div>
        </div>
      </div>
      <div className="page-body">
        {/* Summary cards */}
        <div className="three-col" style={{ marginBottom: 24 }}>
          <div className="card card-sm" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--gray-400)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Total Spent</div>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 26, fontWeight: 800, color: 'var(--green)' }}>KES {total.toLocaleString()}</div>
          </div>
          <div className="card card-sm" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--gray-400)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Total Transactions</div>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 26, fontWeight: 800 }}>{PAYMENTS.length}</div>
          </div>
          <div className="card card-sm" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--gray-400)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Successful</div>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 26, fontWeight: 800, color: 'var(--green)' }}>{PAYMENTS.filter(p => p.status === 'Completed').length}</div>
          </div>
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {['All', 'Completed', 'Pending', 'Failed'].map(f => (
            <button
              key={f}
              className={`btn btn-sm${filter === f ? ' btn-primary' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Payments list */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="payments-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Route</th>
                <th>Amount</th>
                <th>M-Pesa Ref</th>
                <th>Method</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600 }}>{p.date}</td>
                  <td>{p.route}</td>
                  <td style={{ fontWeight: 700 }}>KES {p.amount.toLocaleString()}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{p.ref || '—'}</td>
                  <td>{p.method}</td>
                  <td><Badge variant={STATUS_VARIANT[p.status] || 'gray'}>{p.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--gray-400)' }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>💳</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>No {filter.toLowerCase()} payments found</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

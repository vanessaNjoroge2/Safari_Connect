import { useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { Badge } from '../../components/UI';
import type { BadgeVariant } from '../../types';

interface Booking {
  ref: string; passenger: string; route: string; sacco: string;
  date: string; seat: string; fare: string;
  status: string; variant: BadgeVariant; payment: string;
}

const ALL_BOOKINGS: Booking[] = [
  { ref:'SC-2026-00892', passenger:'Virginia Wamaitha', route:'Nairobi → Nakuru',  sacco:'Modern Coast', date:'18 Mar 2026', seat:'14B Economy', fare:'KES 850',   status:'Upcoming',  variant:'amber', payment:'M-Pesa ✓' },
  { ref:'SC-2026-00891', passenger:'James Kariuki',     route:'Nairobi → Mombasa', sacco:'Easy Coach',   date:'18 Mar 2026', seat:'5A VIP',      fare:'KES 2,200', status:'On Route',  variant:'blue',  payment:'M-Pesa ✓' },
  { ref:'SC-2026-00890', passenger:'Faith Njeri',       route:'Nairobi → Kisumu',  sacco:'Modern Coast', date:'17 Mar 2026', seat:'22C Economy', fare:'KES 1,100', status:'Completed', variant:'gray',  payment:'M-Pesa ✓' },
  { ref:'SC-2026-00889', passenger:'Peter Odhiambo',    route:'Nairobi → Eldoret', sacco:'Eldoret Exp.', date:'17 Mar 2026', seat:'8A Business', fare:'KES 1,200', status:'Completed', variant:'gray',  payment:'M-Pesa ✓' },
  { ref:'SC-2026-00888', passenger:'Lucy Wanjiru',      route:'Mombasa → Malindi', sacco:'Coast Bus',    date:'17 Mar 2026', seat:'3B Economy',  fare:'KES 450',   status:'Completed', variant:'gray',  payment:'M-Pesa ✓' },
  { ref:'SC-2026-00887', passenger:'Samuel Mutua',      route:'Nairobi → Nakuru',  sacco:'City Express', date:'16 Mar 2026', seat:'11D Economy', fare:'KES 850',   status:'Cancelled', variant:'red',   payment:'Refunded'  },
  { ref:'SC-2026-00886', passenger:'Diana Achieng',     route:'Nairobi → Mombasa', sacco:'Easy Coach',   date:'16 Mar 2026', seat:'7C Business', fare:'KES 1,500', status:'Completed', variant:'gray',  payment:'M-Pesa ✓' },
  { ref:'SC-2026-00885', passenger:'Brian Kimani',      route:'Nairobi → Kisumu',  sacco:'Modern Coast', date:'15 Mar 2026', seat:'2A VIP',      fare:'KES 1,800', status:'Disputed',  variant:'red',   payment:'Pending'   },
  { ref:'SC-2026-00884', passenger:'Grace Muthoni',     route:'Nairobi → Eldoret', sacco:'Eldoret Exp.', date:'15 Mar 2026', seat:'19B Economy', fare:'KES 900',   status:'Completed', variant:'gray',  payment:'M-Pesa ✓' },
  { ref:'SC-2026-00883', passenger:'Kevin Otieno',      route:'Nairobi → Nakuru',  sacco:'Modern Coast', date:'14 Mar 2026', seat:'6C Economy',  fare:'KES 850',   status:'Completed', variant:'gray',  payment:'M-Pesa ✓' },
];

const FILTERS = ['All', 'Upcoming', 'On Route', 'Completed', 'Cancelled', 'Disputed'];

export default function AdminBookings() {
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  const visible = ALL_BOOKINGS.filter(b => {
    const matchFilter = filter === 'All' || b.status === filter;
    const q = search.toLowerCase();
    const matchSearch = !q || b.ref.toLowerCase().includes(q) ||
      b.passenger.toLowerCase().includes(q) || b.route.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  return (
    <DashboardLayout
      title="Booking Oversight"
      subtitle="All platform bookings — monitor, filter, and investigate"
      actions={<button className="btn btn-primary btn-sm">Export</button>}
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
        <span className="text-muted" style={{ fontSize: 12, marginLeft: 'auto' }}>{visible.length} results</span>
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
                <td><button className="btn btn-sm">View</button></td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr><td colSpan={10} style={{ textAlign:'center', color:'var(--gray-400)', padding:32 }}>No bookings match this filter.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}

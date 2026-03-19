import { useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { Badge, AiBanner } from '../../components/UI';
import type { BadgeVariant } from '../../types';

interface Sacco {
  id: string; name: string; owner: string; email: string;
  routes: number; vehicles: number; bookings: string; revenue: string;
  status: string; variant: BadgeVariant; joined: string; rating: number;
}

const SACCOS: Sacco[] = [
  { id:'SACCO-001', name:'Easy Coach Ltd',      owner:'David Ngugi',   email:'admin@easycoach.co.ke',   routes:8, vehicles:24, bookings:'2,840', revenue:'KES 4.3M', status:'Active',  variant:'green',  joined:'Sep 2025', rating:4.8 },
  { id:'SACCO-002', name:'Modern Coast Sacco',  owner:'Grace Omollo',  email:'ops@moderncoast.co.ke',   routes:6, vehicles:18, bookings:'2,210', revenue:'KES 1.9M', status:'Active',  variant:'green',  joined:'Oct 2025', rating:4.6 },
  { id:'SACCO-003', name:'Eldoret Express',      owner:'Paul Ruto',     email:'fleet@eldoretexp.co.ke',  routes:4, vehicles:12, bookings:'1,340', revenue:'KES 1.2M', status:'Active',  variant:'green',  joined:'Nov 2025', rating:4.3 },
  { id:'SACCO-004', name:'City Express',         owner:'Anne Muthoni',  email:'city.exp@gmail.com',      routes:5, vehicles:10, bookings:'1,120', revenue:'KES 950K', status:'Active',  variant:'green',  joined:'Dec 2025', rating:4.1 },
  { id:'SACCO-005', name:'Coast Bus Services',   owner:'Ali Hassan',    email:'coast.bus@gmail.com',     routes:3, vehicles:8,  bookings:'890',   revenue:'KES 535K', status:'Active',  variant:'green',  joined:'Jan 2026', rating:4.4 },
  { id:'SACCO-006', name:'Transline Classic',    owner:'John Waweru',   email:'transline@gmail.com',     routes:0, vehicles:0,  bookings:'0',     revenue:'—',        status:'Pending', variant:'amber',  joined:'Mar 2026', rating:0   },
  { id:'SACCO-007', name:'Nairobi Shuttle Co.',  owner:'Mary Adhiambo', email:'nbi.shuttle@gmail.com',   routes:0, vehicles:0,  bookings:'0',     revenue:'—',        status:'Pending', variant:'amber',  joined:'Mar 2026', rating:0   },
  { id:'SACCO-008', name:'Rift Valley Express',  owner:'Thomas Kiptoo', email:'rve.ops@gmail.com',       routes:7, vehicles:15, bookings:'980',   revenue:'KES 882K', status:'Suspended',variant:'red',  joined:'Oct 2025', rating:3.2 },
];

export default function AdminSaccos() {
  const [status, setStatus] = useState('All');

  const visible = SACCOS.filter(s => status === 'All' || s.status === status);

  const approve = (id: string) => alert(`SACCO ${id} approved — backend integration needed.`);
  const reject  = (id: string) => alert(`SACCO ${id} rejected — backend integration needed.`);

  return (
    <DashboardLayout
      title="SACCO Management"
      subtitle="Approve, monitor and manage transport operators on the platform"
      actions={<button className="btn btn-primary btn-sm">+ Register SACCO</button>}
    >
      <AiBanner text="<strong>2 SACCOs pending approval.</strong> AI background check complete: no fraud signals detected. Recommend approval within 24h to meet onboarding SLA." />

      {/* Summary */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:24 }}>
        {[
          { label:'Active SACCOs',   value: SACCOS.filter(s=>s.status==='Active').length },
          { label:'Pending Approval',value: SACCOS.filter(s=>s.status==='Pending').length },
          { label:'Suspended',       value: SACCOS.filter(s=>s.status==='Suspended').length },
          { label:'Total Vehicles',  value: SACCOS.reduce((a,s)=>a+s.vehicles, 0) },
        ].map(c => (
          <div key={c.label} className="card" style={{ padding:'18px 20px', textAlign:'center' }}>
            <div className="kpi-label">{c.label}</div>
            <div className="kpi-value">{c.value}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div style={{ display:'flex', gap:8, marginBottom:16 }}>
        {['All','Active','Pending','Suspended'].map(f => (
          <button key={f} className={`btn btn-sm ${status===f ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setStatus(f)}>{f}</button>
        ))}
      </div>

      <div className="table-wrap">
        <table className="sc-table">
          <thead>
            <tr><th>SACCO</th><th>Owner</th><th>Routes</th><th>Vehicles</th>
              <th>Bookings</th><th>Revenue</th><th>Rating</th><th>Joined</th><th>Status</th><th>Action</th></tr>
          </thead>
          <tbody>
            {visible.map(s => (
              <tr key={s.id}>
                <td>
                  <div style={{ fontWeight:700, fontSize:13 }}>{s.name}</div>
                  <div style={{ fontSize:11, color:'var(--gray-400)' }}>{s.email}</div>
                </td>
                <td style={{ fontSize:13 }}>{s.owner}</td>
                <td style={{ fontWeight:600 }}>{s.routes || '—'}</td>
                <td style={{ fontWeight:600 }}>{s.vehicles || '—'}</td>
                <td>{s.bookings}</td>
                <td style={{ fontWeight:600 }}>{s.revenue}</td>
                <td>{s.rating > 0 ? `⭐ ${s.rating}` : '—'}</td>
                <td style={{ fontSize:12, color:'var(--gray-400)' }}>{s.joined}</td>
                <td><Badge variant={s.variant}>{s.status}</Badge></td>
                <td>
                  {s.status === 'Pending' ? (
                    <div style={{ display:'flex', gap:6 }}>
                      <button className="btn btn-sm btn-primary" onClick={() => approve(s.id)}>Approve</button>
                      <button className="btn btn-sm" style={{ color:'var(--danger)' }} onClick={() => reject(s.id)}>Reject</button>
                    </div>
                  ) : (
                    <button className="btn btn-sm">View</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}

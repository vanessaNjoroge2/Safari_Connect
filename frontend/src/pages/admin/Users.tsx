import { useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { Badge } from '../../components/UI';
import type { BadgeVariant } from '../../types';

interface User {
  id: string; name: string; email: string; phone: string;
  role: string; roleVariant: BadgeVariant; trustScore: number;
  joined: string; trips: number; status: string; statusVariant: BadgeVariant;
}

const USERS: User[] = [
  { id:'USR-001', name:'Virginia Wamaitha', email:'wamaitha@gmail.com',       phone:'0712 345 678', role:'Passenger',   roleVariant:'green',  trustScore:94, joined:'Jan 2026', trips:12, status:'Active',   statusVariant:'green' },
  { id:'USR-002', name:'James Kariuki',     email:'james.k@gmail.com',         phone:'0723 456 789', role:'Passenger',   roleVariant:'green',  trustScore:88, joined:'Feb 2026', trips:7,  status:'Active',   statusVariant:'green' },
  { id:'USR-003', name:'Modern Coast Sacco',email:'ops@moderncoast.co.ke',     phone:'0711 111 222', role:'SACCO Owner', roleVariant:'blue',   trustScore:99, joined:'Oct 2025', trips:0,  status:'Active',   statusVariant:'green' },
  { id:'USR-004', name:'Faith Njeri',       email:'faith.njeri@gmail.com',     phone:'0734 567 890', role:'Passenger',   roleVariant:'green',  trustScore:76, joined:'Mar 2026', trips:3,  status:'Active',   statusVariant:'green' },
  { id:'USR-005', name:'Easy Coach Ltd',    email:'admin@easycoach.co.ke',     phone:'0700 222 333', role:'SACCO Owner', roleVariant:'blue',   trustScore:98, joined:'Sep 2025', trips:0,  status:'Active',   statusVariant:'green' },
  { id:'USR-006', name:'Peter Odhiambo',    email:'peter.o@gmail.com',         phone:'0745 678 901', role:'Passenger',   roleVariant:'green',  trustScore:61, joined:'Mar 2026', trips:2,  status:'Flagged',  statusVariant:'amber' },
  { id:'USR-007', name:'Lucy Wanjiru',      email:'lucy.w@gmail.com',          phone:'0756 789 012', role:'Passenger',   roleVariant:'green',  trustScore:82, joined:'Feb 2026', trips:5,  status:'Active',   statusVariant:'green' },
  { id:'USR-008', name:'Samuel Mutua',      email:'s.mutua@gmail.com',         phone:'0767 890 123', role:'Passenger',   roleVariant:'green',  trustScore:45, joined:'Feb 2026', trips:1,  status:'Suspended',statusVariant:'red'   },
  { id:'USR-009', name:'Eldoret Express',   email:'fleet@eldoretexp.co.ke',    phone:'0733 333 444', role:'SACCO Owner', roleVariant:'blue',   trustScore:96, joined:'Nov 2025', trips:0,  status:'Active',   statusVariant:'green' },
  { id:'USR-010', name:'Brian Kimani',      email:'brian.k@gmail.com',         phone:'0778 901 234', role:'Passenger',   roleVariant:'green',  trustScore:70, joined:'Jan 2026', trips:4,  status:'Active',   statusVariant:'green' },
];

const ROLE_FILTERS = ['All', 'Passenger', 'SACCO Owner', 'Admin'];
const STATUS_FILTERS = ['All', 'Active', 'Flagged', 'Suspended'];

export default function AdminUsers() {
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');

  const visible = USERS.filter(u => {
    const matchRole   = roleFilter === 'All'   || u.role === roleFilter;
    const matchStatus = statusFilter === 'All' || u.status === statusFilter;
    const q = search.toLowerCase();
    const matchSearch = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    return matchRole && matchStatus && matchSearch;
  });

  return (
    <DashboardLayout
      title="User Management"
      subtitle="All registered passengers, SACCO owners, and admins"
      actions={<button className="btn btn-primary btn-sm">+ Invite user</button>}
    >
      <div style={{ display:'flex', gap:10, marginBottom:20, flexWrap:'wrap', alignItems:'center' }}>
        <input className="input" placeholder="Search by name or email…"
          style={{ maxWidth:260, fontSize:13 }} value={search} onChange={e => setSearch(e.target.value)} />
        <div style={{ display:'flex', gap:6 }}>
          {ROLE_FILTERS.map(f => (
            <button key={f} className={`btn btn-sm ${roleFilter===f ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setRoleFilter(f)}>{f}</button>
          ))}
        </div>
        <div style={{ display:'flex', gap:6 }}>
          {STATUS_FILTERS.map(f => (
            <button key={f} className={`btn btn-sm ${statusFilter===f ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setStatusFilter(f)}>{f}</button>
          ))}
        </div>
        <span className="text-muted" style={{ fontSize:12, marginLeft:'auto' }}>{visible.length} users</span>
      </div>

      <div className="table-wrap">
        <table className="sc-table">
          <thead>
            <tr><th>User</th><th>Email</th><th>Phone</th><th>Role</th>
              <th>AI Trust</th><th>Trips</th><th>Joined</th><th>Status</th><th>Action</th></tr>
          </thead>
          <tbody>
            {visible.map(u => (
              <tr key={u.id}>
                <td>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:32, height:32, borderRadius:'50%', background:'var(--brand)', color:'#fff',
                      display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, flexShrink:0 }}>
                      {u.name.split(' ').map(n=>n[0]).join('').slice(0,2)}
                    </div>
                    <span style={{ fontWeight:600, fontSize:13 }}>{u.name}</span>
                  </div>
                </td>
                <td style={{ fontSize:12, color:'var(--gray-500)' }}>{u.email}</td>
                <td style={{ fontSize:12 }}>{u.phone}</td>
                <td><Badge variant={u.roleVariant}>{u.role}</Badge></td>
                <td>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <div style={{ width:50, height:6, background:'var(--gray-100)', borderRadius:99, overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${u.trustScore}%`, background: u.trustScore>=80 ? 'var(--brand)' : u.trustScore>=60 ? 'var(--warning)' : 'var(--danger)', borderRadius:99 }} />
                    </div>
                    <span style={{ fontSize:12, fontWeight:700 }}>{u.trustScore}</span>
                  </div>
                </td>
                <td style={{ fontWeight:600 }}>{u.trips > 0 ? u.trips : '—'}</td>
                <td style={{ fontSize:12, color:'var(--gray-500)' }}>{u.joined}</td>
                <td><Badge variant={u.statusVariant}>{u.status}</Badge></td>
                <td style={{ display:'flex', gap:6 }}>
                  <button className="btn btn-sm">View</button>
                  {u.status === 'Active' && <button className="btn btn-sm" style={{ color:'var(--danger)' }}>Flag</button>}
                  {u.status === 'Suspended' && <button className="btn btn-sm" style={{ color:'var(--brand)' }}>Restore</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}

import { useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { Badge } from '../../components/UI';
import type { BadgeVariant } from '../../types';

interface Ticket {
  id: string; subject: string; user: string; category: string;
  created: string; priority: string; priorityVariant: BadgeVariant;
  status: string; statusVariant: BadgeVariant; assignedTo: string;
}

const TICKETS: Ticket[] = [
  { id:'TKT-001', subject:'Did not receive ticket after payment',       user:'Virginia Wamaitha', category:'Booking',  created:'18 Mar 2026 09:12', priority:'High',   priorityVariant:'red',   status:'Open',        statusVariant:'red',   assignedTo:'Sarah K.' },
  { id:'TKT-002', subject:'Driver refused to honour booking',           user:'James Kariuki',     category:'Dispute',  created:'18 Mar 2026 08:45', priority:'High',   priorityVariant:'red',   status:'In Review',   statusVariant:'amber', assignedTo:'John M.' },
  { id:'TKT-003', subject:'Overcharged for luggage — no receipt given', user:'Faith Njeri',       category:'Payment',  created:'17 Mar 2026 17:30', priority:'Medium', priorityVariant:'amber', status:'In Review',   statusVariant:'amber', assignedTo:'Sarah K.' },
  { id:'TKT-004', subject:'Cannot cancel booking — 24h before trip',   user:'Brian Kimani',      category:'Booking',  created:'15 Mar 2026 14:00', priority:'Medium', priorityVariant:'amber', status:'Resolved',    statusVariant:'green', assignedTo:'John M.' },
  { id:'TKT-005', subject:'M-Pesa deducted but no confirmation SMS',   user:'Lucy Wanjiru',      category:'Payment',  created:'15 Mar 2026 11:20', priority:'High',   priorityVariant:'red',   status:'Open',        statusVariant:'red',   assignedTo:'Unassigned' },
  { id:'TKT-006', subject:'Wrong seat allocated on bus',                user:'Peter Odhiambo',    category:'Booking',  created:'14 Mar 2026 09:00', priority:'Low',    priorityVariant:'gray',  status:'Resolved',    statusVariant:'green', assignedTo:'Sarah K.' },
  { id:'TKT-007', subject:'App shows wrong departure time for NBI-MBA', user:'Kevin Otieno',      category:'App Bug',  created:'14 Mar 2026 08:10', priority:'Medium', priorityVariant:'amber', status:'In Review',   statusVariant:'amber', assignedTo:'Dev Team' },
  { id:'TKT-008', subject:'SACCO blocked me without reason',            user:'Samuel Mutua',      category:'Dispute',  created:'13 Mar 2026 16:55', priority:'High',   priorityVariant:'red',   status:'Escalated',   statusVariant:'red',   assignedTo:'Admin' },
];

const STATUS_OPTS = ['All', 'Open', 'In Review', 'Escalated', 'Resolved'];
const CAT_OPTS = ['All', 'Booking', 'Payment', 'Dispute', 'App Bug'];

export default function AdminSupport() {
  const [statusF, setStatusF] = useState('All');
  const [catF, setCatF] = useState('All');

  const visible = TICKETS.filter(t =>
    (statusF === 'All' || t.status === statusF) &&
    (catF === 'All'    || t.category === catF)
  );

  return (
    <DashboardLayout
      title="Support & Disputes"
      subtitle="Passenger and operator support tickets — resolve and escalate"
      actions={<span className="text-muted" style={{ fontSize:13 }}>{TICKETS.filter(t=>t.status==='Open').length} open tickets</span>}
    >
      {/* Summary */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:24 }}>
        {[
          { label:'Open',       value: TICKETS.filter(t=>t.status==='Open').length,       color:'var(--danger)' },
          { label:'In Review',  value: TICKETS.filter(t=>t.status==='In Review').length,  color:'var(--warning)' },
          { label:'Escalated',  value: TICKETS.filter(t=>t.status==='Escalated').length,  color:'#7c3aed' },
          { label:'Resolved',   value: TICKETS.filter(t=>t.status==='Resolved').length,   color:'var(--brand)' },
        ].map(c => (
          <div key={c.label} className="card" style={{ padding:'18px 20px', textAlign:'center' }}>
            <div className="kpi-label">{c.label}</div>
            <div className="kpi-value" style={{ color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
        <div style={{ display:'flex', gap:6 }}>
          {STATUS_OPTS.map(f => (
            <button key={f} className={`btn btn-sm ${statusF===f ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setStatusF(f)}>{f}</button>
          ))}
        </div>
        <div style={{ display:'flex', gap:6 }}>
          {CAT_OPTS.map(f => (
            <button key={f} className={`btn btn-sm ${catF===f ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setCatF(f)}>{f}</button>
          ))}
        </div>
      </div>

      <div className="table-wrap">
        <table className="sc-table">
          <thead>
            <tr><th>Ticket ID</th><th>Subject</th><th>User</th><th>Category</th>
              <th>Created</th><th>Priority</th><th>Assigned</th><th>Status</th><th>Action</th></tr>
          </thead>
          <tbody>
            {visible.map(t => (
              <tr key={t.id}>
                <td className="td-primary" style={{ fontFamily:'monospace', fontSize:12 }}>{t.id}</td>
                <td style={{ fontWeight:500, fontSize:13, maxWidth:240 }}>{t.subject}</td>
                <td style={{ fontSize:13 }}>{t.user}</td>
                <td><Badge variant="gray">{t.category}</Badge></td>
                <td style={{ fontSize:11, color:'var(--gray-400)' }}>{t.created}</td>
                <td><Badge variant={t.priorityVariant}>{t.priority}</Badge></td>
                <td style={{ fontSize:12, color:'var(--gray-500)' }}>{t.assignedTo}</td>
                <td><Badge variant={t.statusVariant}>{t.status}</Badge></td>
                <td style={{ display:'flex', gap:6 }}>
                  <button className="btn btn-sm">Resolve</button>
                  {t.status !== 'Escalated' && (
                    <button className="btn btn-sm" style={{ color:'var(--danger)' }}>Escalate</button>
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

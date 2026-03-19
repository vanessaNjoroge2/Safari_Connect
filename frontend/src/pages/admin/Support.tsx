import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { Badge } from '../../components/UI';
import { getAdminSupportApi, updateAdminTicketApi } from '../../lib/api';
import { useToast } from '../../hooks/useToast';
import type { BadgeVariant } from '../../types';

interface Ticket {
  id: string;
  subject: string;
  user: string;
  category: string;
  created: string;
  priority: string;
  priorityVariant: BadgeVariant;
  status: string;
  statusVariant: BadgeVariant;
  assignedTo: string;
}

const STATUS_OPTS = ['All', 'Open', 'In Review', 'Escalated', 'Resolved'];
const CAT_OPTS = ['All', 'Booking', 'Payment', 'Dispute', 'App Bug'];

export default function AdminSupport() {
  const toast = useToast();
  const [statusF, setStatusF] = useState('All');
  const [catF, setCatF] = useState('All');
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<Ticket[]>([]);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      setLoading(true);
      try {
        const response = await getAdminSupportApi();
        if (!mounted) return;
        const mapped = response.data.map((t) => ({
          id: t.id,
          subject: t.subject,
          user: t.user,
          category: t.category,
          created: t.created,
          priority: t.priority,
          priorityVariant: (t.priority === 'High' ? 'red' : t.priority === 'Medium' ? 'amber' : 'gray') as BadgeVariant,
          status: t.status,
          statusVariant: (t.status === 'Resolved' ? 'green' : t.status === 'Escalated' ? 'red' : 'amber') as BadgeVariant,
          assignedTo: t.assignedTo,
        }));
        setTickets(mapped);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void run();
    return () => {
      mounted = false;
    };
  }, []);

  const visible = useMemo(() => tickets.filter(t =>
    (statusF === 'All' || t.status === statusF) &&
    (catF === 'All'    || t.category === catF)
  ), [tickets, statusF, catF]);

  const refresh = async () => {
    const response = await getAdminSupportApi();
    const mapped = response.data.map((t) => ({
      id: t.id,
      subject: t.subject,
      user: t.user,
      category: t.category,
      created: t.created,
      priority: t.priority,
      priorityVariant: (t.priority === 'High' ? 'red' : t.priority === 'Medium' ? 'amber' : 'gray') as BadgeVariant,
      status: t.status,
      statusVariant: (t.status === 'Resolved' ? 'green' : t.status === 'Escalated' ? 'red' : 'amber') as BadgeVariant,
      assignedTo: t.assignedTo,
    }));
    setTickets(mapped);
  };

  return (
    <DashboardLayout
      title="Support & Disputes"
      subtitle="Passenger and operator support tickets — resolve and escalate"
      actions={<span className="text-muted" style={{ fontSize:13 }}>{loading ? 'Loading...' : `${tickets.filter(t=>t.status==='Open').length} open tickets`}</span>}
    >
      {/* Summary */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:24 }}>
        {[
          { label:'Open',       value: tickets.filter(t=>t.status==='Open').length,       color:'var(--danger)' },
          { label:'In Review',  value: tickets.filter(t=>t.status==='In Review').length,  color:'var(--warning)' },
          { label:'Escalated',  value: tickets.filter(t=>t.status==='Escalated').length,  color:'#7c3aed' },
          { label:'Resolved',   value: tickets.filter(t=>t.status==='Resolved').length,   color:'var(--brand)' },
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
                  <button
                    className="btn btn-sm"
                    onClick={async () => {
                      await updateAdminTicketApi(t.id, { status: 'Resolved' });
                      toast('Ticket resolved', 'success');
                      await refresh();
                    }}
                  >
                    Resolve
                  </button>
                  {t.status !== 'Escalated' && (
                    <button
                      className="btn btn-sm"
                      style={{ color:'var(--danger)' }}
                      onClick={async () => {
                        await updateAdminTicketApi(t.id, { status: 'Escalated' });
                        toast('Ticket escalated', 'success');
                        await refresh();
                      }}
                    >
                      Escalate
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {loading && (
              <tr><td colSpan={9} style={{ textAlign:'center', color:'var(--gray-400)', padding:32 }}>Loading tickets...</td></tr>
            )}
            {!loading && visible.length === 0 && (
              <tr><td colSpan={9} style={{ textAlign:'center', color:'var(--gray-400)', padding:32 }}>No tickets found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}

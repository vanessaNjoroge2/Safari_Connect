import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { Badge, Modal } from '../../components/UI';
import { createAdminSupportApi, deleteAdminTicketApi, getAdminSupportApi, updateAdminTicketApi } from '../../lib/api';
import { useToast } from '../../hooks/useToast';
import type { BadgeVariant } from '../../types';

interface Ticket {
  id: string;
  ticketCode: string;
  subject: string;
  user: string;
  category: string;
  created: string;
  priority: string;
  priorityVariant: BadgeVariant;
  status: string;
  statusVariant: BadgeVariant;
  assignedTo: string;
  description: string;
}

const STATUS_OPTS = ['All', 'Open', 'In Review', 'Escalated', 'Resolved'];
const CAT_OPTS = ['All', 'Booking', 'Payment', 'Dispute', 'App Bug', 'General'];

const toApiStatus = (status: string): 'OPEN' | 'IN_REVIEW' | 'ESCALATED' | 'RESOLVED' | undefined => {
  if (status === 'Open') return 'OPEN';
  if (status === 'In Review') return 'IN_REVIEW';
  if (status === 'Escalated') return 'ESCALATED';
  if (status === 'Resolved') return 'RESOLVED';
  return undefined;
};

const toApiCategory = (category: string): 'BOOKING' | 'PAYMENT' | 'DISPUTE' | 'APP_BUG' | 'GENERAL' | undefined => {
  if (category === 'Booking') return 'BOOKING';
  if (category === 'Payment') return 'PAYMENT';
  if (category === 'Dispute') return 'DISPUTE';
  if (category === 'App Bug') return 'APP_BUG';
  if (category === 'General') return 'GENERAL';
  return undefined;
};

type TicketForm = {
  subject: string;
  user: string;
  category: 'BOOKING' | 'PAYMENT' | 'DISPUTE' | 'APP_BUG' | 'GENERAL';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'OPEN' | 'IN_REVIEW' | 'ESCALATED' | 'RESOLVED';
  assignedTo: string;
  description: string;
};

const EMPTY_FORM: TicketForm = {
  subject: '',
  user: '',
  category: 'GENERAL',
  priority: 'MEDIUM',
  status: 'OPEN',
  assignedTo: '',
  description: '',
};

export default function AdminSupport() {
  const toast = useToast();
  const [statusF, setStatusF] = useState('All');
  const [catF, setCatF] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [active, setActive] = useState<Ticket | null>(null);
  const [form, setForm] = useState<TicketForm>(EMPTY_FORM);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const response = await getAdminSupportApi({
        status: toApiStatus(statusF),
        category: toApiCategory(catF),
        q: search.trim() || undefined,
        limit: 300,
      });

      const mapped = response.data.map((t) => ({
        id: t.id,
        ticketCode: t.ticketCode,
        subject: t.subject,
        user: t.user,
        category: t.category,
        created: t.created,
        priority: t.priority,
        priorityVariant: (t.priority === 'High' ? 'red' : t.priority === 'Medium' ? 'amber' : 'gray') as BadgeVariant,
        status: t.status,
        statusVariant: (t.status === 'Resolved' ? 'green' : t.status === 'Escalated' ? 'red' : 'amber') as BadgeVariant,
        assignedTo: t.assignedTo,
        description: t.description,
      }));

      setTickets(mapped);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load support tickets';
      toast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTickets();
  }, [statusF, catF, search]);

  const visible = useMemo(() => tickets, [tickets]);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setCreateOpen(true);
  };

  const openEdit = (ticket: Ticket) => {
    setActive(ticket);
    setForm({
      subject: ticket.subject,
      user: ticket.user,
      category: toApiCategory(ticket.category) || 'GENERAL',
      priority: ticket.priority.toUpperCase() as TicketForm['priority'],
      status: toApiStatus(ticket.status) || 'OPEN',
      assignedTo: ticket.assignedTo === 'Unassigned' ? '' : ticket.assignedTo,
      description: ticket.description,
    });
    setEditOpen(true);
  };

  const openDelete = (ticket: Ticket) => {
    setActive(ticket);
    setDeleteOpen(true);
  };

  const createTicket = async () => {
    setSaving(true);
    try {
      await createAdminSupportApi(form);
      toast('Support ticket created', 'success');
      setCreateOpen(false);
      setForm(EMPTY_FORM);
      await loadTickets();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create support ticket';
      toast(message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const updateTicket = async () => {
    if (!active) return;
    setSaving(true);
    try {
      await updateAdminTicketApi(active.id, form);
      toast('Support ticket updated', 'success');
      setEditOpen(false);
      setActive(null);
      await loadTickets();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update support ticket';
      toast(message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const removeTicket = async () => {
    if (!active) return;
    setSaving(true);
    try {
      await deleteAdminTicketApi(active.id);
      toast('Support ticket deleted', 'success');
      setDeleteOpen(false);
      setActive(null);
      await loadTickets();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete support ticket';
      toast(message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout
      title="Support & Disputes"
      subtitle="Passenger and operator support tickets — resolve and escalate"
      actions={
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span className="text-muted" style={{ fontSize: 13 }}>{loading ? 'Loading...' : `${tickets.filter(t=>t.status==='Open').length} open tickets`}</span>
          <button className="btn btn-primary btn-sm" onClick={openCreate}>New ticket</button>
        </div>
      }
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
      <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap', alignItems: 'center' }}>
        <input
          className="input"
          style={{ maxWidth: 280, fontSize: 13 }}
          placeholder="Search ticket, user, assignee"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
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
              <th>Created</th><th>Priority</th><th>Assigned</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {visible.map(t => (
              <tr key={t.id}>
                <td className="td-primary" style={{ fontFamily:'monospace', fontSize:12 }}>{t.ticketCode}</td>
                <td style={{ fontWeight:500, fontSize:13, maxWidth:240 }}>{t.subject}</td>
                <td style={{ fontSize:13 }}>{t.user}</td>
                <td><Badge variant="gray">{t.category}</Badge></td>
                <td style={{ fontSize:11, color:'var(--gray-400)' }}>{t.created}</td>
                <td><Badge variant={t.priorityVariant}>{t.priority}</Badge></td>
                <td style={{ fontSize:12, color:'var(--gray-500)' }}>{t.assignedTo}</td>
                <td><Badge variant={t.statusVariant}>{t.status}</Badge></td>
                <td style={{ display:'flex', gap:6 }}>
                  <button className="btn btn-sm" onClick={() => openEdit(t)}>Edit</button>
                  <button
                    className="btn btn-sm"
                    onClick={async () => {
                      await updateAdminTicketApi(t.id, { status: 'RESOLVED' });
                      toast('Ticket resolved', 'success');
                      await loadTickets();
                    }}
                  >
                    Resolve
                  </button>
                  {t.status !== 'Escalated' && (
                    <button
                      className="btn btn-sm"
                      style={{ color:'var(--danger)' }}
                      onClick={async () => {
                        await updateAdminTicketApi(t.id, { status: 'ESCALATED' });
                        toast('Ticket escalated', 'success');
                        await loadTickets();
                      }}
                    >
                      Escalate
                    </button>
                  )}
                  <button className="btn btn-sm" style={{ color: 'var(--danger)' }} onClick={() => openDelete(t)}>Delete</button>
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

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create support ticket" width={620}>
        <div style={{ display: 'grid', gap: 12 }}>
          <input className="input" placeholder="Subject" value={form.subject} onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))} />
          <input className="input" placeholder="User full name" value={form.user} onChange={(e) => setForm((p) => ({ ...p, user: e.target.value }))} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
            <select className="input" value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value as TicketForm['category'] }))}>
              <option value="BOOKING">Booking</option>
              <option value="PAYMENT">Payment</option>
              <option value="DISPUTE">Dispute</option>
              <option value="APP_BUG">App Bug</option>
              <option value="GENERAL">General</option>
            </select>
            <select className="input" value={form.priority} onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value as TicketForm['priority'] }))}>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
            <select className="input" value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as TicketForm['status'] }))}>
              <option value="OPEN">Open</option>
              <option value="IN_REVIEW">In Review</option>
              <option value="ESCALATED">Escalated</option>
              <option value="RESOLVED">Resolved</option>
            </select>
          </div>
          <input className="input" placeholder="Assigned to (optional)" value={form.assignedTo} onChange={(e) => setForm((p) => ({ ...p, assignedTo: e.target.value }))} />
          <textarea className="input" rows={4} placeholder="Description" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button className="btn btn-ghost" onClick={() => setCreateOpen(false)} disabled={saving}>Cancel</button>
            <button className="btn btn-primary" onClick={createTicket} disabled={saving || !form.subject.trim() || !form.user.trim()}>
              {saving ? 'Saving...' : 'Create ticket'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit support ticket" width={620}>
        <div style={{ display: 'grid', gap: 12 }}>
          <input className="input" placeholder="Subject" value={form.subject} onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))} />
          <input className="input" placeholder="User full name" value={form.user} onChange={(e) => setForm((p) => ({ ...p, user: e.target.value }))} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
            <select className="input" value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value as TicketForm['category'] }))}>
              <option value="BOOKING">Booking</option>
              <option value="PAYMENT">Payment</option>
              <option value="DISPUTE">Dispute</option>
              <option value="APP_BUG">App Bug</option>
              <option value="GENERAL">General</option>
            </select>
            <select className="input" value={form.priority} onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value as TicketForm['priority'] }))}>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
            <select className="input" value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as TicketForm['status'] }))}>
              <option value="OPEN">Open</option>
              <option value="IN_REVIEW">In Review</option>
              <option value="ESCALATED">Escalated</option>
              <option value="RESOLVED">Resolved</option>
            </select>
          </div>
          <input className="input" placeholder="Assigned to (optional)" value={form.assignedTo} onChange={(e) => setForm((p) => ({ ...p, assignedTo: e.target.value }))} />
          <textarea className="input" rows={4} placeholder="Description" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button className="btn btn-ghost" onClick={() => setEditOpen(false)} disabled={saving}>Cancel</button>
            <button className="btn btn-primary" onClick={updateTicket} disabled={saving || !form.subject.trim() || !form.user.trim()}>
              {saving ? 'Saving...' : 'Update ticket'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete support ticket" width={500}>
        <div style={{ display: 'grid', gap: 16 }}>
          <p style={{ margin: 0, color: 'var(--gray-600)' }}>Delete ticket {active?.ticketCode}? This action cannot be undone.</p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button className="btn btn-ghost" onClick={() => setDeleteOpen(false)} disabled={saving}>Cancel</button>
            <button className="btn" style={{ color: 'var(--danger)' }} onClick={removeTicket} disabled={saving}>{saving ? 'Deleting...' : 'Delete'}</button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}

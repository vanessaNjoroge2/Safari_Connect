import { useEffect, useMemo, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { Badge, Modal } from '../../components/UI';
import {
  createAdminNotificationApi,
  deleteAdminNotificationApi,
  getAdminNotificationsApi,
  updateAdminNotificationApi,
} from '../../lib/api';
import { useToast } from '../../hooks/useToast';

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  channel: 'In App' | 'Email' | 'Sms' | 'Push';
  targetRole: 'ADMIN' | 'OWNER' | 'USER' | 'ALL';
  status: 'Draft' | 'Scheduled' | 'Sent' | 'Cancelled';
  scheduledFor: string | null;
  sentAt: string | null;
  createdAt: string;
};

type NotificationForm = {
  title: string;
  message: string;
  channel: 'IN_APP' | 'EMAIL' | 'SMS' | 'PUSH';
  targetRole: 'ADMIN' | 'OWNER' | 'USER' | 'ALL';
  status: 'DRAFT' | 'SCHEDULED' | 'SENT' | 'CANCELLED';
  scheduledFor: string;
};

const EMPTY_FORM: NotificationForm = {
  title: '',
  message: '',
  channel: 'IN_APP',
  targetRole: 'ALL',
  status: 'DRAFT',
  scheduledFor: '',
};

const STATUS_FILTERS = ['All', 'Draft', 'Scheduled', 'Sent', 'Cancelled'];
const CHANNEL_FILTERS = ['All', 'In App', 'Email', 'Sms', 'Push'];

function toApiStatus(value: string): 'DRAFT' | 'SCHEDULED' | 'SENT' | 'CANCELLED' | undefined {
  if (value === 'Draft') return 'DRAFT';
  if (value === 'Scheduled') return 'SCHEDULED';
  if (value === 'Sent') return 'SENT';
  if (value === 'Cancelled') return 'CANCELLED';
  return undefined;
}

function toApiChannel(value: string): 'IN_APP' | 'EMAIL' | 'SMS' | 'PUSH' | undefined {
  if (value === 'In App') return 'IN_APP';
  if (value === 'Email') return 'EMAIL';
  if (value === 'Sms') return 'SMS';
  if (value === 'Push') return 'PUSH';
  return undefined;
}

export default function AdminNotifications() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rows, setRows] = useState<NotificationItem[]>([]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [channelFilter, setChannelFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [active, setActive] = useState<NotificationItem | null>(null);
  const [form, setForm] = useState<NotificationForm>(EMPTY_FORM);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await getAdminNotificationsApi({
        status: toApiStatus(statusFilter),
        channel: toApiChannel(channelFilter),
        q: search.trim() || undefined,
        limit: 300,
      });
      setRows(response.data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load notifications';
      toast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [statusFilter, channelFilter, search]);

  const visible = useMemo(() => rows, [rows]);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setCreateOpen(true);
  };

  const openEdit = (item: NotificationItem) => {
    setActive(item);
    setForm({
      title: item.title,
      message: item.message,
      channel: toApiChannel(item.channel) || 'IN_APP',
      targetRole: item.targetRole,
      status: toApiStatus(item.status) || 'DRAFT',
      scheduledFor: item.scheduledFor ? item.scheduledFor.slice(0, 16) : '',
    });
    setEditOpen(true);
  };

  const openDelete = (item: NotificationItem) => {
    setActive(item);
    setDeleteOpen(true);
  };

  const saveCreate = async () => {
    setSaving(true);
    try {
      await createAdminNotificationApi({
        ...form,
        scheduledFor: form.scheduledFor ? new Date(form.scheduledFor).toISOString() : null,
      });
      toast('Notification created', 'success');
      setCreateOpen(false);
      await loadData();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create notification';
      toast(message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const saveEdit = async () => {
    if (!active) return;
    setSaving(true);
    try {
      await updateAdminNotificationApi(active.id, {
        ...form,
        scheduledFor: form.scheduledFor ? new Date(form.scheduledFor).toISOString() : null,
      });
      toast('Notification updated', 'success');
      setEditOpen(false);
      setActive(null);
      await loadData();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update notification';
      toast(message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!active) return;
    setSaving(true);
    try {
      await deleteAdminNotificationApi(active.id);
      toast('Notification deleted', 'success');
      setDeleteOpen(false);
      setActive(null);
      await loadData();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete notification';
      toast(message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout
      title="Notifications"
      subtitle="Manage in-app, email, SMS, and push notifications"
      actions={<button className="btn btn-primary btn-sm" onClick={openCreate}>New notification</button>}
    >
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
        <input
          className="input"
          style={{ maxWidth: 260, fontSize: 13 }}
          placeholder="Search title or message"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div style={{ display: 'flex', gap: 6 }}>
          {STATUS_FILTERS.map((item) => (
            <button key={item} className={`btn btn-sm ${statusFilter === item ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setStatusFilter(item)}>
              {item}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {CHANNEL_FILTERS.map((item) => (
            <button key={item} className={`btn btn-sm ${channelFilter === item ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setChannelFilter(item)}>
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="table-wrap">
        <table className="sc-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Channel</th>
              <th>Target</th>
              <th>Status</th>
              <th>Schedule</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((item) => (
              <tr key={item.id}>
                <td>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{item.title}</div>
                  <div style={{ color: 'var(--gray-500)', fontSize: 12, maxWidth: 360 }}>{item.message}</div>
                </td>
                <td><Badge variant="gray">{item.channel}</Badge></td>
                <td><Badge variant="blue">{item.targetRole}</Badge></td>
                <td><Badge variant={item.status === 'Sent' ? 'green' : item.status === 'Cancelled' ? 'red' : item.status === 'Scheduled' ? 'amber' : 'gray'}>{item.status}</Badge></td>
                <td style={{ fontSize: 12 }}>{item.scheduledFor ? new Date(item.scheduledFor).toLocaleString('en-KE') : 'Now'}</td>
                <td style={{ fontSize: 12 }}>{new Date(item.createdAt).toLocaleDateString('en-KE')}</td>
                <td style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-sm" onClick={() => openEdit(item)}>Edit</button>
                  <button className="btn btn-sm" style={{ color: 'var(--danger)' }} onClick={() => openDelete(item)}>Delete</button>
                </td>
              </tr>
            ))}
            {loading && <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--gray-400)', padding: 24 }}>Loading notifications...</td></tr>}
            {!loading && visible.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--gray-400)', padding: 24 }}>No notifications found.</td></tr>}
          </tbody>
        </table>
      </div>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create notification" width={660}>
        <NotificationFormBlock form={form} setForm={setForm} />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
          <button className="btn btn-ghost" onClick={() => setCreateOpen(false)} disabled={saving}>Cancel</button>
          <button className="btn btn-primary" onClick={saveCreate} disabled={saving || !form.title.trim() || !form.message.trim()}>{saving ? 'Saving...' : 'Create'}</button>
        </div>
      </Modal>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit notification" width={660}>
        <NotificationFormBlock form={form} setForm={setForm} />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
          <button className="btn btn-ghost" onClick={() => setEditOpen(false)} disabled={saving}>Cancel</button>
          <button className="btn btn-primary" onClick={saveEdit} disabled={saving || !form.title.trim() || !form.message.trim()}>{saving ? 'Saving...' : 'Update'}</button>
        </div>
      </Modal>

      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete notification" width={500}>
        <div style={{ display: 'grid', gap: 14 }}>
          <p style={{ margin: 0, color: 'var(--gray-600)' }}>Delete this notification?</p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button className="btn btn-ghost" onClick={() => setDeleteOpen(false)} disabled={saving}>Cancel</button>
            <button className="btn" style={{ color: 'var(--danger)' }} onClick={confirmDelete} disabled={saving}>{saving ? 'Deleting...' : 'Delete'}</button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}

function NotificationFormBlock({ form, setForm }: { form: NotificationForm; setForm: Dispatch<SetStateAction<NotificationForm>> }) {
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <input className="input" placeholder="Title" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
      <textarea className="input" rows={4} placeholder="Message" value={form.message} onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
        <select className="input" value={form.channel} onChange={(e) => setForm((p) => ({ ...p, channel: e.target.value as NotificationForm['channel'] }))}>
          <option value="IN_APP">In App</option>
          <option value="EMAIL">Email</option>
          <option value="SMS">SMS</option>
          <option value="PUSH">Push</option>
        </select>
        <select className="input" value={form.targetRole} onChange={(e) => setForm((p) => ({ ...p, targetRole: e.target.value as NotificationForm['targetRole'] }))}>
          <option value="ALL">All</option>
          <option value="ADMIN">Admin</option>
          <option value="OWNER">Owner</option>
          <option value="USER">Passenger</option>
        </select>
        <select className="input" value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as NotificationForm['status'] }))}>
          <option value="DRAFT">Draft</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="SENT">Sent</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>
      <input className="input" type="datetime-local" value={form.scheduledFor} onChange={(e) => setForm((p) => ({ ...p, scheduledFor: e.target.value }))} />
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { Badge } from '../../components/UI';
import { getPortalNotificationsApi } from '../../lib/api';
import { useToast } from '../../hooks/useToast';

export default function OwnerNotifications() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Array<{
    id: string;
    title: string;
    message: string;
    channel: 'In App' | 'Email' | 'Sms' | 'Push';
    status: 'Draft' | 'Scheduled' | 'Sent' | 'Cancelled';
    createdAt: string;
  }>>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const response = await getPortalNotificationsApi({ q: search.trim() || undefined, limit: 200 });
        setRows(response.data || []);
      } catch (error) {
        toast((error as Error).message || 'Failed to load notifications', 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, [search, toast]);

  const visible = useMemo(() => rows, [rows]);

  return (
    <DashboardLayout title="Notifications" subtitle="Operational and platform updates for your fleet">
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input
          className="input"
          style={{ maxWidth: 340, fontSize: 13 }}
          placeholder="Search notification title or message"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="table-wrap">
        <table className="sc-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Channel</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((item) => (
              <tr key={item.id}>
                <td>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{item.title}</div>
                  <div style={{ color: 'var(--gray-500)', fontSize: 12 }}>{item.message}</div>
                </td>
                <td><Badge variant="gray">{item.channel}</Badge></td>
                <td><Badge variant={item.status === 'Sent' ? 'green' : item.status === 'Scheduled' ? 'amber' : 'gray'}>{item.status}</Badge></td>
                <td style={{ fontSize: 12 }}>{new Date(item.createdAt).toLocaleString('en-KE')}</td>
              </tr>
            ))}
            {loading && <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--gray-400)', padding: 24 }}>Loading notifications...</td></tr>}
            {!loading && visible.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--gray-400)', padding: 24 }}>No notifications found.</td></tr>}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}

import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { Badge, AiBanner, Modal } from '../../components/UI';
import { createAdminSaccoApi, getAdminSaccosApi, getCategoriesApi, updateAdminSaccoStatusApi } from '../../lib/api';
import { useToast } from '../../hooks/useToast';
import type { BadgeVariant } from '../../types';

interface Sacco {
  id: string;
  name: string;
  owner: string;
  email: string;
  routes: number;
  vehicles: number;
  bookings: number;
  revenue: number;
  status: string;
  variant: BadgeVariant;
  joined: string;
  rating: number;
}

export default function AdminSaccos() {
  const toast = useToast();
  const [status, setStatus] = useState('All');
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Sacco[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [form, setForm] = useState({
    name: '',
    categoryId: '',
    supportEmail: '',
    supportPhone: '',
    logoUrl: '',
    ownerFirstName: '',
    ownerLastName: '',
    ownerEmail: '',
    ownerPhone: '',
    ownerPassword: '',
  });

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      setLoading(true);
      try {
        const response = await getAdminSaccosApi({
          status: status === 'All' ? 'ALL' : status === 'Active' ? 'ACTIVE' : 'PENDING',
          limit: 300,
        });

        if (!mounted) return;

        const mapped = response.data.map((sacco) => ({
          id: sacco.id,
          name: sacco.name,
          owner: sacco.owner,
          email: sacco.email,
          routes: sacco.routes,
          vehicles: sacco.vehicles,
          bookings: sacco.bookings,
          revenue: sacco.revenue,
          status: sacco.status,
          variant: (sacco.status === 'Active' ? 'green' : 'amber') as BadgeVariant,
          joined: new Date(sacco.joined).toLocaleDateString('en-KE', {
            month: 'short',
            year: 'numeric',
          }),
          rating: sacco.rating,
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
  }, [status]);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        const response = await getCategoriesApi();
        if (mounted) {
          setCategories(response.data.map((c) => ({ id: c.id, name: c.name })));
        }
      } catch {
        if (mounted) setCategories([]);
      }
    };
    void run();
    return () => {
      mounted = false;
    };
  }, []);

  const visible = useMemo(() => rows, [rows]);

  const refresh = async () => {
    const response = await getAdminSaccosApi({
      status: status === 'All' ? 'ALL' : status === 'Active' ? 'ACTIVE' : 'PENDING',
      limit: 300,
    });
    const mapped = response.data.map((sacco) => ({
      id: sacco.id,
      name: sacco.name,
      owner: sacco.owner,
      email: sacco.email,
      routes: sacco.routes,
      vehicles: sacco.vehicles,
      bookings: sacco.bookings,
      revenue: sacco.revenue,
      status: sacco.status,
      variant: (sacco.status === 'Active' ? 'green' : 'amber') as BadgeVariant,
      joined: new Date(sacco.joined).toLocaleDateString('en-KE', {
        month: 'short',
        year: 'numeric',
      }),
      rating: sacco.rating,
    }));
    setRows(mapped);
  };

  return (
    <DashboardLayout
      title="SACCO Management"
      subtitle="Approve, monitor and manage transport operators on the platform"
      actions={<button className="btn btn-primary btn-sm" onClick={() => setCreateOpen(true)}>+ Register SACCO</button>}
    >
      <AiBanner text={`<strong>${visible.filter(s => s.status === 'Pending').length} SACCOs pending approval.</strong> AI background check complete: no fraud signals detected. Recommend approval within 24h to meet onboarding SLA.`} />

      {/* Summary */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:24 }}>
        {[
          { label:'Active SACCOs',   value: visible.filter(s=>s.status==='Active').length },
          { label:'Pending Approval',value: visible.filter(s=>s.status==='Pending').length },
          { label:'Suspended',       value: 0 },
          { label:'Total Vehicles',  value: visible.reduce((a,s)=>a+s.vehicles, 0) },
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
                <td>{s.bookings.toLocaleString()}</td>
                <td style={{ fontWeight:600 }}>{s.revenue > 0 ? `KES ${Math.round(s.revenue).toLocaleString()}` : '—'}</td>
                <td>{s.rating > 0 ? `⭐ ${s.rating}` : '—'}</td>
                <td style={{ fontSize:12, color:'var(--gray-400)' }}>{s.joined}</td>
                <td><Badge variant={s.variant}>{s.status}</Badge></td>
                <td>
                  {s.status === 'Pending' ? (
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={async () => {
                        await updateAdminSaccoStatusApi(s.id, { isActive: true });
                        toast('SACCO approved', 'success');
                        await refresh();
                      }}
                    >
                      Approve
                    </button>
                  ) : (
                    <button
                      className="btn btn-sm"
                      style={{ color: 'var(--danger)' }}
                      onClick={async () => {
                        await updateAdminSaccoStatusApi(s.id, { isActive: false });
                        toast('SACCO suspended', 'success');
                        await refresh();
                      }}
                    >
                      Suspend
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {loading && (
              <tr><td colSpan={10} style={{ textAlign:'center', color:'var(--gray-400)', padding:32 }}>Loading SACCOs...</td></tr>
            )}
            {!loading && visible.length === 0 && (
              <tr><td colSpan={10} style={{ textAlign:'center', color:'var(--gray-400)', padding:32 }}>No SACCOs match this filter.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={createOpen} onClose={() => !creating && setCreateOpen(false)} title="Register SACCO" width={680}>
        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ fontWeight: 700 }}>SACCO details</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <input className="input" placeholder="SACCO name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
            <select className="input" value={form.categoryId} onChange={(e) => setForm((p) => ({ ...p, categoryId: e.target.value }))}>
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <input className="input" placeholder="Support email" value={form.supportEmail} onChange={(e) => setForm((p) => ({ ...p, supportEmail: e.target.value }))} />
            <input className="input" placeholder="Support phone" value={form.supportPhone} onChange={(e) => setForm((p) => ({ ...p, supportPhone: e.target.value }))} />
            <input className="input" placeholder="Logo URL (optional)" value={form.logoUrl} onChange={(e) => setForm((p) => ({ ...p, logoUrl: e.target.value }))} />
          </div>

          <div style={{ fontWeight: 700, marginTop: 8 }}>Owner account</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <input className="input" placeholder="First name" value={form.ownerFirstName} onChange={(e) => setForm((p) => ({ ...p, ownerFirstName: e.target.value }))} />
            <input className="input" placeholder="Last name" value={form.ownerLastName} onChange={(e) => setForm((p) => ({ ...p, ownerLastName: e.target.value }))} />
            <input className="input" placeholder="Owner email" value={form.ownerEmail} onChange={(e) => setForm((p) => ({ ...p, ownerEmail: e.target.value }))} />
            <input className="input" placeholder="Owner phone" value={form.ownerPhone} onChange={(e) => setForm((p) => ({ ...p, ownerPhone: e.target.value }))} />
            <input className="input" type="password" placeholder="Temporary password" value={form.ownerPassword} onChange={(e) => setForm((p) => ({ ...p, ownerPassword: e.target.value }))} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
            <button className="btn btn-ghost" onClick={() => setCreateOpen(false)} disabled={creating}>Cancel</button>
            <button
              className="btn btn-primary"
              disabled={creating}
              onClick={async () => {
                if (!form.name || !form.categoryId || !form.ownerFirstName || !form.ownerLastName || !form.ownerEmail || !form.ownerPassword) {
                  toast('Fill all required fields', 'error');
                  return;
                }
                setCreating(true);
                try {
                  await createAdminSaccoApi({
                    name: form.name,
                    categoryId: form.categoryId,
                    supportEmail: form.supportEmail || undefined,
                    supportPhone: form.supportPhone || undefined,
                    logoUrl: form.logoUrl || undefined,
                    ownerFirstName: form.ownerFirstName,
                    ownerLastName: form.ownerLastName,
                    ownerEmail: form.ownerEmail,
                    ownerPhone: form.ownerPhone || undefined,
                    ownerPassword: form.ownerPassword,
                    isActive: true,
                  });
                  setCreateOpen(false);
                  setForm({
                    name: '',
                    categoryId: '',
                    supportEmail: '',
                    supportPhone: '',
                    logoUrl: '',
                    ownerFirstName: '',
                    ownerLastName: '',
                    ownerEmail: '',
                    ownerPhone: '',
                    ownerPassword: '',
                  });
                  const response = await getAdminSaccosApi({
                    status: status === 'All' ? 'ALL' : status === 'Active' ? 'ACTIVE' : 'PENDING',
                    limit: 300,
                  });
                  const mapped = response.data.map((sacco) => ({
                    id: sacco.id,
                    name: sacco.name,
                    owner: sacco.owner,
                    email: sacco.email,
                    routes: sacco.routes,
                    vehicles: sacco.vehicles,
                    bookings: sacco.bookings,
                    revenue: sacco.revenue,
                    status: sacco.status,
                    variant: (sacco.status === 'Active' ? 'green' : 'amber') as BadgeVariant,
                    joined: new Date(sacco.joined).toLocaleDateString('en-KE', {
                      month: 'short',
                      year: 'numeric',
                    }),
                    rating: sacco.rating,
                  }));
                  setRows(mapped);
                  toast('SACCO created', 'success');
                } catch (error) {
                  toast((error as Error).message || 'Failed to create SACCO', 'error');
                } finally {
                  setCreating(false);
                }
              }}
            >
              {creating ? 'Saving...' : 'Create SACCO'}
            </button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}

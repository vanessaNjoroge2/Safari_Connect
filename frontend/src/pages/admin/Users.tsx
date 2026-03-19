import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { Badge } from '../../components/UI';
import { getAdminUsersApi, updateAdminUserStatusApi } from '../../lib/api';
import { useToast } from '../../hooks/useToast';
import type { BadgeVariant } from '../../types';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  roleVariant: BadgeVariant;
  trustScore: number;
  joined: string;
  trips: number;
  status: string;
  statusVariant: BadgeVariant;
}

const ROLE_FILTERS = ['All', 'Passenger', 'SACCO Owner', 'Admin'];
const STATUS_FILTERS = ['All', 'Active', 'Flagged', 'Suspended'];

const roleToApi: Record<string, 'ALL' | 'USER' | 'OWNER' | 'ADMIN'> = {
  All: 'ALL',
  Passenger: 'USER',
  'SACCO Owner': 'OWNER',
  Admin: 'ADMIN',
};

const statusToApi: Record<string, 'ALL' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'> = {
  All: 'ALL',
  Active: 'ACTIVE',
  Flagged: 'INACTIVE',
  Suspended: 'SUSPENDED',
};

const roleLabel: Record<'USER' | 'OWNER' | 'ADMIN', string> = {
  USER: 'Passenger',
  OWNER: 'SACCO Owner',
  ADMIN: 'Admin',
};

const roleVariant: Record<'USER' | 'OWNER' | 'ADMIN', BadgeVariant> = {
  USER: 'green',
  OWNER: 'blue',
  ADMIN: 'purple',
};

const statusLabel: Record<'ACTIVE' | 'INACTIVE' | 'SUSPENDED', string> = {
  ACTIVE: 'Active',
  INACTIVE: 'Flagged',
  SUSPENDED: 'Suspended',
};

const statusVariant: Record<'ACTIVE' | 'INACTIVE' | 'SUSPENDED', BadgeVariant> = {
  ACTIVE: 'green',
  INACTIVE: 'amber',
  SUSPENDED: 'red',
};

export default function AdminUsers() {
  const toast = useToast();
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<User[]>([]);

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      setLoading(true);
      try {
        const response = await getAdminUsersApi({
          role: roleToApi[roleFilter],
          status: statusToApi[statusFilter],
          q: search.trim() || undefined,
          limit: 300,
        });

        if (!mounted) return;

        const mapped = response.data.map((user) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: roleLabel[user.role],
          roleVariant: roleVariant[user.role],
          trustScore: user.trustScore,
          joined: new Date(user.createdAt).toLocaleDateString('en-KE', {
            month: 'short',
            year: 'numeric',
          }),
          trips: user.trips,
          status: statusLabel[user.status],
          statusVariant: statusVariant[user.status],
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
  }, [roleFilter, statusFilter, search]);

  const visible = useMemo(() => rows, [rows]);

  const refresh = async () => {
    const response = await getAdminUsersApi({
      role: roleToApi[roleFilter],
      status: statusToApi[statusFilter],
      q: search.trim() || undefined,
      limit: 300,
    });
    const mapped = response.data.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: roleLabel[user.role],
      roleVariant: roleVariant[user.role],
      trustScore: user.trustScore,
      joined: new Date(user.createdAt).toLocaleDateString('en-KE', {
        month: 'short',
        year: 'numeric',
      }),
      trips: user.trips,
      status: statusLabel[user.status],
      statusVariant: statusVariant[user.status],
    }));
    setRows(mapped);
  };

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
        <span className="text-muted" style={{ fontSize:12, marginLeft:'auto' }}>{loading ? 'Loading...' : `${visible.length} users`}</span>
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
                  {u.status === 'Active' && (
                    <button
                      className="btn btn-sm"
                      style={{ color:'var(--danger)' }}
                      onClick={async () => {
                        await updateAdminUserStatusApi(u.id, { status: 'INACTIVE' });
                        toast('User flagged', 'success');
                        await refresh();
                      }}
                    >
                      Flag
                    </button>
                  )}
                  {u.status === 'Flagged' && (
                    <button
                      className="btn btn-sm"
                      style={{ color:'var(--brand)' }}
                      onClick={async () => {
                        await updateAdminUserStatusApi(u.id, { status: 'ACTIVE' });
                        toast('User restored', 'success');
                        await refresh();
                      }}
                    >
                      Restore
                    </button>
                  )}
                  {u.status === 'Suspended' && (
                    <button
                      className="btn btn-sm"
                      style={{ color:'var(--brand)' }}
                      onClick={async () => {
                        await updateAdminUserStatusApi(u.id, { status: 'ACTIVE' });
                        toast('User restored', 'success');
                        await refresh();
                      }}
                    >
                      Restore
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {loading && (
              <tr><td colSpan={9} style={{ textAlign:'center', color:'var(--gray-400)', padding:32 }}>Loading users...</td></tr>
            )}
            {!loading && visible.length === 0 && (
              <tr><td colSpan={9} style={{ textAlign:'center', color:'var(--gray-400)', padding:32 }}>No users match this filter.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}

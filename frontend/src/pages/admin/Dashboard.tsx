import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { AiBanner, StatTile, ChartBar, Badge, AiAgentPanel } from '../../components/UI';
import { getAdminDashboardApi, type AdminDashboardEnvelope } from '../../lib/api';

function formatKes(amount: number) {
  return `KES ${Math.round(amount || 0).toLocaleString()}`;
}

export default function AdminDashboard() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboard, setDashboard] = useState<AdminDashboardEnvelope['data'] | null>(null);

  const loadDashboard = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const response = await getAdminDashboardApi();
      setDashboard(response.data);
    } finally {
      if (isRefresh) setRefreshing(false);
      else setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard(false);
  }, [loadDashboard]);

  const stats = dashboard?.stats;
  const actions = dashboard?.pendingActions;
  const routes = dashboard?.topRoutes || [];

  const topRouteMax = useMemo(
    () => Math.max(1, ...routes.map((r) => r.bookings)),
    [routes]
  );

  return (
    <DashboardLayout
      title="Platform overview"
      subtitle="Super Admin"
      actions={
        <button className="btn btn-ghost btn-sm" onClick={() => void loadDashboard(true)} disabled={refreshing}>
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      }
    >
      <AiBanner
        text={`<strong>Platform overview:</strong> ${actions?.fraudCases || 0} flagged payment disputes, ${actions?.saccoApprovals || 0} pending SACCO approvals, and ${stats?.activeTrips || 0} scheduled trips currently active.`}
        action={<button className="btn btn-primary btn-sm" onClick={() => nav('/admin/saccos')}>Review SACCOs</button>}
      />
      <div className="stat-grid mb-6">
        <StatTile label="Total users" value={loading ? '...' : (stats?.totalUsers || 0).toLocaleString()} />
        <StatTile label="Active SACCOs" value={loading ? '...' : (stats?.activeSaccos || 0).toLocaleString()} sub={`${actions?.saccoApprovals || 0} pending approval`} />
        <StatTile label="Bookings today" value={loading ? '...' : (stats?.bookingsToday || 0).toLocaleString()} />
        <StatTile label="Gross rev MTD" value={loading ? '...' : formatKes(stats?.grossRevenue || 0)} />
      </div>
      <div className="stat-grid mb-6">
        <StatTile label="Failed payments" value={loading ? '...' : (stats?.failedPaymentsToday || 0).toLocaleString()} sub="Today" neg />
        <StatTile label="Active trips" value={loading ? '...' : (stats?.activeTrips || 0).toLocaleString()} sub="Across all SACCOs" />
        <StatTile label="Commission" value={loading ? '...' : formatKes(stats?.commission || 0)} sub="This month" />
        <StatTile label="Open disputes" value={loading ? '...' : (stats?.openDisputes || 0).toLocaleString()} sub="Needs action" neg />
      </div>

      <AiAgentPanel
        title="AI Platform Guardian"
        subtitle="Autonomous fraud detection, anomaly scoring, and decision assist from live platform data"
        cols={3}
        cards={[
          {
            type: 'Fraud / Anomaly Scoring',
            icon: '🛡️',
            result: `${actions?.fraudCases || 0} disputes flagged`,
            detail: 'These include failed payment callbacks and unresolved booking-payment mismatches requiring admin review.',
            confidence: loading ? 0 : 90,
            actionLabel: 'Review cases',
            onAction: () => nav('/admin/bookings'),
            accentColor: '#ef4444',
          },
          {
            type: 'Unified Decision Assist',
            icon: '🤖',
            result: `Platform stable - ${actions?.saccoApprovals || 0} approval actions`,
            detail: `Top action: review ${actions?.saccoApprovals || 0} pending SACCO approvals and ${actions?.pendingWithdrawals || 0} pending withdrawals.`,
            confidence: loading ? 0 : 95,
            actionLabel: 'View summary',
            onAction: () => nav('/admin/analytics'),
            accentColor: 'var(--brand)',
          },
          {
            type: 'Dynamic Pricing Insight',
            icon: '📊',
            result: `${routes.length} top active routes`,
            detail: `Highest observed route volume in the sampled window: ${routes[0]?.route || 'N/A'} with ${routes[0]?.bookings || 0} bookings.`,
            confidence: loading ? 0 : 88,
            actionLabel: 'View analytics',
            onAction: () => nav('/admin/analytics'),
            accentColor: '#7c3aed',
          },
        ]}
      />

      <div className="grid-2">
        <div className="card">
          <div className="card-title">Top routes (platform-wide)</div>
          {routes.length ? (
            routes.map((r) => {
              const pct = Math.round((r.bookings / topRouteMax) * 100);
              return (
                <ChartBar
                  key={r.route}
                  label={r.route}
                  pct={pct}
                  display={String(r.bookings)}
                  val={String(r.bookings)}
                />
              );
            })
          ) : (
            <p className="text-sm text-muted">No route volume data available yet.</p>
          )}
        </div>
        <div className="card">
          <div className="card-title">Pending actions</div>
          {[
            ['SACCO approvals', 'amber', `${actions?.saccoApprovals || 0} pending`, '/admin/saccos'],
            ['Fraud cases', 'red', `${actions?.fraudCases || 0} held`, '/admin/bookings'],
            ['Open disputes', 'amber', `${actions?.openDisputes || 0} open`, '/admin/support'],
            ['Withdrawals', 'blue', `${actions?.pendingWithdrawals || 0} pending`, '/admin/payments'],
          ].map(([l, v, c, p]) => (
            <div key={l as string} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--gray-100)', fontSize: 13.5 }}>
              <span>{l}</span>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Badge variant={v as any}>{c}</Badge>
                <button className="btn btn-sm" onClick={() => nav(p as string)}>Review</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}

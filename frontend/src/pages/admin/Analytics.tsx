import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { StatTile, ChartBar, AiBanner, AiAgentPanel } from '../../components/UI';
import { Badge } from '../../components/UI';
import { getAdminAnalyticsApi } from '../../lib/api';

export default function AdminAnalytics() {
  const nav = useNavigate();
  const [aiSummary, setAiSummary] = useState('Analytics loaded.');
  const [analytics, setAnalytics] = useState<{ months: Array<{ month: string; revenue: number; bookings: number }>; topRoutes: Array<{ route: string; bookings: number; revenue: number }>; topSaccos: Array<{ name: string; revenue: number; bookings: number }> } | null>(null);
  const [loading, setLoading] = useState(true);

  const [aiCards, setAiCards] = useState([
    {
      type: 'Fraud Control',
      icon: '🛡️',
      result: 'Awaiting analytics data',
      detail: 'Load platform analytics to generate live fraud indicators.',
      confidence: 0,
      actionLabel: 'Open bookings',
      onAction: () => nav('/admin/bookings'),
      accentColor: '#ef4444',
    },
    {
      type: 'Dispatch Optimizer',
      icon: '🚌',
      result: 'Awaiting analytics data',
      detail: 'Load platform analytics to evaluate dispatch pressure.',
      confidence: 0,
      actionLabel: 'Open routes',
      onAction: () => nav('/admin/saccos'),
      accentColor: 'var(--brand)',
    },
    {
      type: 'Pricing Intelligence',
      icon: '📈',
      result: 'Awaiting analytics data',
      detail: 'Load platform analytics to project pricing insights.',
      confidence: 0,
      actionLabel: 'View trends',
      onAction: () => nav('/admin/payments'),
      accentColor: '#7c3aed',
    },
  ]);

  const aiSubtitle = useMemo(
    () => (loading ? 'Loading analytics insights...' : 'Insights based on live platform analytics'),
    [loading]
  );

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      setLoading(true);
      try {
        const response = await getAdminAnalyticsApi();
        if (mounted) setAnalytics(response.data);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void run();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!analytics) return;

    const totalRevenue = analytics.months.reduce((sum, m) => sum + m.revenue, 0);
    const totalBookings = analytics.months.reduce((sum, m) => sum + m.bookings, 0);
    const topRoute = analytics.topRoutes[0];
    const topSacco = analytics.topSaccos[0];

    setAiSummary(
      topRoute
        ? `Top route is ${topRoute.route} with ${topRoute.bookings} bookings. Total revenue across 6 months is KES ${Math.round(totalRevenue * 1_000_000).toLocaleString()}.`
        : `Analytics loaded. Total revenue across 6 months is KES ${Math.round(totalRevenue * 1_000_000).toLocaleString()}.`
    );

    setAiCards([
      {
        type: 'Fraud Control',
        icon: '🛡️',
        result: `${totalBookings} bookings analysed`,
        detail: 'Review bookings and failed payments for anomalies based on live platform data.',
        confidence: totalBookings ? 82 : 0,
        actionLabel: 'Review bookings',
        onAction: () => nav('/admin/bookings'),
        accentColor: '#ef4444',
      },
      {
        type: 'Dispatch Optimizer',
        icon: '🚌',
        result: topRoute ? `Top demand: ${topRoute.route}` : 'Demand data unavailable',
        detail: topRoute
          ? `Highest route volume is ${topRoute.bookings} bookings. Prioritize capacity and standby vehicles.`
          : 'No route volume data available to guide dispatch.',
        confidence: topRoute ? 84 : 0,
        actionLabel: 'Open SACCOs',
        onAction: () => nav('/admin/saccos'),
        accentColor: 'var(--brand)',
      },
      {
        type: 'Pricing Intelligence',
        icon: '📈',
        result: topSacco ? `Top revenue: ${topSacco.name}` : 'Revenue data unavailable',
        detail: topSacco
          ? `Top SACCO revenue is KES ${Math.round(topSacco.revenue).toLocaleString()}. Adjust pricing policies accordingly.`
          : 'No SACCO revenue data available to guide pricing.',
        confidence: topSacco ? 78 : 0,
        actionLabel: 'View payments',
        onAction: () => nav('/admin/payments'),
        accentColor: '#7c3aed',
      },
    ]);
  }, [analytics, nav]);

  const monthly = analytics?.months || [];
  const topRoutes = analytics?.topRoutes || [];
  const topSaccos = analytics?.topSaccos || [];
  const maxRouteBookings = Math.max(1, ...topRoutes.map((r) => r.bookings));

  return (
    <DashboardLayout
      title="Reports & Analytics"
      subtitle="Platform-wide performance metrics and revenue intelligence"
      actions={
        <div style={{ display: 'flex', gap: 8 }}>
          <select className="input" style={{ fontSize: 13, padding: '6px 12px', height: 36, minWidth: 130 }}>
            <option>Last 6 months</option>
            <option>Last 30 days</option>
            <option>This year</option>
          </select>
          <button className="btn btn-primary btn-sm">Export CSV</button>
        </div>
      }
    >
      <AiBanner
        text={`<strong>AI Insight:</strong> ${aiSummary}`}
      />

      <div style={{ margin: '18px 0 24px' }}>
        <AiAgentPanel
          title="AI Analytics Copilot"
          subtitle={aiSubtitle}
          cards={aiCards}
          cols={3}
        />
      </div>

      {/* KPIs */}
      <div className="stat-grid" style={{ marginBottom: 28 }}>
        <StatTile label="Gross Revenue (6 mo)" value={loading ? '...' : `KES ${Math.round(monthly.reduce((sum, m) => sum + m.revenue, 0) * 1_000_000).toLocaleString()}`} />
        <StatTile label="Total Bookings"       value={loading ? '...' : monthly.reduce((sum, m) => sum + m.bookings, 0).toLocaleString()} />
        <StatTile label="Active SACCOs"        value={loading ? '...' : topSaccos.length.toLocaleString()} />
        <StatTile label="Platform Commission"  value={loading ? '...' : `KES ${Math.round(monthly.reduce((sum, m) => sum + m.revenue * 1_000_000, 0) * 0.05).toLocaleString()}`} />
        <StatTile label="Avg Fare"             value={loading ? '...' : `KES ${Math.round(monthly.reduce((sum, m) => sum + m.revenue * 1_000_000, 0) / Math.max(1, monthly.reduce((sum, m) => sum + m.bookings, 0))).toLocaleString()}`} />
        <StatTile label="Refund Rate"          value="—" sub="Awaiting refunds model" />
        <StatTile label="New Users (Mar)"      value="—" sub="Awaiting user growth model" />
        <StatTile label="Repeat Booking Rate"  value="—" sub="Awaiting cohort model" />
      </div>

      <div className="grid-2" style={{ gap: 20, marginBottom: 24 }}>
        {/* Monthly revenue bars */}
        <div className="card">
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Monthly Revenue (KES M)</div>
          {monthly.length ? (
            monthly.map((m) => (
              <ChartBar key={m.month} label={m.month} pct={Math.min(100, Math.round(m.revenue * 20))} display={`KES ${m.revenue}M`} val={`${m.bookings.toLocaleString()} trips`} />
            ))
          ) : (
            <p className="text-sm text-muted">No analytics available yet.</p>
          )}
        </div>

        {/* Top routes */}
        <div className="card">
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Top Routes by Volume</div>
          {topRoutes.length ? (
            topRoutes.map((r) => (
              <ChartBar key={r.route} label={r.route} pct={Math.round((r.bookings / maxRouteBookings) * 100)} display={r.bookings.toLocaleString()} val={`KES ${Math.round(r.revenue).toLocaleString()}`} />
            ))
          ) : (
            <p className="text-sm text-muted">No route analytics available.</p>
          )}
        </div>
      </div>

      {/* SACCO performance table */}
      <div className="card">
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>SACCO Revenue Breakdown — Mar 2026</div>
        <div className="table-wrap">
          <table className="sc-table">
            <thead>
              <tr>
                <th>SACCO</th>
                <th>Market share</th>
                <th>Revenue</th>
                <th>MoM growth</th>
              </tr>
            </thead>
            <tbody>
              {topSaccos.length ? (
                topSaccos.map((s) => (
                  <tr key={s.name}>
                    <td style={{ fontWeight: 600 }}>{s.name}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ flex: 1, height: 8, background: 'var(--gray-100)', borderRadius: 99, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${Math.min(100, Math.round((s.revenue / Math.max(1, topSaccos[0]?.revenue || 1)) * 100))}%`, background: 'var(--brand)', borderRadius: 99 }} />
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600, minWidth: 32 }}>{Math.round((s.revenue / Math.max(1, topSaccos.reduce((sum, row) => sum + row.revenue, 0))) * 100)}%</span>
                      </div>
                    </td>
                    <td style={{ fontWeight: 600 }}>{`KES ${Math.round(s.revenue).toLocaleString()}`}</td>
                    <td><Badge variant={'gray'}>{s.bookings} bookings</Badge></td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--gray-400)', padding: 24 }}>No SACCO analytics yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}

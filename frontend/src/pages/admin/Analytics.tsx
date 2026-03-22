import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { StatTile, ChartBar, AiBanner, AiAgentPanel } from '../../components/UI';
import { Badge } from '../../components/UI';
import { getAdminAnalyticsApi } from '../../lib/api';
import type { AdminAnalyticsEnvelope } from '../../lib/api';
import { buildAnalyticsCsv, formatKes, getRangeLabel } from './analytics.utils';

type AnalyticsData = AdminAnalyticsEnvelope['data'];
type AnalyticsRange = AnalyticsData['range'];

export default function AdminAnalytics() {
  const nav = useNavigate();
  const [aiSummary, setAiSummary] = useState('Loading analytics from live platform data...');
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<AnalyticsRange>('6m');

  const [aiCards, setAiCards] = useState([
    {
      type: 'Fraud Control',
      icon: '🛡️',
      result: 'Loading analytics data',
      detail: 'Load platform analytics to generate live fraud indicators.',
      confidence: 0,
      actionLabel: 'Open bookings',
      onAction: () => nav('/admin/bookings'),
      accentColor: '#ef4444',
    },
    {
      type: 'Dispatch Optimizer',
      icon: '🚌',
      result: 'Loading analytics data',
      detail: 'Load platform analytics to evaluate dispatch pressure.',
      confidence: 0,
      actionLabel: 'Open routes',
      onAction: () => nav('/admin/saccos'),
      accentColor: 'var(--brand)',
    },
    {
      type: 'Pricing Intelligence',
      icon: '📈',
      result: 'Loading analytics data',
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
        const response = await getAdminAnalyticsApi({ range });
        if (mounted) setAnalytics(response.data);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void run();
    return () => {
      mounted = false;
    };
  }, [range]);

  useEffect(() => {
    if (!analytics) return;

    const totalRevenue = analytics.kpis.grossRevenue;
    const totalBookings = analytics.kpis.totalBookings;
    const topRoute = analytics.topRoutes[0];
    const topSacco = analytics.topSaccos[0];

    setAiSummary(
      topRoute
        ? `Top route is ${topRoute.route} with ${topRoute.bookings} bookings. Revenue in ${analytics.periodLabel.toLowerCase()} is ${formatKes(totalRevenue)}.`
        : `Analytics loaded. Revenue in ${analytics.periodLabel.toLowerCase()} is ${formatKes(totalRevenue)}.`
    );

    setAiCards([
      {
        type: 'Fraud Control',
        icon: '🛡️',
        result: `${totalBookings.toLocaleString()} bookings analysed`,
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
          ? `Top SACCO revenue is ${formatKes(topSacco.revenue)}. Adjust pricing policies accordingly.`
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

  const exportCsv = () => {
    if (!analytics) return;

    const csv = buildAnalyticsCsv(analytics);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `admin-analytics-${analytics.range}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout
      title="Reports & Analytics"
      subtitle="Platform-wide performance metrics and revenue intelligence"
      actions={
        <div style={{ display: 'flex', gap: 8 }}>
          <select
            className="input"
            style={{ fontSize: 13, padding: '6px 12px', height: 36, minWidth: 130 }}
            value={range}
            onChange={(e) => setRange(e.target.value as AnalyticsRange)}
          >
            <option value="6m">Last 6 months</option>
            <option value="30d">Last 30 days</option>
            <option value="ytd">This year</option>
          </select>
          <button className="btn btn-primary btn-sm" onClick={exportCsv} disabled={loading || !analytics}>
            Export CSV
          </button>
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
        <StatTile label={`Gross Revenue (${analytics?.periodLabel || getRangeLabel(range)})`} value={loading ? '...' : formatKes(analytics?.kpis.grossRevenue || 0)} />
        <StatTile label="Total Bookings" value={loading ? '...' : (analytics?.kpis.totalBookings || 0).toLocaleString()} />
        <StatTile label="Active SACCOs" value={loading ? '...' : (analytics?.kpis.activeSaccos || 0).toLocaleString()} />
        <StatTile label="Platform Commission" value={loading ? '...' : formatKes(analytics?.kpis.platformCommission || 0)} />
        <StatTile label="Avg Fare" value={loading ? '...' : formatKes(analytics?.kpis.avgFare || 0)} />
        <StatTile label="Refund Rate" value={loading ? '...' : `${(analytics?.kpis.refundRate || 0).toFixed(1)}%`} />
        <StatTile label="New Users" value={loading ? '...' : (analytics?.kpis.newUsers || 0).toLocaleString()} />
        <StatTile label="Repeat Booking Rate" value={loading ? '...' : `${(analytics?.kpis.repeatBookingRate || 0).toFixed(1)}%`} />
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
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>SACCO Revenue Breakdown - {analytics?.periodLabel || getRangeLabel(range)}</div>
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

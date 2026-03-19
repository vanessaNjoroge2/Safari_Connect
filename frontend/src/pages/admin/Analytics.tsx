import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { StatTile, ChartBar, AiBanner, AiAgentPanel } from '../../components/UI';
import { Badge } from '../../components/UI';
import { aiAssistApi } from '../../lib/api';

const MONTHLY = [
  { month: 'Oct 2025', revenue: 2.1, bookings: 4210, pct: 48 },
  { month: 'Nov 2025', revenue: 2.8, bookings: 5600, pct: 64 },
  { month: 'Dec 2025', revenue: 3.9, bookings: 7800, pct: 89 },
  { month: 'Jan 2026', revenue: 3.2, bookings: 6400, pct: 73 },
  { month: 'Feb 2026', revenue: 3.6, bookings: 7200, pct: 82 },
  { month: 'Mar 2026', revenue: 4.2, bookings: 8910, pct: 96 },
];

const TOP_ROUTES = [
  { route: 'Nairobi → Mombasa', bookings: 2840, pct: 100, revenue: 'KES 4.3M' },
  { route: 'Nairobi → Nakuru',  bookings: 2210, pct: 78,  revenue: 'KES 1.9M' },
  { route: 'Nairobi → Kisumu',  bookings: 1760, pct: 62,  revenue: 'KES 2.0M' },
  { route: 'Nairobi → Eldoret', bookings: 1340, pct: 47,  revenue: 'KES 1.2M' },
  { route: 'Mombasa → Malindi', bookings:  890, pct: 31,  revenue: 'KES 535K' },
];

const TOP_SACCOS = [
  { name: 'Easy Coach',    share: 31, revenue: 'KES 1.30M', growth: '+14%', variant: 'green'  },
  { name: 'Modern Coast',  share: 24, revenue: 'KES 1.01M', growth: '+9%',  variant: 'green'  },
  { name: 'Eldoret Exp.',  share: 18, revenue: 'KES 756K',  growth: '+5%',  variant: 'green'  },
  { name: 'City Express',  share: 12, revenue: 'KES 504K',  growth: '-2%',  variant: 'amber'  },
  { name: 'Coast Bus',     share:  9, revenue: 'KES 378K',  growth: '+11%', variant: 'green'  },
  { name: 'Others',        share:  6, revenue: 'KES 252K',  growth: '—',    variant: 'gray'   },
];

export default function AdminAnalytics() {
  const nav = useNavigate();
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState('AI analysing platform demand, risk, and revenue opportunities.');

  const [aiCards, setAiCards] = useState([
    {
      type: 'Fraud Control',
      icon: '🛡️',
      result: 'Scanning transaction stream',
      detail: 'Live fraud monitor warming up for this reporting period.',
      confidence: 72,
      actionLabel: 'Open bookings',
      onAction: () => nav('/admin/bookings'),
      accentColor: '#ef4444',
    },
    {
      type: 'Dispatch Optimizer',
      icon: '🚌',
      result: 'Evaluating occupancy pressure',
      detail: 'AI checking route demand and standby-vehicle requirements.',
      confidence: 74,
      actionLabel: 'Open routes',
      onAction: () => nav('/admin/saccos'),
      accentColor: 'var(--brand)',
    },
    {
      type: 'Pricing Intelligence',
      icon: '📈',
      result: 'Predicting best fare window',
      detail: 'Dynamic pricing model is preparing next route-level recommendation.',
      confidence: 70,
      actionLabel: 'View trends',
      onAction: () => nav('/admin/payments'),
      accentColor: '#7c3aed',
    },
  ]);

  useEffect(() => {
    let alive = true;

    const runAssist = async () => {
      setAiLoading(true);
      try {
        const response = await aiAssistApi({
          prompt:
            'You are platform AI. Summarize risk, dispatch, and pricing decisions for admin reporting in one concise action line.',
          language: 'en',
          route: 'Nairobi-Mombasa',
          departureTime: '18:00',
          currentPrice: 1500,
          totalSeats: 52,
          bookedSeats: 46,
          noShowRate: 0.07,
          riskFactors: {
            weatherRisk: 0.28,
            trafficRisk: 0.62,
            routeRisk: 0.44,
          },
          fraudSignals: {
            attemptsLast24h: 6,
            cardMismatch: true,
            rapidRetries: 3,
            geoMismatch: false,
          },
          trips: [
            { id: 'nbi-msa-easy-0600', route: 'Nairobi-Mombasa', price: 1500, travelMinutes: 420, reliabilityScore: 0.87 },
            { id: 'nbi-msa-coast-0800', route: 'Nairobi-Mombasa', price: 1800, travelMinutes: 410, reliabilityScore: 0.82 },
            { id: 'nbi-nkr-0800', route: 'Nairobi-Nakuru', price: 850, travelMinutes: 130, reliabilityScore: 0.91 },
          ],
          intent: {
            maxBudget: 1900,
            maxTravelMinutes: 430,
          },
        });

        if (!alive) return;

        const modules = response.data.modules;
        const fraudPct = Math.round((modules.fraud.confidence || 0) * 100);
        const operationsPct = Math.round((modules.operations.confidence || 0) * 100);
        const pricingPct = Math.round((modules.pricing.confidence || 0) * 100);

        setAiSummary(response.data.summary.passengerMessage || 'AI summary ready for reporting.');
        setAiCards([
          {
            type: 'Fraud Control',
            icon: '🛡️',
            result: `Decision: ${modules.fraud.decision.toUpperCase()} · Score ${(modules.fraud.fraudScore * 100).toFixed(0)}%`,
            detail: 'Autonomous risk scoring reviewed payment velocity and retry patterns for live booking stream.',
            confidence: fraudPct,
            actionLabel: 'Review fraud queue',
            onAction: () => nav('/admin/bookings'),
            accentColor: '#ef4444',
          },
          {
            type: 'Dispatch Optimizer',
            icon: '🚌',
            result: `Action: ${modules.operations.action.replace('_', ' ')} · Occupancy ${(modules.operations.occupancyRate * 100).toFixed(0)}%`,
            detail: modules.operations.dispatchAdvice,
            confidence: operationsPct,
            actionLabel: 'Open route operations',
            onAction: () => nav('/admin/saccos'),
            accentColor: 'var(--brand)',
          },
          {
            type: 'Pricing Intelligence',
            icon: '📈',
            result: `KES ${modules.pricing.currentPrice.toLocaleString()} → KES ${modules.pricing.predictedPrice.toLocaleString()}`,
            detail: `Demand ${modules.pricing.demandLevel}. Suggested cheaper window: ${modules.pricing.cheaperWindowSuggestion}.`,
            confidence: pricingPct,
            actionLabel: 'Apply pricing policy',
            onAction: () => nav('/admin/payments'),
            accentColor: '#7c3aed',
          },
        ]);
      } catch {
        if (!alive) return;
        setAiSummary('Live AI service unavailable. Showing autonomous fallback strategy based on current platform trends.');
      } finally {
        if (alive) setAiLoading(false);
      }
    };

    void runAssist();
    return () => {
      alive = false;
    };
  }, [nav]);

  const aiSubtitle = useMemo(
    () => (aiLoading ? 'Refreshing recommendations from Safiri autonomous agent...' : 'Autonomous insights for fraud, dispatch, and pricing actions'),
    [aiLoading]
  );

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
        <StatTile label="Gross Revenue (Mar)" value="KES 4.2M" sub="+17% vs Feb" />
        <StatTile label="Total Bookings"       value="8,910"    sub="+1,710 this month" />
        <StatTile label="Active SACCOs"        value="34"       sub="2 pending approval" />
        <StatTile label="Platform Commission"  value="KES 210K" sub="5% avg rate" />
        <StatTile label="Avg Fare"             value="KES 1,150" sub="Across all routes" />
        <StatTile label="Refund Rate"          value="1.8%"     sub="↓ from 2.4% last month" />
        <StatTile label="New Users (Mar)"      value="1,240"    sub="+204 WoW" />
        <StatTile label="Repeat Booking Rate"  value="68%"      sub="Strong loyalty" />
      </div>

      <div className="grid-2" style={{ gap: 20, marginBottom: 24 }}>
        {/* Monthly revenue bars */}
        <div className="card">
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Monthly Revenue (KES M)</div>
          {MONTHLY.map(m => (
            <ChartBar key={m.month} label={m.month} pct={m.pct} display={`KES ${m.revenue}M`} val={`${m.bookings.toLocaleString()} trips`} />
          ))}
        </div>

        {/* Top routes */}
        <div className="card">
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Top Routes by Volume</div>
          {TOP_ROUTES.map(r => (
            <ChartBar key={r.route} label={r.route} pct={r.pct} display={r.bookings.toLocaleString()} val={r.revenue} />
          ))}
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
              {TOP_SACCOS.map(s => (
                <tr key={s.name}>
                  <td style={{ fontWeight: 600 }}>{s.name}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ flex: 1, height: 8, background: 'var(--gray-100)', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${s.share * 3}%`, background: 'var(--brand)', borderRadius: 99 }} />
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, minWidth: 32 }}>{s.share}%</span>
                    </div>
                  </td>
                  <td style={{ fontWeight: 600 }}>{s.revenue}</td>
                  <td><Badge variant={s.variant as any}>{s.growth}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}

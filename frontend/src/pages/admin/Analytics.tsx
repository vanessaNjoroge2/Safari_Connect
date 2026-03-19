import DashboardLayout from '../../components/DashboardLayout';
import { StatTile, ChartBar, AiBanner } from '../../components/UI';
import { Badge } from '../../components/UI';

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
        text="<strong>AI Insight:</strong> March 2026 is your best-ever month. Revenue up 17% MoM. Nairobi→Mombasa route contributes 34% of gross revenue. Recommend launching Nairobi→Malindi direct route — AI forecasts KES 680K/month potential."
      />

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

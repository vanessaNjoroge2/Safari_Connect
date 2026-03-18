import { Metric, ChartBar, PieChart } from '../../components/UI';
export default function OwnerAnalytics() {
  const daily = [{l:'Mon',pct:52,d:'KES 38K'},{l:'Tue',pct:60,d:'KES 44K'},{l:'Wed',pct:68,d:'KES 50K'},{l:'Thu',pct:79,d:'KES 58K'},{l:'Fri',pct:100,d:'KES 74K'},{l:'Sat',pct:88,d:'KES 65K'},{l:'Sun',pct:73,d:'KES 54K'}];
  const routes = [{l:'NBI→Nakuru',pct:100,v:'680'},{l:'NBI→Mombasa',pct:72,v:'490'},{l:'NBI→Kisumu',pct:55,v:'374'},{l:'NBI→Eldoret',pct:44,v:'296'}];
  const pie = [{color:'#0ea371',pct:55,offset:25,label:'Economy — 55%'},{color:'#3b82f6',pct:25,offset:-30,label:'Business — 25%'},{color:'#8b5cf6',pct:20,offset:-55,label:'VIP — 20%'}];
  return (
    <div>
      <div className="page-header"><div><div className="page-title">Analytics</div><div className="page-sub">Modern Coast Sacco</div></div></div>
      <div className="page-body">
        <div className="metric-grid">
          <Metric label="Total revenue" value="1.2M" sub="KES this month"/>
          <Metric label="Total bookings" value="1,840" sub="+18% vs last month"/>
          <Metric label="Avg occupancy" value="79%" sub="Per trip"/>
          <Metric label="Cancellation rate" value="2.1%" sub="Industry avg: 4.3%"/>
        </div>
        <div className="metric-grid">
          <Metric label="Most booked route" value="NBI→Nakuru" sub="680 bookings"/>
          <Metric label="Most booked bus" value="KBZ 123A" sub="920 trips"/>
          <Metric label="Peak travel time" value="7–9 AM" sub="68% of bookings"/>
          <Metric label="AI revenue uplift" value="+84K" sub="KES from dynamic pricing"/>
        </div>
        <div className="two-col" style={{marginBottom:16}}>
          <div className="card"><div className="card-title">Revenue over time (daily)</div><div className="chart-wrap">{daily.map(d=><ChartBar key={d.l} label={d.l} pct={d.pct} display={d.d}/>)}</div></div>
          <div className="card"><div className="card-title">Route popularity</div><div className="chart-wrap">{routes.map(r=><ChartBar key={r.l} label={r.l} pct={r.pct} display={r.v} val={r.v}/>)}</div></div>
        </div>
        <div className="two-col">
          <div className="card"><div className="card-title">Seat class demand</div><PieChart segments={pie}/></div>
          <div className="card">
            <div className="card-title">Payment status</div>
            <div className="chart-wrap">
              <ChartBar label="Successful" pct={93} display="93%"/>
              <div className="chart-row"><div className="chart-label">Pending</div><div className="chart-track"><div className="chart-fill" style={{width:'4%',background:'var(--amber)'}}>4%</div></div></div>
              <div className="chart-row"><div className="chart-label">Failed</div><div className="chart-track"><div className="chart-fill" style={{width:'3%',background:'var(--red)'}}>3%</div></div></div>
            </div>
            <div className="sep"/>
            <div style={{fontSize:12,color:'var(--gray-500)'}}>🤖 AI: Peak booking hour is <strong>7–9 AM</strong>. Business class most demanded on <strong>Fridays</strong>.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
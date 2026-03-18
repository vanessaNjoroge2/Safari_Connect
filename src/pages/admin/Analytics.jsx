import { Metric, ChartBar, PieChart, showToast } from '../../components/UI';
export default function AdminAnalytics() {
  const daily = [{l:'Mon',pct:55,v:'880'},{l:'Tue',pct:62,v:'990'},{l:'Wed',pct:78,v:'1,240'},{l:'Thu',pct:70,v:'1,120'},{l:'Fri',pct:100,v:'1,600'},{l:'Sat',pct:90,v:'1,440'},{l:'Sun',pct:72,v:'1,150'}];
  const saccos = [{l:'Easy Coach',pct:100,v:'2.1M'},{l:'Modern Coast',pct:57,v:'1.2M'},{l:'NBI Matatus',pct:42,v:'880K'},{l:'Eldoret Exp.',pct:28,v:'590K'}];
  const pie = [{color:'#0ea371',pct:68,offset:25,label:'Buses — 68%'},{color:'#3b82f6',pct:18,offset:-43,label:'Matatu — 18%'},{color:'#f59e0b',pct:9,offset:-61,label:'Motorbike — 9%'},{color:'#8b5cf6',pct:5,offset:-70,label:'Carrier — 5%'}];
  const ai = [['Dynamic price adjustments','14 routes','var(--green)'],['Fraud bookings auto-held','3 cases','var(--red)'],['No-show predictions','22 trips',null],['Schedule suggestions sent','6 owners',null],['Double bookings prevented','2 blocked','var(--green)'],['AI revenue uplift','+KES 84,000','var(--green)']];
  return (
    <div>
      <div className="page-header"><div className="page-title">Reports & Analytics</div><div className="page-actions"><button className="btn btn-sm" onClick={()=>showToast('Report downloaded!')}>Download</button></div></div>
      <div className="page-body">
        <div className="metric-grid">
          <Metric label="Most active category" value="Buses 🚌" sub="68% of bookings"/>
          <Metric label="Top SACCO" value="Easy Coach" sub="KES 2.1M MTD"/>
          <Metric label="Fraud blocked" value="14" sub="AI blocked all"/>
          <Metric label="Platform occupancy" value="79%" sub="Avg per trip"/>
        </div>
        <div className="two-col" style={{marginBottom:16}}>
          <div className="card"><div className="card-title">Booking trends (daily)</div><div className="chart-wrap">{daily.map(d=><ChartBar key={d.l} label={d.l} pct={d.pct} display={d.v} val={d.v}/>)}</div></div>
          <div className="card"><div className="card-title">Revenue by SACCO</div><div className="chart-wrap">{saccos.map(s=><ChartBar key={s.l} label={s.l} pct={s.pct} display={s.v} val={s.v}/>)}</div></div>
        </div>
        <div className="two-col">
          <div className="card"><div className="card-title">Category demand split</div><PieChart segments={pie}/></div>
          <div className="card">
            <div className="card-title">AI autonomous decisions today</div>
            {ai.map(([l,v,c])=>(
              <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'7px 0',borderBottom:'1px solid var(--gray-100)',fontSize:13}}>
                <span>{l}</span><span style={{fontWeight:700,color:c||'var(--gray-700)'}}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
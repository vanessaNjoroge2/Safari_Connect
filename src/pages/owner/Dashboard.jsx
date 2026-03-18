import { useNavigate } from 'react-router-dom';
import { AiBanner, Metric, ChartBar } from '../../components/UI';

export default function OwnerDashboard() {
  const navigate = useNavigate();
  const trips = [
    {name:'NBI → Nakuru 8:00 AM · KBZ 123A',status:'green',label:'On route'},
    {name:'NBI → Mombasa 6:00 AM · KCA 456B',status:'green',label:'On route'},
    {name:'NBI → Kisumu 9:00 AM · KDB 789C',status:'amber',label:'Boarding'},
    {name:'NBI → Nakuru 2:00 PM · KCA 456B',status:'blue',label:'Scheduled'},
    {name:'NBI → Eldoret 3:00 PM · KBZ 123A',status:'blue',label:'Scheduled'},
  ];
  const routes = [{l:'NBI→Nakuru',pct:92,v:'46/50'},{l:'NBI→Mombasa',pct:76,v:'38/50'},{l:'NBI→Kisumu',pct:58,v:'29/50'},{l:'NBI→Eldoret',pct:38,v:'19/50'}];
  return (
    <div>
      <div className="page-header">
        <div><div className="page-title">Dashboard</div><div className="page-sub">Modern Coast Sacco</div></div>
        <div className="page-actions"><button className="btn btn-primary btn-sm" onClick={()=>navigate('/owner/schedules')}>+ Create trip</button></div>
      </div>
      <div className="page-body">
        <AiBanner text="<strong>Friday Nakuru route will be 96% full.</strong> Deploy extra vehicle by Thursday. Projected extra revenue: KES 42,500. Dynamic pricing raised fares 24% — zero cancellations." action={<button className="btn btn-primary btn-sm" onClick={()=>navigate('/owner/fleet')}>Add vehicle</button>} />
        <div className="metric-grid">
          <Metric label="Trips today" value="8" sub="2 on route now"/>
          <Metric label="Bookings today" value="87" sub="+12% vs yesterday"/>
          <Metric label="Revenue today" value="74K" sub="KES 74,200"/>
          <Metric label="Occupancy rate" value="81%" sub="AI optimised"/>
        </div>
        <div className="metric-grid">
          <Metric label="Seats booked" value="348" sub="Of 430 available"/>
          <Metric label="Pending payments" value="3" sub="Needs attention" neg/>
          <Metric label="Cancelled today" value="2" sub="KES 1,700 refunded"/>
          <Metric label="Monthly revenue" value="1.2M" sub="KES net"/>
        </div>
        <div style={{fontFamily:"'Syne',sans-serif",fontSize:14,fontWeight:700,marginBottom:10,color:'var(--gray-700)'}}>Quick actions</div>
        <div className="quick-actions">
          {[['🚌 Add new bus','/owner/fleet'],['📅 Create trip','/owner/schedules'],['🗺️ Routes','/owner/routes'],['🎫 Bookings','/owner/bookings'],['📈 Analytics','/owner/analytics']].map(([l,p])=>(
            <div key={l} className="quick-action" onClick={()=>navigate(p)}>{l}</div>
          ))}
        </div>
        <div className="two-col">
          <div className="card">
            <div className="card-title">Today's trips</div>
            {trips.map(t=>(
              <div key={t.name} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'9px 0',borderBottom:'1px solid var(--gray-100)',fontSize:13}}>
                <span><strong>{t.name.split(' ')[0]+' '+t.name.split(' ')[1]+' '+t.name.split(' ')[2]}</strong> {t.name.split(' ').slice(3).join(' ')}</span>
                <span className={`badge badge-${t.status}`}>{t.label}</span>
              </div>
            ))}
          </div>
          <div className="card">
            <div className="card-title">Route occupancy</div>
            <div className="chart-wrap">{routes.map(r=><ChartBar key={r.l} label={r.l} pct={r.pct} display={r.pct+"%"} val={r.v}/>)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
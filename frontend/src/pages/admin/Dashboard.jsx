import { useNavigate } from 'react-router-dom';
import { AiBanner, Metric, ChartBar } from '../../components/UI';
export default function AdminDashboard() {
  const navigate = useNavigate();
  const routes = [{l:'NBI→Mombasa',pct:100,v:'348'},{l:'NBI→Nakuru',pct:84,v:'292'},{l:'NBI→Kisumu',pct:61,v:'211'},{l:'NBI→Eldoret',pct:54,v:'187'}];
  return (
    <div>
      <div className="page-header"><div><div className="page-title">Platform overview</div><div className="page-sub">Super Admin</div></div></div>
      <div className="page-body">
        <AiBanner text="<strong>Platform is healthy.</strong> 3 fraud cases auto-held. Dynamic pricing active on 14 routes. Revenue up 18% WoW. 2 SACCO approvals pending your review." action={<button className="btn btn-primary btn-sm" onClick={()=>navigate('/admin/saccos')}>Review SACCOs</button>}/>
        <div className="metric-grid">
          <Metric label="Total users" value="8,910" sub="+204 this week"/>
          <Metric label="Active SACCOs" value="34" sub="2 pending"/>
          <Metric label="Bookings today" value="1,240" sub="+18% WoW"/>
          <Metric label="Gross revenue (MTD)" value="4.2M" sub="KES"/>
        </div>
        <div className="metric-grid">
          <Metric label="Failed payments" value="23" sub="STK failures" neg/>
          <Metric label="Active trips now" value="67" sub="All SACCOs"/>
          <Metric label="Commission earned" value="210K" sub="KES this month"/>
          <Metric label="Open disputes" value="3" sub="Needs action" neg/>
        </div>
        <div className="two-col">
          <div className="card"><div className="card-title">Top routes (platform-wide)</div><div className="chart-wrap">{routes.map(r=><ChartBar key={r.l} label={r.l} pct={r.pct} display={r.v} val={r.v}/>)}</div></div>
          <div className="card">
            <div className="card-title">Pending actions</div>
            {[['SACCO approvals','amber','2 pending','/admin/saccos'],['Fraud cases held','red','3 cases','/admin/bookings'],['Open disputes','amber','3 open','/admin/support'],['Withdrawal requests','blue','5 pending','/admin/payments']].map(([l,v,c,p])=>(
              <div key={l} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'9px 0',borderBottom:'1px solid var(--gray-100)',fontSize:13}}>
                <span>{l}</span>
                <div style={{display:'flex',gap:8,alignItems:'center'}}><span className={`badge badge-${v}`}>{c}</span><button className="btn btn-sm" onClick={()=>navigate(p)}>Review</button></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
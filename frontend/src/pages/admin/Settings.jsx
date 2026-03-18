import { showToast } from '../../components/UI';
export default function AdminSettings() {
  return (
    <div>
      <div className="page-header"><div className="page-title">Platform settings</div><div className="page-actions"><button className="btn btn-primary btn-sm" onClick={()=>showToast('Settings saved!')}>Save all settings</button></div></div>
      <div className="page-body">
        <div className="two-col">
          <div className="card">
            <div className="card-title">AI control centre</div>
            {[['Dynamic pricing','Auto-adjust fares based on demand','green','Enabled'],['Fraud detection','Auto-hold suspicious bookings','green','Enabled'],['No-show prediction','Smart overbooking allowance','green','Enabled'],['Autonomous scheduling','AI suggests new trips to owners','gray','Manual only']].map(([l,d,v,t])=>(
              <div key={l} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'11px 0',borderBottom:'1px solid var(--gray-100)',fontSize:13}}>
                <div><div style={{fontWeight:600}}>{l}</div><div style={{fontSize:11,color:'var(--gray-400)'}}>{d}</div></div>
                <span className={`badge badge-${v}`} style={{cursor:'pointer'}}>{t}</span>
              </div>
            ))}
          </div>
          <div className="card">
            <div className="card-title">Platform configuration</div>
            {[['Platform name','SafiriConnect'],['Default commission (%)','5'],['AI fraud threshold (auto-hold below)','40'],['Max bookings per user/day','5'],['STK push timeout (minutes)','5'],['Support email','support@safiriconnect.co.ke']].map(([l,v])=>(
              <div key={l} className="form-group"><label className="form-label">{l}</label><input className="form-input" defaultValue={v}/></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
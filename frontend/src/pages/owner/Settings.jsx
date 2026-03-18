import { showToast } from '../../components/UI';
export default function OwnerSettings() {
  return (
    <div>
      <div className="page-header"><div className="page-title">Profile / Settings</div><div className="page-actions"><button className="btn btn-primary btn-sm" onClick={()=>showToast('Settings saved!')}>Save changes</button></div></div>
      <div className="page-body">
        <div className="two-col" style={{maxWidth:740}}>
          <div className="card">
            <div className="card-title">SACCO profile</div>
            <div className="form-group"><label className="form-label">SACCO name</label><input className="form-input" defaultValue="Modern Coast Sacco"/></div>
            <div className="form-group"><label className="form-label">Registration number</label><input className="form-input" defaultValue="NTSA/SACCO/2019/4521"/></div>
            <div className="form-group"><label className="form-label">Contact email</label><input className="form-input" defaultValue="ops@moderncoast.co.ke"/></div>
            <div className="form-group"><label className="form-label">Phone</label><input className="form-input" defaultValue="0800 720 444"/></div>
            <div className="form-group"><label className="form-label">M-Pesa paybill</label><input className="form-input" defaultValue="522533"/></div>
          </div>
          <div>
            <div className="card card-sm" style={{marginBottom:12}}>
              <div className="metric-label">Account status</div>
              <div style={{display:'flex',alignItems:'center',gap:8,marginTop:6}}><span className="badge badge-green">Approved</span><span style={{fontSize:12,color:'var(--gray-400)'}}>Verified by admin</span></div>
            </div>
            <div className="card">
              <div className="card-title">AI features</div>
              {[['Dynamic pricing','green','On'],['Fraud detection','green','On'],['No-show prediction','green','On'],['Schedule suggestions','gray','Manual']].map(([l,v,t])=>(
                <div key={l} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'9px 0',borderBottom:'1px solid var(--gray-100)',fontSize:13}}>
                  {l}<span className={`badge badge-${v}`}>{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
import { Metric, showToast } from '../../components/UI';
export default function AdminPayments() {
  return (
    <div>
      <div className="page-header"><div className="page-title">Payments overview</div><div className="page-actions"><button className="btn btn-sm" onClick={()=>showToast('Audit trail downloaded!')}>Export audit trail</button></div></div>
      <div className="page-body">
        <div className="metric-grid">
          <Metric label="Gross processed (MTD)" value="4.2M" sub="KES"/>
          <Metric label="Commission earned" value="210K" sub="5% avg rate"/>
          <Metric label="Failed STK" value="23" sub="Today" neg/>
          <Metric label="Refund requests" value="4" sub="Pending" neg/>
        </div>
        <div className="two-col">
          <div className="card">
            <div className="card-title">Commission rates by category</div>
            {[['Buses / Long haul (%)','5'],['Matatu (%)','5'],['Motorbike / Boda (%)','8'],['Carrier services (%)','6']].map(([l,v])=>(
              <div key={l} className="form-group"><label className="form-label">{l}</label><input className="form-input" defaultValue={v}/></div>
            ))}
            <button className="btn btn-primary" onClick={()=>showToast('Rates updated!')}>Update rates</button>
          </div>
          <div className="card">
            <div className="card-title">SACCO withdrawal queue</div>
            {[['Modern Coast','KES 50,000 → M-Pesa'],['Easy Coach','KES 200,000 → KCB Bank'],['Nairobi Matatus','KES 30,000 → Equity Bank']].map(([n,d])=>(
              <div key={n} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid var(--gray-100)',fontSize:13}}>
                <div><div style={{fontWeight:600}}>{n}</div><div style={{fontSize:11,color:'var(--gray-400)'}}>{d}</div></div>
                <button className="btn btn-primary btn-sm" onClick={()=>showToast('Withdrawal approved!')}>Approve</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
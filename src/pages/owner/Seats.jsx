import { SeatMap, showToast } from '../../components/UI';
export default function SeatLayout() {
  return (
    <div>
      <div className="page-header">
        <div><div className="page-title">Seat Layout & Pricing</div><div className="page-sub">KBZ 123A — Modern Coach</div></div>
        <div className="page-actions"><button className="btn btn-primary btn-sm" onClick={()=>showToast('Seat layout saved!')}>Save layout</button></div>
      </div>
      <div className="page-body">
        <div className="two-col">
          <div>
            <div className="card" style={{marginBottom:14}}>
              <div className="card-title">Seat class pricing (KES)</div>
              <div className="form-group"><label className="form-label">Economy (rows 4–10)</label><input className="form-input" defaultValue="850"/></div>
              <div className="form-group"><label className="form-label">Business (rows 2–3)</label><input className="form-input" defaultValue="1200"/></div>
              <div className="form-group"><label className="form-label">VIP / First Class (row 1)</label><input className="form-input" defaultValue="1800"/></div>
            </div>
            <div className="card">
              <div className="card-title">Special pricing</div>
              <div className="form-group"><label className="form-label">Premium window surcharge (KES)</label><input className="form-input" placeholder="e.g. 150"/></div>
              <div className="form-group"><label className="form-label">Couple seat surcharge (KES)</label><input className="form-input" placeholder="e.g. 200"/></div>
              <div className="form-group"><label className="form-label">Last-minute discount (%)</label><input className="form-input" placeholder="e.g. 15"/></div>
              <div className="form-group"><label className="form-label">AI dynamic pricing</label>
                <select className="form-input"><option>Enabled — auto-adjust</option><option>Manual only</option></select>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="card-title">Seat map preview — KBZ 123A</div>
            <SeatMap interactive={false}/>
            <div style={{marginTop:12,fontSize:12,color:'var(--gray-400)'}}>Click any seat to configure its class.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
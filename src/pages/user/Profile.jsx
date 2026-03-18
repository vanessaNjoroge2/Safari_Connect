import { showToast } from '../../components/UI';

export default function Profile() {
  return (
    <div>
      <div className="page-header">
        <div className="page-title">My profile</div>
        <div className="page-actions"><button className="btn btn-primary btn-sm" onClick={()=>showToast('Profile saved!')}>Save changes</button></div>
      </div>
      <div className="page-body">
        <div className="two-col" style={{maxWidth:720}}>
          <div className="card">
            <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:20}}>
              <div className="avatar" style={{width:52,height:52,fontSize:18,fontWeight:800}}>JM</div>
              <div><div style={{fontSize:17,fontWeight:700}}>Jane Mwangi</div><div style={{fontSize:12,color:'var(--green)',fontWeight:600}}>Trust score: 94/100</div></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">First name</label><input className="form-input" defaultValue="Jane"/></div>
              <div className="form-group"><label className="form-label">Last name</label><input className="form-input" defaultValue="Mwangi"/></div>
            </div>
            <div className="form-group"><label className="form-label">Email</label><input className="form-input" defaultValue="jane.mwangi@gmail.com"/></div>
            <div className="form-group"><label className="form-label">Phone</label><input className="form-input" defaultValue="0712 345 678"/></div>
            <div className="form-group"><label className="form-label">ID number</label><input className="form-input" defaultValue="23456789"/></div>
            <div className="form-group"><label className="form-label">Residence</label><input className="form-input" defaultValue="Nairobi"/></div>
          </div>
          <div>
            <div className="metric" style={{marginBottom:12}}><div className="metric-label">Total trips</div><div className="metric-val">12</div></div>
            <div className="metric" style={{marginBottom:12}}><div className="metric-label">AI trust score</div><div className="metric-val" style={{color:'var(--green)'}}>94</div><div className="metric-sub">Excellent standing</div></div>
            <div className="card card-sm" style={{marginBottom:12}}><div className="metric-label">Favourite route</div><div style={{fontSize:14,fontWeight:700,marginTop:4}}>Nairobi → Nakuru</div><div style={{fontSize:11,color:'var(--gray-400)'}}>7 of 12 trips</div></div>
            <div className="card card-sm"><div className="metric-label">Total spent</div><div style={{fontSize:18,fontWeight:700,color:'var(--green)',marginTop:4}}>KES 14,200</div></div>
          </div>
        </div>
      </div>
    </div>
  );
}
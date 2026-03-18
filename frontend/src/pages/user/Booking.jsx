import { useNavigate } from 'react-router-dom';
import { Steps } from '../../components/UI';

export default function ConfirmBooking() {
  const navigate = useNavigate();
  return (
    <div>
      <div className="page-header"><div className="page-title">Confirm booking</div></div>
      <div className="page-body">
        <Steps steps={['Search','Results','Seat','Confirm','Pay']} current={3} />
        <div className="two-col">
          <div className="card">
            <div className="card-title">Booking form</div>
            <div className="form-group"><label className="form-label">Passenger name</label><input className="form-input" defaultValue="Jane Mwangi"/></div>
            <div className="form-group"><label className="form-label">ID number</label><input className="form-input" defaultValue="23456789"/></div>
            <div className="form-group"><label className="form-label">Seat number</label><input className="form-input" defaultValue="14B — Economy" readOnly/></div>
            <div className="form-group"><label className="form-label">Amount</label><input className="form-input" defaultValue="KES 850" readOnly/></div>
            <div className="form-group"><label className="form-label">Travel date</label><input className="form-input" defaultValue="Wed 18 Mar 2026" readOnly/></div>
            <div className="form-group"><label className="form-label">M-Pesa phone number</label><input className="form-input" placeholder="07XX XXX XXX"/></div>
            <button className="btn btn-primary btn-full" onClick={() => navigate('/user/payment')}>Proceed to payment →</button>
          </div>
          <div>
            <div className="card" style={{marginBottom:14}}>
              <div style={{background:'var(--green)',borderRadius:10,padding:'14px 16px',marginBottom:14}}>
                <div style={{fontSize:22,fontWeight:800,color:'#fff',fontFamily:"'Syne',sans-serif"}}>Nairobi → Nakuru</div>
                <div style={{fontSize:12,color:'rgba(255,255,255,.8)',marginTop:3}}>Wed 18 Mar · 8:00 AM departure</div>
              </div>
              {[['SACCO','Modern Coast'],['Arrives','11:30 AM'],['Duration','3h 30m'],['Seat','14B · Economy']].map(([l,v])=>(
                <div key={l} style={{display:'flex',justifyContent:'space-between',fontSize:13,marginBottom:8}}>
                  <span style={{color:'var(--gray-400)'}}>{l}</span><span>{v}</span>
                </div>
              ))}
              <div className="sep"/>
              <div style={{display:'flex',justifyContent:'space-between'}}>
                <span style={{fontWeight:700}}>Total</span>
                <span style={{fontSize:18,fontWeight:800,color:'var(--green)'}}>KES 850</span>
              </div>
            </div>
            <div className="card card-sm">
              <div style={{fontSize:11,color:'var(--gray-400)',fontWeight:600,marginBottom:6,textTransform:'uppercase',letterSpacing:'.06em'}}>AI Fraud Check</div>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <span style={{color:'var(--green)',fontSize:18}}>✓</span>
                <div><div style={{fontSize:13,fontWeight:600}}>Passed — Trust score 94/100</div><div style={{fontSize:11,color:'var(--gray-400)'}}>ID verified · No duplicates detected</div></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
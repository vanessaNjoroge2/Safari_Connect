import { useNavigate } from 'react-router-dom';
import { Steps } from '../../components/UI';

export default function Payment() {
  const navigate = useNavigate();
  return (
    <div>
      <div className="page-header"><div className="page-title">M-Pesa Payment</div></div>
      <div className="page-body">
        <Steps steps={['Search','Results','Seat','Confirm','Pay']} current={4} />
        <div style={{maxWidth:460}}>
          <div className="card" style={{textAlign:'center'}}>
            <div style={{fontSize:56,marginBottom:14}} className="pulse">📱</div>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:32,fontWeight:800,marginBottom:6}}>KES 850</div>
            <div style={{fontSize:13,color:'var(--gray-400)',marginBottom:20}}>STK push sent to <strong>0712 345 678</strong></div>
            <div style={{background:'var(--amber-light)',borderRadius:10,padding:14,marginBottom:20,border:'1px solid #fcd34d'}}>
              <div style={{fontSize:13,color:'#92400e',fontWeight:700}}>Waiting for M-Pesa PIN confirmation…</div>
              <div style={{fontSize:12,color:'#92400e',marginTop:4}}>Enter your M-Pesa PIN on your phone. This expires in 5 minutes.</div>
            </div>
            <div style={{display:'flex',gap:8}}>
              <button className="btn" style={{flex:1,justifyContent:'center'}}>Resend push</button>
              <button className="btn btn-primary" style={{flex:1,justifyContent:'center'}} onClick={() => navigate('/user/ticket')}>Simulate success ✓</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
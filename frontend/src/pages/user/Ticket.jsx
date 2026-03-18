import { useNavigate } from 'react-router-dom';
import { AiBanner, Badge } from '../../components/UI';

export default function Ticket() {
  const navigate = useNavigate();
  return (
    <div>
      <div className="page-header">
        <div className="page-title">🎉 Booking confirmed!</div>
        <div className="page-actions"><button className="btn btn-sm" onClick={() => window.print()}>Print ticket</button></div>
      </div>
      <div className="page-body">
        <AiBanner text="<strong>Booking confirmed!</strong> Seat 14B is reserved. AI predicts your bus departs on time. Arrive at the stage by 7:40 AM. Have a safe journey!" />
        <div className="ticket">
          <div className="ticket-top">
            <div className="ticket-brand">SafiriConnect</div>
            <div className="ticket-route">Nairobi → Nakuru</div>
            <div className="ticket-ref">Booking ref: SC-2026-00892</div>
          </div>
          <div className="ticket-body">
            {[['Passenger','Jane Mwangi'],['ID number','23456789'],['SACCO','Modern Coast'],['Date','Wed 18 Mar 2026'],['Departure','8:00 AM'],['Arrives','11:30 AM (est.)'],['Seat','14B · Economy'],['Amount paid','KES 850'],['Status',null]].map(([l,v])=>(
              <div key={l} className="ticket-row">
                <label>{l}</label>
                {l==='Status'?<Badge variant="green">✓ Confirmed</Badge>:
                 l==='Amount paid'?<strong style={{color:'var(--green)'}}>{v}</strong>:
                 <span>{v}</span>}
              </div>
            ))}
          </div>
          <div className="ticket-qr">
            <div style={{fontSize:40,fontFamily:'monospace',letterSpacing:-2,color:'var(--gray-700)'}}>▉▊▉▊▉▊▉</div>
            <div style={{fontSize:11,color:'var(--gray-400)',marginTop:4}}>SC-2026-00892 · Show at boarding gate</div>
          </div>
        </div>
        <div style={{marginTop:20,display:'flex',gap:10}}>
          <button className="btn" onClick={() => navigate('/user/mybookings')}>View all bookings</button>
          <button className="btn btn-primary" onClick={() => navigate('/user')}>Book another trip</button>
        </div>
      </div>
    </div>
  );
}
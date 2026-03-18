import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Steps, SeatMap, Modal } from '../../components/UI';

const CLASSES = [
  {id:'economy', label:'Economy', price:'KES 850', sub:'Standard seating · Rows 4–10', priceColor:'var(--green)'},
  {id:'business', label:'Business', price:'KES 1,200', sub:'Extra legroom · Priority boarding · Rows 2–3', priceColor:'var(--blue)'},
  {id:'vip', label:'VIP', price:'KES 1,800', sub:'Reclining · Snacks included · Row 1', priceColor:'var(--purple)'},
];

export default function SeatSelection() {
  const navigate = useNavigate();
  const [selectedClass, setSelectedClass] = useState('economy');
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [paxOpen, setPaxOpen] = useState(false);
  const [ready, setReady] = useState(false);

  const cls = CLASSES.find(c => c.id === selectedClass);

  return (
    <div>
      <div className="page-header">
        <div><div className="page-title">Select your seat</div><div className="page-sub">Modern Coast · Nairobi → Nakuru · 8:00 AM</div></div>
      </div>
      <div className="page-body">
        <Steps steps={['Search','Results','Seat','Details','Pay']} current={2} />
        <div className="two-col">
          <div>
            <div className="card" style={{marginBottom:14}}>
              <div className="card-title">Seat classes</div>
              {CLASSES.map(c => (
                <div key={c.id} className={`seat-class-opt${selectedClass===c.id?' active':''}`} onClick={() => setSelectedClass(c.id)}>
                  <div style={{display:'flex',justifyContent:'space-between'}}>
                    <span style={{fontSize:13,fontWeight:700}}>{c.label}</span>
                    <span style={{fontSize:14,fontWeight:800,color:c.priceColor}}>{c.price}</span>
                  </div>
                  <div style={{fontSize:11,color:'var(--gray-500)',marginTop:2}}>{c.sub}</div>
                </div>
              ))}
            </div>
            <div className="card">
              <div className="card-title">Booking summary</div>
              <div style={{fontSize:13,display:'flex',flexDirection:'column',gap:8}}>
                {[['Route','Nairobi → Nakuru'],['Date','Wed 18 Mar 2026'],['Departs','8:00 AM'],['Seat',selectedSeat||'Click a seat']].map(([l,v])=>(
                  <div key={l} style={{display:'flex',justifyContent:'space-between'}}>
                    <span style={{color:'var(--gray-400)'}}>{l}</span>
                    <span style={{fontWeight:600,color:l==='Seat'&&selectedSeat?'var(--green)':undefined}}>{v}</span>
                  </div>
                ))}
                <div className="sep"/>
                <div style={{display:'flex',justifyContent:'space-between'}}>
                  <span style={{fontWeight:700}}>Fare</span>
                  <span style={{fontSize:16,fontWeight:800,color:'var(--green)'}}>{cls.price}</span>
                </div>
              </div>
              <button className="btn btn-primary btn-full" style={{marginTop:14,opacity:ready?1:.5,pointerEvents:ready?'auto':'none'}} onClick={()=>navigate('/user/booking')}>Continue to details →</button>
            </div>
          </div>
          <div className="card">
            <div className="card-title">Bus seat map — KBZ 123A</div>
            <SeatMap onSelect={(label)=>{ if(label){setSelectedSeat('Seat '+label);setPaxOpen(true);} }} />
          </div>
        </div>
      </div>
      <Modal open={paxOpen} onClose={()=>setPaxOpen(false)} title={`Passenger details — ${selectedSeat||''}`}>
        <div className="form-row">
          <div className="form-group"><label className="form-label">First name</label><input className="form-input" placeholder="Jane"/></div>
          <div className="form-group"><label className="form-label">Last name</label><input className="form-input" placeholder="Mwangi"/></div>
        </div>
        <div className="form-group"><label className="form-label">ID / Passport number</label><input className="form-input" placeholder="National ID"/></div>
        <div className="form-group"><label className="form-label">Residence</label><input className="form-input" placeholder="City / Town"/></div>
        <div className="form-group"><label className="form-label">Email address</label><input className="form-input" placeholder="email@example.com"/></div>
        <button className="btn btn-primary btn-full" onClick={()=>{ setPaxOpen(false); setReady(true); }}>Save & reserve seat</button>
      </Modal>
    </div>
  );
}
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AiBanner, Modal } from '../../components/UI';

export default function UserHome() {
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [tripType, setTripType] = useState('one');
  const [activecat, setActiveCat] = useState('bus');

  const cats = [
    {id:'bus', icon:'🚌', name:'Buses', desc:'Long distance · Comfortable'},
    {id:'matatu', icon:'🚐', name:'Matatu', desc:'City & town routes'},
    {id:'motorbike', icon:'🏍️', name:'Motorbikes', desc:'Fast · Last mile'},
    {id:'carrier', icon:'🚛', name:'Carrier Services', desc:'Goods & parcels'},
  ];

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Find your trip</div>
        <div className="page-actions">
          <button className="btn btn-sm" onClick={() => navigate('/user/mybookings')}>My bookings</button>
        </div>
      </div>
      <div className="page-body">
        <AiBanner
          text="<strong>Good morning, Jane!</strong> Based on your history, Nairobi → Nakuru is your top route. Next departure in 42 minutes — 14 seats left."
          action={<button className="btn btn-primary btn-sm" onClick={() => navigate('/user/results')}>Quick book →</button>}
        />
        <div style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800,marginBottom:4}}>What are you travelling in?</div>
        <div style={{fontSize:13,color:'var(--gray-400)',marginBottom:4}}>Choose a category to search available trips</div>
        <div className="cat-grid">
          {cats.map(c => (
            <div key={c.id} className={`cat-card${activecat===c.id?' active':''}`} onClick={() => { setActiveCat(c.id); setSearchOpen(true); }}>
              <div className="cat-icon">{c.icon}</div>
              <div className="cat-name">{c.name}</div>
              <div className="cat-desc">{c.desc}</div>
            </div>
          ))}
        </div>
        <div style={{fontFamily:"'Syne',sans-serif",fontSize:15,fontWeight:700,color:'var(--gray-700)',marginBottom:12}}>Popular routes today</div>
        <div className="three-col" style={{marginBottom:24}}>
          {[['Nairobi → Nakuru','From KES 850 · 4 trips'],['Nairobi → Mombasa','From KES 1,500 · 2 trips'],['Nairobi → Kisumu','From KES 1,100 · 3 trips']].map(([r,s]) => (
            <div key={r} className="card card-sm" style={{cursor:'pointer'}} onClick={() => navigate('/user/results')}>
              <div style={{fontWeight:700,fontSize:14}}>{r}</div>
              <div style={{fontSize:11,color:'var(--green)',marginTop:3}}>{s}</div>
            </div>
          ))}
        </div>
      </div>
      <Modal open={searchOpen} onClose={() => setSearchOpen(false)} title="🔍 Search trips">
        <div className="form-row">
          <div className="form-group"><label className="form-label">From</label><input className="form-input" defaultValue="Nairobi CBD"/></div>
          <div className="form-group"><label className="form-label">To</label><input className="form-input" placeholder="Destination"/></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Travel date</label><input className="form-input" type="date"/></div>
          <div className="form-group"><label className="form-label">Travel time</label><input className="form-input" type="time" defaultValue="08:00"/></div>
        </div>
        <div className="form-group">
          <label className="form-label">Trip type</label>
          <div style={{display:'flex',gap:8}}>
            <button className={`btn btn-sm${tripType==='one'?' btn-primary':''}`} onClick={() => setTripType('one')}>One-way</button>
            <button className={`btn btn-sm${tripType==='two'?' btn-primary':''}`} onClick={() => setTripType('two')}>Two-way</button>
          </div>
        </div>
        {tripType==='two' && (
          <div className="form-row">
            <div className="form-group"><label className="form-label">Return date</label><input className="form-input" type="date"/></div>
            <div className="form-group"><label className="form-label">Return time</label><input className="form-input" type="time" defaultValue="14:00"/></div>
          </div>
        )}
        <div style={{display:'flex',gap:8,marginTop:8}}>
          <button className="btn" style={{flex:1,justifyContent:'center'}} onClick={() => setSearchOpen(false)}>Cancel</button>
          <button className="btn btn-primary" style={{flex:2,justifyContent:'center'}} onClick={() => { setSearchOpen(false); navigate('/user/results'); }}>Search trips →</button>
        </div>
      </Modal>
    </div>
  );
}
import { useNavigate } from 'react-router-dom';
import { AiBanner, Badge } from '../../components/UI';

const buses = [
  { sacco:'Modern Coast Sacco', plate:'KBZ 123A · 50 seats · ⭐ 4.8', price:'KES 1,050', priceLabel:'AI dynamic price', dep:'8:00 AM', arr:'11:30 AM', dur:'3h 30m', seats:18, classes:['Economy','Business','VIP'], left:'green' },
  { sacco:'Easy Coach Sacco', plate:'KCA 456B · 50 seats · ⭐ 4.6', price:'KES 850', priceLabel:'Standard fare', dep:'10:00 AM', arr:'1:30 PM', dur:'3h 30m', seats:4, classes:['Economy','Business'], left:'amber' },
  { sacco:'Eldoret Express', plate:'KDB 789C · 33 seats · ⭐ 4.3', price:'KES 780', priceLabel:'Budget fare', dep:'2:00 PM', arr:'5:45 PM', dur:'3h 45m', seats:27, classes:['Economy'], left:'green', dim:true },
];

export default function Results() {
  const navigate = useNavigate();
  return (
    <div>
      <div className="page-header">
        <div><div className="page-title">Nairobi → Nakuru</div><div className="page-sub">Wed 18 Mar · Buses · 3 results</div></div>
        <div className="page-actions"><button className="btn btn-sm" onClick={() => navigate('/user')}>Change search</button></div>
      </div>
      <div className="page-body">
        <AiBanner text="<strong>High demand detected.</strong> Fares dynamically priced up 24% today — 89% of seats already filled. Book now to secure your seat." />
        {buses.map((b,i) => (
          <div key={i} className="bus-card" style={b.dim?{opacity:.75}:{}}>
            <div className="bus-header">
              <div><div className="sacco-name">{b.sacco}</div><div style={{fontSize:11,color:'var(--gray-400)',marginTop:2}}>{b.plate}</div></div>
              <div style={{textAlign:'right'}}><div className="bus-price">{b.price}</div><div className="bus-price-label">{b.priceLabel}</div></div>
            </div>
            <div className="bus-timing">
              <div className="time-block"><div className="time-val">{b.dep}</div><div className="time-label">Departs</div></div>
              <div className="time-arrow" style={{flex:1,textAlign:'center',color:'var(--gray-300)',fontSize:18}}>——→</div>
              <div className="duration-pill">{b.dur}</div>
              <div className="time-arrow" style={{flex:1,textAlign:'center',color:'var(--gray-300)',fontSize:18}}>——→</div>
              <div className="time-block"><div className="time-val">{b.arr}</div><div className="time-label">Arrives</div></div>
            </div>
            <div className="bus-footer">
              <Badge variant={b.left}>{b.seats} seats left</Badge>
              {b.classes.map(c => <Badge key={c} variant="blue">{c}</Badge>)}
              <button className={`btn${i===0?' btn-primary':''}`} style={{marginLeft:'auto'}} onClick={() => navigate('/user/seat')}>Select bus →</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
import { Badge } from '../../components/UI';
const CUSTOMERS = [
  {initials:'JM',name:'Jane Mwangi',phone:'0712 345 678',trips:12,route:'NBI → Nakuru',spent:'KES 14,200',trust:'green',score:'94/100'},
  {initials:'DO',name:'David Ochieng',phone:'0722 111 222',trips:7,route:'NBI → Mombasa',spent:'KES 9,800',trust:'green',score:'88/100'},
  {initials:'FH',name:'Fatuma Hassan',phone:'0733 444 555',trips:18,route:'NBI → Mombasa',spent:'KES 32,400',trust:'green',score:'97/100'},
  {initials:'SK',name:'Samuel Kibet',phone:'0744 666 777',trips:2,route:'NBI → Eldoret',spent:'KES 1,800',trust:'amber',score:'71/100',bg:'var(--amber-light)',color:'#92400e'},
];
export default function Customers() {
  return (
    <div>
      <div className="page-header"><div className="page-title">Customers</div><div className="page-actions"><input className="form-input" placeholder="Search..." style={{width:220,padding:'6px 10px',fontSize:12}}/></div></div>
      <div className="page-body">
        <div className="table-wrap">
          <table className="sc-table">
            <thead><tr><th>Passenger</th><th>Phone</th><th>Trips</th><th>Fav route</th><th>Total spent</th><th>AI trust</th><th></th></tr></thead>
            <tbody>{CUSTOMERS.map(c=>(
              <tr key={c.name}>
                <td><div style={{display:'flex',alignItems:'center',gap:8}}><div className="avatar" style={c.bg?{background:c.bg,color:c.color}:{}}>{c.initials}</div><span className="primary">{c.name}</span></div></td>
                <td>{c.phone}</td><td>{c.trips}</td><td>{c.route}</td><td>{c.spent}</td>
                <td><Badge variant={c.trust}>{c.score}</Badge></td>
                <td><button className="btn btn-sm">History</button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
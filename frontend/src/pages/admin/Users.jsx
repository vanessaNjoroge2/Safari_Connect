import { Badge, showToast } from '../../components/UI';
const USERS = [
  {i:'JM',name:'Jane Mwangi',phone:'0712 345 678',trips:12,spent:'KES 14,200',trust:'green',score:'94/100',status:'green',statusL:'Active',bg:null},
  {i:'DO',name:'David Ochieng',phone:'0722 111 222',trips:7,spent:'KES 9,800',trust:'green',score:'88/100',status:'green',statusL:'Active',bg:null},
  {i:'FH',name:'Fatuma Hassan',phone:'0733 444 555',trips:18,spent:'KES 32,400',trust:'green',score:'97/100',status:'green',statusL:'Active',bg:null},
  {i:'GW',name:'Grace Wanjiru',phone:'0755 888 999',trips:1,spent:'KES 0',trust:'red',score:'21/100',status:'red',statusL:'Flagged',bg:'var(--red-light)',c:'#991b1b'},
  {i:'SK',name:'Samuel Kibet',phone:'0744 666 777',trips:2,spent:'KES 1,800',trust:'amber',score:'71/100',status:'amber',statusL:'Watch',bg:'var(--amber-light)',c:'#92400e'},
];
export default function Users() {
  return (
    <div>
      <div className="page-header"><div className="page-title">User management</div><div className="page-actions"><input className="form-input" placeholder="Search users..." style={{width:220,padding:'6px 10px',fontSize:12}}/></div></div>
      <div className="page-body">
        <div className="table-wrap">
          <table className="sc-table">
            <thead><tr><th>User</th><th>Phone</th><th>Trips</th><th>Total spent</th><th>AI trust</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>{USERS.map(u=>(
              <tr key={u.name}>
                <td><div style={{display:'flex',alignItems:'center',gap:8}}><div className="avatar" style={u.bg?{background:u.bg,color:u.c}:{}}>{u.i}</div><span className="primary">{u.name}</span></div></td>
                <td>{u.phone}</td><td>{u.trips}</td><td>{u.spent}</td>
                <td><Badge variant={u.trust}>{u.score}</Badge></td>
                <td><Badge variant={u.status}>{u.statusL}</Badge></td>
                <td><div className="td-actions">
                  <button className="btn btn-sm">View</button>
                  {u.status==='red'&&<button className="btn btn-sm btn-outline-danger" onClick={()=>showToast('User suspended','error')}>Suspend</button>}
                </div></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
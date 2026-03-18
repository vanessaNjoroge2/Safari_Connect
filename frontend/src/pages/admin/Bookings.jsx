import { Metric, Badge, showToast } from '../../components/UI';
const BOOKINGS = [
  {id:'SC-0892',pax:'Jane Mwangi',sacco:'Modern Coast',route:'NBI→Nakuru',amt:'KES 850',comm:'KES 43',status:'green',l:'Confirmed'},
  {id:'SC-0891',pax:'David Ochieng',sacco:'Modern Coast',route:'NBI→Nakuru',amt:'KES 850',comm:'KES 43',status:'green',l:'Confirmed'},
  {id:'SC-0890',pax:'Fatuma Hassan',sacco:'Easy Coach',route:'NBI→Mombasa',amt:'KES 2,200',comm:'KES 110',status:'green',l:'Confirmed'},
  {id:'SC-0889',pax:'Samuel Kibet',sacco:'Modern Coast',route:'NBI→Eldoret',amt:'KES 900',comm:'—',status:'amber',l:'Pending pay'},
  {id:'SC-0888',pax:'Grace Wanjiru',sacco:'Modern Coast',route:'NBI→Kisumu',amt:'KES 1,100',comm:'—',status:'red',l:'AI Fraud Hold'},
];
export default function AdminBookings() {
  return (
    <div>
      <div className="page-header"><div><div className="page-title">Booking oversight</div><div className="page-sub">Platform-wide · All SACCOs</div></div></div>
      <div className="page-body">
        <div className="metric-grid metric-grid-3" style={{marginBottom:20}}>
          <Metric label="Total bookings today" value="1,240"/>
          <Metric label="AI fraud holds" value="3" sub="Auto-held" neg/>
          <Metric label="Doubles prevented" value="2" sub="AI blocked"/>
        </div>
        <div className="table-wrap">
          <table className="sc-table">
            <thead><tr><th>Booking ID</th><th>Passenger</th><th>SACCO</th><th>Route</th><th>Amount</th><th>Commission</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>{BOOKINGS.map(b=>(
              <tr key={b.id}>
                <td className="primary">{b.id}</td><td>{b.pax}</td><td>{b.sacco}</td><td>{b.route}</td><td>{b.amt}</td><td>{b.comm}</td>
                <td><Badge variant={b.status}>{b.l}</Badge></td>
                <td><div className="td-actions">
                  <button className="btn btn-sm">View</button>
                  {b.status==='red'&&<><button className="btn btn-sm" onClick={()=>showToast('Sent to investigation')}>Investigate</button><button className="btn btn-primary btn-sm" onClick={()=>showToast('Booking released!')}>Release</button></>}
                </div></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
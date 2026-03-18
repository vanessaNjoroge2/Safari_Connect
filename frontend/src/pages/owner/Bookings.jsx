import { Badge, Metric, showToast } from '../../components/UI';
const BOOKINGS = [
  {id:'SC-0892',name:'Jane Mwangi',route:'NBI→Nakuru',bus:'KBZ 123A',seat:'14B Economy',date:'18 Mar',pay:'green',payL:'Paid',status:'green',statusL:'Confirmed'},
  {id:'SC-0891',name:'David Ochieng',route:'NBI→Nakuru',bus:'KBZ 123A',seat:'22A Economy',date:'18 Mar',pay:'green',payL:'Paid',status:'green',statusL:'Confirmed'},
  {id:'SC-0890',name:'Fatuma Hassan',route:'NBI→Mombasa',bus:'KCA 456B',seat:'5A VIP',date:'19 Mar',pay:'green',payL:'Paid',status:'green',statusL:'Confirmed'},
  {id:'SC-0889',name:'Samuel Kibet',route:'NBI→Eldoret',bus:'KDB 789C',seat:'9C Economy',date:'18 Mar',pay:'amber',payL:'Pending',status:'amber',statusL:'Awaiting'},
  {id:'SC-0888',name:'Grace Wanjiru',route:'NBI→Kisumu',bus:'KDB 789C',seat:'3B Business',date:'18 Mar',pay:'red',payL:'Flagged',status:'red',statusL:'AI Hold'},
];
export default function OwnerBookings() {
  return (
    <div>
      <div className="page-header"><div className="page-title">Bookings management</div></div>
      <div className="page-body">
        <div className="metric-grid metric-grid-3"><Metric label="Total bookings" value="87" sub="Today"/><Metric label="Confirmed & paid" value="82" sub="Successful"/><Metric label="Pending / Issues" value="5" sub="Review needed" neg/></div>
        <div className="table-wrap">
          <table className="sc-table">
            <thead><tr><th>ID</th><th>Passenger</th><th>Route</th><th>Bus</th><th>Seat</th><th>Date</th><th>Payment</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>{BOOKINGS.map(b=>(
              <tr key={b.id}>
                <td className="primary">{b.id}</td><td>{b.name}</td><td>{b.route}</td><td>{b.bus}</td><td>{b.seat}</td><td>{b.date}</td>
                <td><Badge variant={b.pay}>{b.payL}</Badge></td>
                <td><Badge variant={b.status}>{b.statusL}</Badge></td>
                <td><div className="td-actions">
                  <button className="btn btn-sm">Details</button>
                  {b.status==='green'&&<button className="btn btn-sm btn-primary" onClick={()=>showToast('Marked as boarded!')}>✓ Board</button>}
                  {b.status==='amber'&&<button className="btn btn-sm btn-outline-danger" onClick={()=>showToast('Booking cancelled','error')}>Cancel</button>}
                </div></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
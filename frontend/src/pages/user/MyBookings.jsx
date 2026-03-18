import { useNavigate } from 'react-router-dom';
import { Badge } from '../../components/UI';

const BOOKINGS = [
  {ref:'SC-2026-00892',route:'Nairobi → Nakuru',date:'18 Mar 2026',seat:'14B Economy',amt:'KES 850',status:'green',label:'Confirmed'},
  {ref:'SC-2026-00788',route:'Nairobi → Mombasa',date:'20 Mar 2026',seat:'5A VIP',amt:'KES 2,200',status:'amber',label:'Upcoming'},
  {ref:'SC-2026-00541',route:'Nairobi → Kisumu',date:'10 Mar 2026',seat:'22C Economy',amt:'KES 1,100',status:'gray',label:'Completed'},
  {ref:'SC-2026-00399',route:'Nairobi → Nakuru',date:'2 Mar 2026',seat:'8A Business',amt:'KES 1,200',status:'gray',label:'Completed'},
];

export default function MyBookings() {
  const navigate = useNavigate();
  return (
    <div>
      <div className="page-header">
        <div className="page-title">My bookings</div>
        <div className="page-actions"><button className="btn btn-primary btn-sm" onClick={()=>navigate('/user')}>+ New booking</button></div>
      </div>
      <div className="page-body">
        <div className="table-wrap">
          <table className="sc-table">
            <thead><tr><th>Booking ref</th><th>Route</th><th>Date</th><th>Seat</th><th>Amount</th><th>Status</th><th></th></tr></thead>
            <tbody>{BOOKINGS.map(b=>(
              <tr key={b.ref}>
                <td className="primary">{b.ref}</td><td>{b.route}</td><td>{b.date}</td><td>{b.seat}</td><td>{b.amt}</td>
                <td><Badge variant={b.status}>{b.label}</Badge></td>
                <td><button className="btn btn-sm" onClick={()=>navigate('/user/ticket')}>View</button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
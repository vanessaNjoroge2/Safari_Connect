import { useState } from 'react';
import { Modal, Badge, showToast } from '../../components/UI';

const ROUTES = [
  {from:'Nairobi',to:'Nakuru',dist:'156 km',dur:'3h 30m',fare:'KES 850',trips:4,status:'green'},
  {from:'Nairobi',to:'Mombasa',dist:'485 km',dur:'7h 00m',fare:'KES 1,500',trips:2,status:'green'},
  {from:'Nairobi',to:'Kisumu',dist:'350 km',dur:'5h 30m',fare:'KES 1,100',trips:3,status:'green'},
  {from:'Nairobi',to:'Eldoret',dist:'310 km',dur:'4h 30m',fare:'KES 900',trips:2,status:'amber'},
  {from:'Thika',to:'Nairobi',dist:'42 km',dur:'1h 00m',fare:'KES 200',trips:8,status:'green'},
];

export default function Routes() {
  const [addOpen, setAddOpen] = useState(false);
  return (
    <div>
      <div className="page-header">
        <div className="page-title">Routes</div>
        <div className="page-actions"><button className="btn btn-primary btn-sm" onClick={()=>setAddOpen(true)}>+ Add route</button></div>
      </div>
      <div className="page-body">
        <div className="table-wrap">
          <table className="sc-table">
            <thead><tr><th>Route</th><th>Distance</th><th>Duration</th><th>Standard fare</th><th>Trips/day</th><th>Status</th><th></th></tr></thead>
            <tbody>{ROUTES.map(r=>(
              <tr key={r.from+r.to}>
                <td className="primary">{r.from} → {r.to}</td><td>{r.dist}</td><td>{r.dur}</td><td>{r.fare}</td><td>{r.trips}</td>
                <td><Badge variant={r.status}>{r.status==='green'?'Active':'Review'}</Badge></td>
                <td><button className="btn btn-sm" onClick={()=>showToast('Route updated!')}>Edit</button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
      <Modal open={addOpen} onClose={()=>setAddOpen(false)} title="Add new route">
        <div className="form-row">
          <div className="form-group"><label className="form-label">From</label><input className="form-input" placeholder="e.g. Nairobi CBD"/></div>
          <div className="form-group"><label className="form-label">To</label><input className="form-input" placeholder="e.g. Mombasa"/></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Distance (km)</label><input className="form-input" type="number"/></div>
          <div className="form-group"><label className="form-label">Est. travel time</label><input className="form-input" placeholder="e.g. 7h 00m"/></div>
        </div>
        <div className="form-group"><label className="form-label">Standard fare (KES)</label><input className="form-input" type="number"/></div>
        <button className="btn btn-primary btn-full" onClick={()=>{setAddOpen(false);showToast('Route added!')}}>Save route</button>
      </Modal>
    </div>
  );
}
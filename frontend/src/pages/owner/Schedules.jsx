import { useState } from 'react';
import { AiBanner, Modal, Badge, showToast } from '../../components/UI';

const TRIPS = [
  {bus:'KBZ 123A',route:'NBI → Nakuru',date:'18 Mar',dep:'8:00 AM',arr:'11:30 AM',type:'One-way',fare:'KES 1,050',cls:'E·B·V',left:4,status:'green',sl:'On route'},
  {bus:'KCA 456B',route:'NBI → Nakuru',date:'18 Mar',dep:'2:00 PM',arr:'5:30 PM',type:'One-way',fare:'KES 850',cls:'E·B',left:22,status:'blue',sl:'Scheduled'},
  {bus:'KBZ 123A',route:'NBI → Mombasa',date:'19 Mar',dep:'6:00 AM',arr:'1:00 PM',type:'Return',fare:'KES 1,500',cls:'E·B·V',left:31,status:'blue',sl:'Scheduled'},
  {bus:'KDB 789C',route:'NBI → Kisumu',date:'18 Mar',dep:'9:00 AM',arr:'2:30 PM',type:'One-way',fare:'KES 1,100',cls:'E·B',left:8,status:'amber',sl:'Boarding'},
];

export default function Schedules() {
  const [addOpen, setAddOpen] = useState(false);
  return (
    <div>
      <div className="page-header">
        <div className="page-title">Schedules / Trips</div>
        <div className="page-actions"><button className="btn btn-primary btn-sm" onClick={()=>setAddOpen(true)}>+ Create trip</button></div>
      </div>
      <div className="page-body">
        <AiBanner text="<strong>AI Recommendation:</strong> Add a 5:30 PM Nairobi→Nakuru trip on Fridays. 340 passengers unserved last 4 weeks — projected KES 289,000/month." action={<button className="btn btn-primary btn-sm" onClick={()=>setAddOpen(true)}>Create trip</button>}/>
        <div className="table-wrap">
          <table className="sc-table">
            <thead><tr><th>Bus</th><th>Route</th><th>Date</th><th>Dep.</th><th>Arr.</th><th>Type</th><th>Fare</th><th>Classes</th><th>Left</th><th>Status</th><th></th></tr></thead>
            <tbody>{TRIPS.map(t=>(
              <tr key={t.bus+t.dep}>
                <td className="primary">{t.bus}</td><td>{t.route}</td><td>{t.date}</td><td>{t.dep}</td><td>{t.arr}</td>
                <td><Badge variant={t.type==='Return'?'purple':'gray'}>{t.type}</Badge></td>
                <td>{t.fare}</td><td><Badge variant="blue">{t.cls}</Badge></td><td>{t.left}</td>
                <td><Badge variant={t.status}>{t.sl}</Badge></td>
                <td><button className="btn btn-sm">View</button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
      <Modal open={addOpen} onClose={()=>setAddOpen(false)} title="Create new trip">
        <div className="form-row">
          <div className="form-group"><label className="form-label">Select bus</label><select className="form-input"><option>KBZ 123A — 50 seater</option><option>KCA 456B — 50 seater</option></select></div>
          <div className="form-group"><label className="form-label">Route</label><select className="form-input"><option>Nairobi → Nakuru</option><option>Nairobi → Mombasa</option><option>Nairobi → Kisumu</option></select></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Date</label><input className="form-input" type="date"/></div>
          <div className="form-group"><label className="form-label">Trip type</label><select className="form-input"><option>One-way</option><option>Return</option></select></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Departure</label><input className="form-input" type="time" defaultValue="08:00"/></div>
          <div className="form-group"><label className="form-label">Arrival</label><input className="form-input" type="time" defaultValue="11:30"/></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Fare (KES)</label><input className="form-input" type="number" defaultValue="850"/></div>
          <div className="form-group"><label className="form-label">Seat classes</label><select className="form-input"><option>Economy + Business + VIP</option><option>Economy + Business</option><option>Economy only</option></select></div>
        </div>
        <button className="btn btn-primary btn-full" onClick={()=>{setAddOpen(false);showToast('Trip created!')}}>Create trip</button>
      </Modal>
    </div>
  );
}
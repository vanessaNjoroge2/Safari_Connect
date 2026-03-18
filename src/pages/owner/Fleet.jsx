import { useState } from 'react';
import { Modal, showToast, Badge } from '../../components/UI';

const VEHICLES = [
  {icon:'🚌',name:'KBZ 123A — Modern Coach 50-seater',status:'green',label:'Active',detail:'Driver: Peter Kamau · Type: Long haul',seats:'Economy: 30 · Business: 15 · VIP: 5',ai:'On Nakuru route — 92% full · 3 no-shows predicted'},
  {icon:'🚌',name:'KCA 456B — Standard Coach 50-seater',status:'amber',label:'Idle',detail:'Driver: John Njoroge · Nairobi base',seats:'Economy: 40 · Business: 10',ai:'Deploy on Nakuru route Friday — 96% demand predicted. Revenue: KES 42,500'},
  {icon:'🚐',name:'KDB 789C — Matatu 14-seater',status:'green',label:'Active',detail:'Driver: Samuel Omondi · City routes',seats:'Standard: 14 seats'},
  {icon:'🏍️',name:'KDC 012D — Motorbike (Boda)',status:'green',label:'Active',detail:'Rider: Grace Wanjiku · Last-mile'},
];

export default function Fleet() {
  const [addOpen, setAddOpen] = useState(false);
  return (
    <div>
      <div className="page-header">
        <div className="page-title">Fleet / Vehicles</div>
        <div className="page-actions"><button className="btn btn-primary btn-sm" onClick={()=>setAddOpen(true)}>+ Add vehicle</button></div>
      </div>
      <div className="page-body">
        {VEHICLES.map(v=>(
          <div key={v.name} className="vehicle-card">
            <div className="v-icon">{v.icon}</div>
            <div style={{flex:1}}>
              <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap',marginBottom:3}}>
                <div className="v-name">{v.name}</div><Badge variant={v.status}>{v.label}</Badge>
              </div>
              <div className="v-detail">{v.detail}</div>
              {v.seats && <div className="v-detail">{v.seats}</div>}
              {v.ai && <div className="v-ai">🤖 AI: {v.ai}</div>}
            </div>
            <button className="btn btn-sm" onClick={()=>showToast('Vehicle updated!')}>Edit</button>
          </div>
        ))}
      </div>
      <Modal open={addOpen} onClose={()=>setAddOpen(false)} title="Add new vehicle">
        <div className="form-group"><label className="form-label">Bus name / code</label><input className="form-input" placeholder="e.g. Modern Coach 01"/></div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Number plate</label><input className="form-input" placeholder="KBZ 123A"/></div>
          <div className="form-group"><label className="form-label">Vehicle type</label><select className="form-input"><option>Bus (Long haul)</option><option>Matatu</option><option>Motorbike</option><option>Carrier truck</option></select></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Seat capacity</label><input className="form-input" type="number" placeholder="50"/></div>
          <div className="form-group"><label className="form-label">Status</label><select className="form-input"><option>Active</option><option>Inactive</option><option>Maintenance</option></select></div>
        </div>
        <div className="form-row-3">
          <div className="form-group"><label className="form-label">Economy</label><input className="form-input" type="number" placeholder="30"/></div>
          <div className="form-group"><label className="form-label">Business</label><input className="form-input" type="number" placeholder="15"/></div>
          <div className="form-group"><label className="form-label">VIP</label><input className="form-input" type="number" placeholder="5"/></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Driver name</label><input className="form-input" placeholder="Full name"/></div>
          <div className="form-group"><label className="form-label">Conductor</label><input className="form-input" placeholder="Full name"/></div>
        </div>
        <button className="btn btn-primary btn-full" onClick={()=>{setAddOpen(false);showToast('Vehicle added!')}}>Save vehicle</button>
      </Modal>
    </div>
  );
}
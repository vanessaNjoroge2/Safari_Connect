import { showToast } from '../../components/UI';
const CATS = [
  {icon:'🚌',name:'Buses',desc:'Long distance',info:'22 SACCOs · 1,240 routes',active:true},
  {icon:'🚐',name:'Matatu',desc:'City & town routes',info:'8 operators · 340 routes'},
  {icon:'🏍️',name:'Motorbikes',desc:'Last mile boda boda',info:'12 operators · City zones'},
  {icon:'🚛',name:'Carrier Services',desc:'Goods & parcels',info:'4 operators · National'},
];
export default function Categories() {
  return (
    <div>
      <div className="page-header"><div className="page-title">Category management</div><div className="page-actions"><button className="btn btn-primary btn-sm" onClick={()=>showToast('Add category coming soon')}>+ Add category</button></div></div>
      <div className="page-body">
        <div className="cat-grid">
          {CATS.map(c=>(
            <div key={c.name} className={`cat-card${c.active?' active':''}`}>
              <div className="cat-icon">{c.icon}</div>
              <div className="cat-name">{c.name}</div>
              <div className="cat-desc">{c.desc}</div>
              <div style={{marginTop:10,fontSize:11,fontWeight:600,color:c.active?'var(--green-dark)':'var(--gray-500)'}}>{c.info}</div>
              <div style={{marginTop:10,display:'flex',gap:6,justifyContent:'center'}}>
                <button className="btn btn-sm" onClick={()=>showToast('Category updated!')}>Edit</button>
                <button className="btn btn-sm btn-outline-danger" onClick={()=>showToast('Deactivated','error')}>Deactivate</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
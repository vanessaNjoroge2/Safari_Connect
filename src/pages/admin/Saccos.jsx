import { Metric, Badge, showToast } from '../../components/UI';
const SACCOS = [
  {name:'Modern Coast',cat:'Bus',v:8,r:4,rev:'KES 1.2M',perf:'green',perfL:'Top',status:'green',statusL:'Active'},
  {name:'Easy Coach',cat:'Bus',v:12,r:6,rev:'KES 2.1M',perf:'green',perfL:'Top',status:'green',statusL:'Active'},
  {name:'Nairobi Matatus',cat:'Matatu',v:20,r:8,rev:'KES 880K',perf:'blue',perfL:'Good',status:'green',statusL:'Active'},
  {name:'Swift Carriers',cat:'Carrier',v:5,r:3,rev:'—',perf:null,status:'amber',statusL:'Pending'},
  {name:'Boda Express',cat:'Motorbike',v:30,r:'—',rev:'—',perf:null,status:'amber',statusL:'Pending'},
];
export default function Saccos() {
  return (
    <div>
      <div className="page-header"><div className="page-title">SACCO Management</div><div className="page-actions"><input className="form-input" placeholder="Search..." style={{width:200,padding:'6px 10px',fontSize:12}}/></div></div>
      <div className="page-body">
        <div className="metric-grid metric-grid-3" style={{marginBottom:20}}>
          <Metric label="Total SACCOs" value="36" sub="Active: 34"/>
          <Metric label="Pending approval" value="2" sub="Review needed" neg/>
          <Metric label="Top performer" value="Easy Coach" sub="KES 2.1M MTD"/>
        </div>
        <div className="table-wrap">
          <table className="sc-table">
            <thead><tr><th>SACCO</th><th>Category</th><th>Vehicles</th><th>Routes</th><th>Revenue (MTD)</th><th>Performance</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>{SACCOS.map(s=>(
              <tr key={s.name}>
                <td className="primary">{s.name}</td><td>{s.cat}</td><td>{s.v}</td><td>{s.r}</td><td>{s.rev}</td>
                <td>{s.perf?<Badge variant={s.perf}>{s.perfL}</Badge>:'—'}</td>
                <td><Badge variant={s.status}>{s.statusL}</Badge></td>
                <td><div className="td-actions">
                  {s.status==='green'&&<><button className="btn btn-sm">View</button><button className="btn btn-sm btn-outline-danger" onClick={()=>showToast('SACCO suspended','error')}>Suspend</button></>}
                  {s.status==='amber'&&<><button className="btn btn-primary btn-sm" onClick={()=>showToast('SACCO approved!')}>Approve</button><button className="btn btn-sm btn-outline-danger" onClick={()=>showToast('SACCO rejected','error')}>Reject</button></>}
                </div></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
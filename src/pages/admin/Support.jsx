import { Metric, Badge, showToast } from '../../components/UI';
const TICKETS = [
  {id:'#TKT-001',user:'Jane Mwangi',type:'Refund request',desc:'Bus departed 2h late',sacco:'Modern Coast',pri:'red',priL:'High',status:'amber',sl:'Open'},
  {id:'#TKT-002',user:'David Ochieng',type:'Double charge',desc:'Charged twice for booking',sacco:'Easy Coach',pri:'red',priL:'High',status:'amber',sl:'Open'},
  {id:'#TKT-003',user:'Fatuma Hassan',type:'Seat dispute',desc:'Seat given to another pax',sacco:'Modern Coast',pri:'amber',priL:'Medium',status:'amber',sl:'Open'},
  {id:'#TKT-004',user:'Samuel Kibet',type:'Payment failed',desc:'STK deducted, no ticket',sacco:'Easy Coach',pri:'red',priL:'High',status:'green',sl:'Resolved'},
];
export default function Support() {
  return (
    <div>
      <div className="page-header"><div className="page-title">Support / Disputes</div></div>
      <div className="page-body">
        <div className="metric-grid metric-grid-3" style={{marginBottom:20}}>
          <Metric label="Open tickets" value="3" sub="Needs action" neg/>
          <Metric label="Resolved this week" value="12" sub="Avg 4h resolution"/>
          <Metric label="Refunds issued" value="4" sub="KES 7,650 total"/>
        </div>
        <div className="table-wrap">
          <table className="sc-table">
            <thead><tr><th>Ticket</th><th>User</th><th>Type</th><th>Description</th><th>SACCO</th><th>Priority</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>{TICKETS.map(t=>(
              <tr key={t.id}>
                <td className="primary">{t.id}</td><td>{t.user}</td><td>{t.type}</td><td>{t.desc}</td><td>{t.sacco}</td>
                <td><Badge variant={t.pri}>{t.priL}</Badge></td>
                <td><Badge variant={t.status}>{t.sl}</Badge></td>
                <td><div className="td-actions">
                  {t.status==='amber'&&<><button className="btn btn-primary btn-sm" onClick={()=>showToast('Ticket resolved!')}>Resolve</button><button className="btn btn-sm" onClick={()=>showToast('Refund initiated!')}>Refund</button></>}
                  {t.status==='green'&&<button className="btn btn-sm">View</button>}
                </div></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
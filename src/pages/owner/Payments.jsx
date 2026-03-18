import { Metric, Badge, showToast } from '../../components/UI';
const PAYS = [
  {name:'Jane Mwangi',phone:'0712 345 678',amt:'KES 850',ref:'MPE234567890',booking:'SC-0892',time:'07:44 AM',status:'green',l:'Successful'},
  {name:'David Ochieng',phone:'0722 111 222',amt:'KES 850',ref:'MPE234567891',booking:'SC-0891',time:'07:51 AM',status:'green',l:'Successful'},
  {name:'Fatuma Hassan',phone:'0733 444 555',amt:'KES 2,200',ref:'MPE234567892',booking:'SC-0890',time:'05:30 AM',status:'green',l:'Successful'},
  {name:'Samuel Kibet',phone:'0744 666 777',amt:'KES 900',ref:'—',booking:'SC-0889',time:'08:12 AM',status:'amber',l:'STK Initiated'},
  {name:'Grace Wanjiru',phone:'0755 888 999',amt:'KES 1,100',ref:'—',booking:'SC-0888',time:'08:20 AM',status:'red',l:'Fraud hold'},
];
export default function OwnerPayments() {
  return (
    <div>
      <div className="page-header"><div className="page-title">Payments</div><div className="page-actions"><button className="btn btn-sm" onClick={()=>showToast('Report downloaded!')}>Export</button></div></div>
      <div className="page-body">
        <div className="metric-grid">
          <Metric label="STK successful" value="82" sub="Today"/>
          <Metric label="STK initiated" value="3" sub="Awaiting PIN" neg/>
          <Metric label="Failed" value="2" sub="Need follow-up" neg/>
          <Metric label="Refunded" value="1" sub="KES 850"/>
        </div>
        <div className="two-col" style={{marginBottom:16}}>
          <div className="card">
            <div className="card-title">Earnings summary</div>
            {[['This week','KES 318,400'],['This month','KES 1,240,000'],['Platform fee (5%)','- KES 62,000']].map(([l,v])=>(
              <div key={l} style={{display:'flex',justifyContent:'space-between',fontSize:13,marginBottom:8}}><span style={{color:'var(--gray-400)'}}>{l}</span><span style={{fontWeight:700,color:l.includes('fee')?'var(--red)':undefined}}>{v}</span></div>
            ))}
            <div className="sep"/>
            <div style={{display:'flex',justifyContent:'space-between'}}><span style={{fontWeight:700}}>Net payout</span><span style={{fontSize:18,fontWeight:800,color:'var(--green)'}}>KES 1,178,000</span></div>
          </div>
          <div className="card">
            <div className="card-title">Request withdrawal</div>
            <div className="form-group"><label className="form-label">Amount (KES)</label><input className="form-input" placeholder="50,000"/></div>
            <div className="form-group"><label className="form-label">Send to</label><select className="form-input"><option>M-Pesa</option><option>KCB Bank</option><option>Equity Bank</option></select></div>
            <button className="btn btn-primary" onClick={()=>showToast('Withdrawal submitted!')}>Request withdrawal</button>
          </div>
        </div>
        <div className="table-wrap">
          <table className="sc-table">
            <thead><tr><th>Passenger</th><th>Phone</th><th>Amount</th><th>Tx ref</th><th>Booking</th><th>Time</th><th>Status</th></tr></thead>
            <tbody>{PAYS.map(p=>(
              <tr key={p.ref+p.name}><td className="primary">{p.name}</td><td>{p.phone}</td><td>{p.amt}</td><td>{p.ref}</td><td>{p.booking}</td><td>{p.time}</td><td><Badge variant={p.status}>{p.l}</Badge></td></tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
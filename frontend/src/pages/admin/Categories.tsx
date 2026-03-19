import DashboardLayout from '../../components/DashboardLayout';
import { Badge } from '../../components/UI';

const CATEGORIES = [
  { id:'CAT-001', name:'Buses',            icon:'🚌', description:'Long-distance intercity coaches with AC and luggage space.', routes:28, vehicles:58, active:true,  bookings:'4,210', slug:'bus' },
  { id:'CAT-002', name:'Matatu',           icon:'🚐', description:'City and town routes — 14-seaters and minibuses.',           routes:42, vehicles:134,active:true,  bookings:'3,820', slug:'matatu' },
  { id:'CAT-003', name:'Motorbike (Boda)', icon:'🏍️', description:'Last-mile boda-boda rides for short distances.',            routes:0,  vehicles:89, active:true,  bookings:'1,640', slug:'boda' },
  { id:'CAT-004', name:'Package Delivery', icon:'📦', description:'Same-day and next-day parcel courier services.',             routes:12, vehicles:22, active:true,  bookings:'780',   slug:'package' },
  { id:'CAT-005', name:'Movers & Reloc.',  icon:'🚛', description:'Household and office relocation with lorries.',              routes:0,  vehicles:14, active:true,  bookings:'230',   slug:'movers' },
  { id:'CAT-006', name:'Document Courier', icon:'📄', description:'Secure and tracked legal/business document delivery.',       routes:0,  vehicles:8,  active:false, bookings:'90',    slug:'courier' },
];

export default function AdminCategories() {
  return (
    <DashboardLayout
      title="Category Management"
      subtitle="Transport and carrier service categories available on the platform"
      actions={<button className="btn btn-primary btn-sm">+ Add Category</button>}
    >
      <div className="grid-3" style={{ gap: 20 }}>
        {CATEGORIES.map(c => (
          <div key={c.id} className="card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ fontSize: 36 }}>{c.icon}</div>
              <Badge variant={c.active ? 'green' : 'gray'}>{c.active ? 'Active' : 'Disabled'}</Badge>
            </div>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{c.name}</div>
            <div style={{ fontSize: 12, color: 'var(--gray-500)', marginBottom: 16, lineHeight: 1.5 }}>{c.description}</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              {[
                { label: 'Routes',   val: c.routes   || '—' },
                { label: 'Vehicles', val: c.vehicles },
                { label: 'Bookings', val: c.bookings },
                { label: 'Slug',     val: `/${c.slug}` },
              ].map(s => (
                <div key={s.label} style={{ background: 'var(--gray-50)', borderRadius: 8, padding: '8px 12px' }}>
                  <div style={{ fontSize: 10, color: 'var(--gray-400)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em' }}>{s.label}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, marginTop: 2 }}>{s.val}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-sm btn-ghost" style={{ flex: 1 }}>Edit</button>
              <button className="btn btn-sm" style={{ flex: 1, color: c.active ? 'var(--danger)' : 'var(--brand)' }}>
                {c.active ? 'Disable' : 'Enable'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}

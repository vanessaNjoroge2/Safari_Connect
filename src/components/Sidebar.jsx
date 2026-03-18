import { NavLink } from 'react-router-dom';

const USER_NAV = [
  { section: 'Booking' },
  { to: '/user', label: 'Home', icon: '🏠', end: true },
  { to: '/user/results', label: 'Search trips', icon: '🔍' },
  { to: '/user/seat', label: 'Seat selection', icon: '💺' },
  { to: '/user/booking', label: 'Confirm booking', icon: '📋' },
  { to: '/user/payment', label: 'Payment', icon: '💳' },
  { to: '/user/ticket', label: 'My ticket', icon: '🎫' },
  { section: 'Account' },
  { to: '/user/mybookings', label: 'My bookings', icon: '📂' },
  { to: '/user/profile', label: 'Profile', icon: '👤' },
];

const OWNER_NAV = [
  { section: 'Operations' },
  { to: '/owner', label: 'Dashboard', icon: '📊', end: true },
  { to: '/owner/fleet', label: 'Fleet / Vehicles', icon: '🚌' },
  { to: '/owner/routes', label: 'Routes', icon: '🗺️' },
  { to: '/owner/schedules', label: 'Schedules / Trips', icon: '📅' },
  { to: '/owner/seats', label: 'Seat Layout & Pricing', icon: '💺' },
  { section: 'Finance' },
  { to: '/owner/bookings', label: 'Bookings', icon: '🎫' },
  { to: '/owner/payments', label: 'Payments', icon: '💰' },
  { section: 'Intelligence' },
  { to: '/owner/analytics', label: 'Analytics', icon: '📈' },
  { to: '/owner/customers', label: 'Customers', icon: '👥' },
  { to: '/owner/settings', label: 'Settings', icon: '⚙️' },
];

const ADMIN_NAV = [
  { section: 'Platform' },
  { to: '/admin', label: 'Dashboard', icon: '📊', end: true },
  { to: '/admin/categories', label: 'Categories', icon: '🏷️' },
  { to: '/admin/saccos', label: 'SACCO Management', icon: '🏢' },
  { to: '/admin/users', label: 'User Management', icon: '👥' },
  { section: 'Oversight' },
  { to: '/admin/bookings', label: 'Booking Oversight', icon: '🎫' },
  { to: '/admin/payments', label: 'Payments Overview', icon: '💰' },
  { to: '/admin/analytics', label: 'Reports & Analytics', icon: '📈' },
  { to: '/admin/support', label: 'Support / Disputes', icon: '🆘' },
  { to: '/admin/settings', label: 'Platform Settings', icon: '⚙️' },
];

const NAV_MAP = { user: USER_NAV, owner: OWNER_NAV, admin: ADMIN_NAV };

export default function Sidebar({ role }) {
  const items = NAV_MAP[role] || [];
  return (
    <nav className="sidebar">
      {items.map((item, i) =>
        item.section ? (
          <div className="sidebar-section" key={i}>{item.section}</div>
        ) : (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </NavLink>
        )
      )}
    </nav>
  );
}

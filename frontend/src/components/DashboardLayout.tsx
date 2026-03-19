import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';
import { FloatingChat } from './UI';
import type { UserRole } from '../types';

interface NavSection { section: string; }
interface NavLink_ { to: string; label: string; icon: string; end?: boolean; }
type NavItem = NavSection | NavLink_;

const USER_NAV: NavItem[] = [
  { section: 'Transport' },
  { to: '/passenger/home',       label: 'Home',             icon: '🏠', end: true },
  { to: '/passenger/search',     label: 'Search trips',     icon: '🔍' },
  { to: '/passenger/seat',       label: 'Seat selection',   icon: '💺' },
  { to: '/passenger/mybookings', label: 'My bookings',      icon: '📂' },
  { to: '/passenger/payments',   label: 'Payments',          icon: '💳' },
  { section: 'Other Services' },
  { to: '/carrier',              label: 'Carrier services', icon: '📦', end: true },
  { section: 'Account' },
  { to: '/passenger/profile',    label: 'My profile',       icon: '👤' },
];

const OWNER_NAV: NavItem[] = [
  { section: 'Operations' },
  { to: '/owner/dashboard',  label: 'Dashboard',             icon: '📊', end: true },
  { to: '/owner/fleet',      label: 'Fleet / Vehicles',      icon: '🚌' },
  { to: '/owner/routes',     label: 'Routes',                icon: '🗺️' },
  { to: '/owner/schedules',  label: 'Schedules',             icon: '📅' },
  { to: '/owner/seats',      label: 'Seat layout & pricing', icon: '💺' },
  { section: 'Finance' },
  { to: '/owner/bookings',   label: 'Bookings',              icon: '🎫' },
  { to: '/owner/payments',   label: 'Payments',              icon: '💰' },
  { section: 'Intelligence' },
  { to: '/owner/analytics',  label: 'Analytics',             icon: '📈' },
  { to: '/owner/customers',  label: 'Customers',             icon: '👥' },
  { section: 'Account' },
  { to: '/owner/settings',   label: 'Settings',              icon: '⚙️' },
];

const ADMIN_NAV: NavItem[] = [
  { section: 'Platform' },
  { to: '/admin/dashboard',  label: 'Dashboard',          icon: '📊', end: true },
  { to: '/admin/categories', label: 'Categories',         icon: '🏷️' },
  { to: '/admin/saccos',     label: 'SACCO management',   icon: '🏢' },
  { to: '/admin/users',      label: 'Users',              icon: '👥' },
  { section: 'Oversight' },
  { to: '/admin/bookings',   label: 'Bookings',           icon: '🎫' },
  { to: '/admin/payments',   label: 'Payments',           icon: '💰' },
  { to: '/admin/analytics',  label: 'Analytics',          icon: '📈' },
  { to: '/admin/support',    label: 'Support & disputes', icon: '🆘' },
  { section: 'System' },
  { to: '/admin/settings',   label: 'Platform settings',  icon: '⚙️' },
];

const NAV_MAP: Record<UserRole, NavItem[]> = {
  passenger: USER_NAV,
  owner:     OWNER_NAV,
  admin:     ADMIN_NAV,
};

const ROLE_LABELS: Record<UserRole, string> = {
  passenger: 'Passenger',
  owner:     'SACCO Owner',
  admin:     'Super Admin',
};

function isSection(item: NavItem): item is NavSection {
  return 'section' in item;
}

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export default function DashboardLayout({ children, title, subtitle, actions }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const items = user ? NAV_MAP[user.role] ?? USER_NAV : USER_NAV;

  // Build breadcrumb from pathname
  const segments = location.pathname.split('/').filter(Boolean);
  const breadcrumbs = segments.map((seg, i) => ({
    label: seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' '),
    path: '/' + segments.slice(0, i + 1).join('/'),
    isLast: i === segments.length - 1,
  }));

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="dash-root">
      {/* ── Sidebar ────────────────────────────────────── */}
      <aside className="dash-sidebar">
        {/* Brand */}
        <div className="sidebar-brand-block">
          <div className="sidebar-logo-mark">SC</div>
          <div>
            <div className="sidebar-brand">Safiri<em>Connect</em></div>
          </div>
        </div>

        {/* Role pill */}
        {user && (
          <div style={{ padding: '12px 20px 4px' }}>
            <span className="sidebar-role-pill">⬡ {ROLE_LABELS[user.role]}</span>
          </div>
        )}

        {/* Nav */}
        <nav style={{ flex: 1, paddingTop: 8 }}>
          {items.map((item, i) =>
            isSection(item) ? (
              <div key={i} className="sidebar-section">{item.section}</div>
            ) : (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              >
                <span className="nav-icon">{item.icon}</span>
                {item.label}
              </NavLink>
            )
          )}
        </nav>

        {/* User + logout */}
        <div className="sidebar-bottom">
          <div className="sidebar-user-row">
            <div className="sidebar-avatar">{user?.initials ?? '?'}</div>
            <div style={{ minWidth: 0 }}>
              <div className="sidebar-user-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
              <div className="sidebar-user-email" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
            </div>
          </div>
          <button
            className="btn btn-ghost btn-sm btn-full sidebar-signout-btn"
            style={{ color: 'rgba(255,255,255,.4)', justifyContent: 'flex-start', border: '1px solid rgba(255,255,255,.08)', marginTop: 4 }}
            onClick={handleLogout}
          >
            ↩ Sign out
          </button>
        </div>
      </aside>

      {/* ── Main area ──────────────────────────────────── */}
      <main className="dash-main">
        {/* Topbar */}
        <header className="dash-topbar">
          {/* Left: page title */}
          <div className="topbar-left">
            <div className="topbar-title">{title}</div>
            {subtitle && <div className="topbar-subtitle">{subtitle}</div>}
          </div>

          {/* Center: search */}
          <div className="topbar-search">
            <span className="topbar-search-icon">🔍</span>
            <input
              className="topbar-search-input"
              type="text"
              placeholder="Search anything…"
            />
          </div>

          {/* Right: actions + notifications + user */}
          <div className="topbar-actions">
            {actions}
            {actions && <div className="topbar-divider" />}

            <button className="topbar-icon-btn" title="Notifications">
              🔔
              <span className="topbar-notif-dot" />
            </button>

            <button className="topbar-icon-btn" title="Help">
              ❓
            </button>

            <div className="topbar-divider" />

            <div className="topbar-user" onClick={() => navigate(user?.role === 'passenger' ? '/passenger/profile' : `/${user?.role}/settings`)}>
              <div className="topbar-avatar">{user?.initials ?? '?'}</div>
              <div>
                <div className="topbar-user-name">{user?.name?.split(' ')[0]}</div>
                <div className="topbar-user-role">{user ? ROLE_LABELS[user.role] : ''}</div>
              </div>
            </div>
          </div>
        </header>

        {/* Floating AI Chat — passenger + owner + admin */}
        {(user?.role === 'passenger' || user?.role === 'owner' || user?.role === 'admin') && (
          <FloatingChat role={user.role} />
        )}

        {/* Body */}
        <div className="dash-body fade-in">
          <div className="dash-content">
            {/* Breadcrumb */}
            {breadcrumbs.length > 1 && (
              <nav className="breadcrumb">
                <span className="breadcrumb-item" style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>Home</span>
                {breadcrumbs.map((crumb) => (
                  <span key={crumb.path} style={{ display: 'contents' }}>
                    <span className="breadcrumb-sep">›</span>
                    <span
                      className={`breadcrumb-item${crumb.isLast ? ' active' : ''}`}
                      style={{ cursor: crumb.isLast ? 'default' : 'pointer' }}
                      onClick={() => !crumb.isLast && navigate(crumb.path)}
                    >
                      {crumb.label}
                    </span>
                  </span>
                ))}
              </nav>
            )}
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const ROLE_LABELS = { user: 'Passenger', owner: 'SACCO Owner', admin: 'Super Admin' };

export default function Topbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <div className="topbar">
      <div className="topbar-brand">Safiri<span>Connect</span></div>
      {user && <span className="topbar-role-badge">{ROLE_LABELS[user.role]}</span>}
      <div className="topbar-right">
        {user && (
          <>
            <div className="topbar-user">
              <div className="topbar-avatar">{user.initials}</div>
              <span>{user.name}</span>
            </div>
            <button className="topbar-logout" onClick={handleLogout}>Sign out</button>
          </>
        )}
      </div>
    </div>
  );
}

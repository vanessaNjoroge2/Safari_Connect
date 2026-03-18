import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import Topbar from './Topbar';
import Sidebar from './Sidebar';

export default function ProtectedLayout({ role, children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  if (user.role !== role) return <Navigate to="/" replace />;
  return (
    <>
      <Topbar />
      <div className="app-shell">
        <Sidebar role={role} />
        <main className="main-content">{children}</main>
      </div>
    </>
  );
}

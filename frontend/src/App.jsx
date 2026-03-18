import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedLayout from './components/ProtectedLayout';
import { Toast } from './components/UI';
import './styles/globals.css';

// Pages
import Login from './pages/Login';

// User
import UserHome from './pages/user/Home';
import Results from './pages/user/Results';
import SeatSelection from './pages/user/Seat';
import ConfirmBooking from './pages/user/Booking';
import Payment from './pages/user/Payment';
import Ticket from './pages/user/Ticket';
import MyBookings from './pages/user/MyBookings';
import Profile from './pages/user/Profile';

// Owner
import OwnerDashboard from './pages/owner/Dashboard';
import Fleet from './pages/owner/Fleet';
import Routes_ from './pages/owner/Routes';
import Schedules from './pages/owner/Schedules';
import SeatLayout from './pages/owner/Seats';
import OwnerBookings from './pages/owner/Bookings';
import OwnerPayments from './pages/owner/Payments';
import OwnerAnalytics from './pages/owner/Analytics';
import Customers from './pages/owner/Customers';
import OwnerSettings from './pages/owner/Settings';

// Admin
import AdminDashboard from './pages/admin/Dashboard';
import Categories from './pages/admin/Categories';
import Saccos from './pages/admin/Saccos';
import Users from './pages/admin/Users';
import AdminBookings from './pages/admin/Bookings';
import AdminPayments from './pages/admin/Payments';
import AdminAnalytics from './pages/admin/Analytics';
import Support from './pages/admin/Support';
import AdminSettings from './pages/admin/Settings';

function UserRoutes() {
  return (
    <ProtectedLayout role="user">
      <Routes>
        <Route index element={<UserHome />} />
        <Route path="results" element={<Results />} />
        <Route path="seat" element={<SeatSelection />} />
        <Route path="booking" element={<ConfirmBooking />} />
        <Route path="payment" element={<Payment />} />
        <Route path="ticket" element={<Ticket />} />
        <Route path="mybookings" element={<MyBookings />} />
        <Route path="profile" element={<Profile />} />
      </Routes>
    </ProtectedLayout>
  );
}

function OwnerRoutes() {
  return (
    <ProtectedLayout role="owner">
      <Routes>
        <Route index element={<OwnerDashboard />} />
        <Route path="fleet" element={<Fleet />} />
        <Route path="routes" element={<Routes_ />} />
        <Route path="schedules" element={<Schedules />} />
        <Route path="seats" element={<SeatLayout />} />
        <Route path="bookings" element={<OwnerBookings />} />
        <Route path="payments" element={<OwnerPayments />} />
        <Route path="analytics" element={<OwnerAnalytics />} />
        <Route path="customers" element={<Customers />} />
        <Route path="settings" element={<OwnerSettings />} />
      </Routes>
    </ProtectedLayout>
  );
}

function AdminRoutes() {
  return (
    <ProtectedLayout role="admin">
      <Routes>
        <Route index element={<AdminDashboard />} />
        <Route path="categories" element={<Categories />} />
        <Route path="saccos" element={<Saccos />} />
        <Route path="users" element={<Users />} />
        <Route path="bookings" element={<AdminBookings />} />
        <Route path="payments" element={<AdminPayments />} />
        <Route path="analytics" element={<AdminAnalytics />} />
        <Route path="support" element={<Support />} />
        <Route path="settings" element={<AdminSettings />} />
      </Routes>
    </ProtectedLayout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toast />
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/user/*" element={<UserRoutes />} />
          <Route path="/owner/*" element={<OwnerRoutes />} />
          <Route path="/admin/*" element={<AdminRoutes />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

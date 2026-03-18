import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedLayout from './components/ProtectedLayout';
import { Toast } from './components/UI';
import './styles/globals.css';

import Login from './pages/Login';
import UserHome from './pages/user/Home';
import Results from './pages/user/Results';
import SeatSelection from './pages/user/Seat';
import ConfirmBooking from './pages/user/Booking';
import Payment from './pages/user/Payment';
import Ticket from './pages/user/Ticket';
import MyBookings from './pages/user/MyBookings';
import Profile from './pages/user/Profile';
import UserPayments from './pages/user/Payments';

import CarrierHome from './pages/carrier/Home';
import PackageDelivery from './pages/carrier/Package';
import LiveTracking from './pages/carrier/Tracking';
import Movers from './pages/carrier/Movers';
import DocumentCourier from './pages/carrier/Courier';

import OwnerDashboard from './pages/owner/Dashboard';
import Fleet from './pages/owner/Fleet';
import OwnerRoutesPage from './pages/owner/Routes';
import Schedules from './pages/owner/Schedules';
import SeatLayout from './pages/owner/Seats';
import OwnerBookings from './pages/owner/Bookings';
import OwnerPayments from './pages/owner/Payments';
import OwnerAnalytics from './pages/owner/Analytics';
import Customers from './pages/owner/Customers';
import OwnerSettings from './pages/owner/Settings';

import AdminDashboard from './pages/admin/Dashboard';
import Categories from './pages/admin/Categories';
import Saccos from './pages/admin/Saccos';
import Users from './pages/admin/Users';
import AdminBookings from './pages/admin/Bookings';
import AdminPayments from './pages/admin/Payments';
import AdminAnalytics from './pages/admin/Analytics';
import Support from './pages/admin/Support';
import AdminSettings from './pages/admin/Settings';

function UserSection() {
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
        <Route path="payments" element={<UserPayments />} />
      </Routes>
    </ProtectedLayout>
  );
}

function CarrierSection() {
  return (
    <ProtectedLayout role="user">
      <Routes>
        <Route index element={<CarrierHome />} />
        <Route path="package" element={<PackageDelivery />} />
        <Route path="track/:id" element={<LiveTracking />} />
        <Route path="movers" element={<Movers />} />
        <Route path="courier" element={<DocumentCourier />} />
      </Routes>
    </ProtectedLayout>
  );
}

function OwnerSection() {
  return (
    <ProtectedLayout role="owner">
      <Routes>
        <Route index element={<OwnerDashboard />} />
        <Route path="fleet" element={<Fleet />} />
        <Route path="routes" element={<OwnerRoutesPage />} />
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

function AdminSection() {
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
          <Route path="/user/*" element={<UserSection />} />
          <Route path="/carrier/*" element={<CarrierSection />} />
          <Route path="/owner/*" element={<OwnerSection />} />
          <Route path="/admin/*" element={<AdminSection />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

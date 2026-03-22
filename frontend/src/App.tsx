import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { BookingProvider } from './context/BookingContext';
import { ToastProvider } from './hooks/useToast';
import RequireAuth from './components/RequireAuth';

// Public pages
import Welcome  from './pages/Welcome';
import Login    from './pages/auth/Login';
import Register from './pages/auth/Register';

// Passenger pages
import PassengerHome    from './pages/passenger/Home';
import Search           from './pages/passenger/Search';
import Results          from './pages/passenger/Results';
import Seat             from './pages/passenger/Seat';
import Confirm          from './pages/passenger/Confirm';
import Payment          from './pages/passenger/Payment';
import Ticket           from './pages/passenger/Ticket';
import MyBookings         from './pages/passenger/MyBookings';
import PassengerPayments  from './pages/passenger/Payments';
import Profile            from './pages/passenger/Profile';
import PassengerNotifications from './pages/passenger/Notifications';
import PassengerHelp from './pages/passenger/Help';

// Carrier pages
import CarrierHome  from './pages/carrier/Home';
import Package      from './pages/carrier/Package';
import Tracking     from './pages/carrier/Tracking';
import Movers       from './pages/carrier/Movers';
import Courier      from './pages/carrier/Courier';

// Owner pages
import OwnerDashboard from './pages/owner/Dashboard';
import OwnerFleet     from './pages/owner/Fleet';
import OwnerRoutes    from './pages/owner/Routes';
import OwnerSchedules from './pages/owner/Schedules';
import OwnerSeats     from './pages/owner/Seats';
import OwnerBookings  from './pages/owner/Bookings';
import OwnerPayments  from './pages/owner/Payments';
import OwnerAnalytics from './pages/owner/Analytics';
import OwnerCustomers from './pages/owner/Customers';
import OwnerSettings  from './pages/owner/Settings';
import OwnerNotifications from './pages/owner/Notifications';
import OwnerHelp from './pages/owner/Help';

// Admin pages
import AdminDashboard  from './pages/admin/Dashboard';
import AdminCategories from './pages/admin/Categories';
import AdminSaccos     from './pages/admin/Saccos';
import AdminUsers      from './pages/admin/Users';
import AdminBookings   from './pages/admin/Bookings';
import AdminPayments   from './pages/admin/Payments';
import AdminAnalytics  from './pages/admin/Analytics';
import AdminSupport    from './pages/admin/Support';
import AdminSettings   from './pages/admin/Settings';
import AdminNotifications from './pages/admin/Notifications';
import AdminHelp from './pages/admin/Help';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <BookingProvider>
          <ToastProvider>
            <Routes>
              {/* ── Public ──────────────────────────────────────────────── */}
              <Route path="/"              element={<Welcome />} />
              <Route path="/auth/login"    element={<Login />} />
              <Route path="/auth/register" element={<Register />} />

              {/* ── Passenger ───────────────────────────────────────────── */}
              <Route path="/passenger" element={<RequireAuth role="passenger"><PassengerHome /></RequireAuth>}>
              </Route>
              <Route path="/passenger/home"       element={<RequireAuth role="passenger"><PassengerHome /></RequireAuth>} />
              <Route path="/passenger/search"     element={<RequireAuth role="passenger"><Search /></RequireAuth>} />
              <Route path="/passenger/results"    element={<RequireAuth role="passenger"><Results /></RequireAuth>} />
              <Route path="/passenger/seat"       element={<RequireAuth role="passenger"><Seat /></RequireAuth>} />
              <Route path="/passenger/confirm"    element={<RequireAuth role="passenger"><Confirm /></RequireAuth>} />
              <Route path="/passenger/payment"    element={<RequireAuth role="passenger"><Payment /></RequireAuth>} />
              <Route path="/passenger/ticket"     element={<RequireAuth role="passenger"><Ticket /></RequireAuth>} />
              <Route path="/passenger/mybookings" element={<RequireAuth role="passenger"><MyBookings /></RequireAuth>} />
              <Route path="/passenger/payments"   element={<RequireAuth role="passenger"><PassengerPayments /></RequireAuth>} />
              <Route path="/passenger/profile"    element={<RequireAuth role="passenger"><Profile /></RequireAuth>} />
              <Route path="/passenger/notifications" element={<RequireAuth role="passenger"><PassengerNotifications /></RequireAuth>} />
              <Route path="/passenger/help" element={<RequireAuth role="passenger"><PassengerHelp /></RequireAuth>} />

              {/* ── Carrier (passenger access) ───────────────────────────── */}
              <Route path="/carrier"          element={<RequireAuth role="passenger"><CarrierHome /></RequireAuth>} />
              <Route path="/carrier/package"  element={<RequireAuth role="passenger"><Package /></RequireAuth>} />
              <Route path="/carrier/tracking" element={<RequireAuth role="passenger"><Tracking /></RequireAuth>} />
              <Route path="/carrier/movers"   element={<RequireAuth role="passenger"><Movers /></RequireAuth>} />
              <Route path="/carrier/courier"  element={<RequireAuth role="passenger"><Courier /></RequireAuth>} />

              {/* ── Owner ───────────────────────────────────────────────── */}
              <Route path="/owner/dashboard"  element={<RequireAuth role="owner"><OwnerDashboard /></RequireAuth>} />
              <Route path="/owner/fleet"      element={<RequireAuth role="owner"><OwnerFleet /></RequireAuth>} />
              <Route path="/owner/routes"     element={<RequireAuth role="owner"><OwnerRoutes /></RequireAuth>} />
              <Route path="/owner/schedules"  element={<RequireAuth role="owner"><OwnerSchedules /></RequireAuth>} />
              <Route path="/owner/seats"      element={<RequireAuth role="owner"><OwnerSeats /></RequireAuth>} />
              <Route path="/owner/bookings"   element={<RequireAuth role="owner"><OwnerBookings /></RequireAuth>} />
              <Route path="/owner/payments"   element={<RequireAuth role="owner"><OwnerPayments /></RequireAuth>} />
              <Route path="/owner/analytics"  element={<RequireAuth role="owner"><OwnerAnalytics /></RequireAuth>} />
              <Route path="/owner/customers"  element={<RequireAuth role="owner"><OwnerCustomers /></RequireAuth>} />
              <Route path="/owner/settings"   element={<RequireAuth role="owner"><OwnerSettings /></RequireAuth>} />
              <Route path="/owner/notifications" element={<RequireAuth role="owner"><OwnerNotifications /></RequireAuth>} />
              <Route path="/owner/help" element={<RequireAuth role="owner"><OwnerHelp /></RequireAuth>} />

              {/* ── Admin ───────────────────────────────────────────────── */}
              <Route path="/admin/dashboard"  element={<RequireAuth role="admin"><AdminDashboard /></RequireAuth>} />
              <Route path="/admin/categories" element={<RequireAuth role="admin"><AdminCategories /></RequireAuth>} />
              <Route path="/admin/saccos"     element={<RequireAuth role="admin"><AdminSaccos /></RequireAuth>} />
              <Route path="/admin/users"      element={<RequireAuth role="admin"><AdminUsers /></RequireAuth>} />
              <Route path="/admin/bookings"   element={<RequireAuth role="admin"><AdminBookings /></RequireAuth>} />
              <Route path="/admin/payments"   element={<RequireAuth role="admin"><AdminPayments /></RequireAuth>} />
              <Route path="/admin/analytics"  element={<RequireAuth role="admin"><AdminAnalytics /></RequireAuth>} />
              <Route path="/admin/support"    element={<RequireAuth role="admin"><AdminSupport /></RequireAuth>} />
              <Route path="/admin/settings"   element={<RequireAuth role="admin"><AdminSettings /></RequireAuth>} />
              <Route path="/admin/notifications" element={<RequireAuth role="admin"><AdminNotifications /></RequireAuth>} />
              <Route path="/admin/help" element={<RequireAuth role="admin"><AdminHelp /></RequireAuth>} />

              {/* ── Fallback ─────────────────────────────────────────────── */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ToastProvider>
        </BookingProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

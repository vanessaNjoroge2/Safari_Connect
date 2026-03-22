import type { RegisterPayload, SearchQuery, UserRole } from '../types';

const RAW_API_BASE =
  (import.meta.env.VITE_BACKEND_BASE_URL as string | undefined) ||
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ||
  'http://localhost:3215';

function normalizeApiBase(url: string) {
  let base = url.trim().replace(/\/$/, '');
  // Accept either host root (http://localhost:3215) or host with /api suffix.
  if (base.endsWith('/api')) {
    base = base.slice(0, -4);
  }
  return base;
}

const API_BASE = normalizeApiBase(RAW_API_BASE);

export const AUTH_TOKEN_KEY = 'safiri_auth_token';

export function getAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY) || '';
}

export function setAuthToken(token: string) {
  if (!token) return;
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearAuthToken() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

type ApiOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  token?: string;
};

async function apiRequest<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const method = options.method || 'GET';
  const token = options.token || getAuthToken();

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || data?.success === false) {
    throw new Error(data?.message || data?.error || `Request failed (${response.status})`);
  }

  return data as T;
}

type BackendUserRole = 'USER' | 'OWNER' | 'ADMIN';

function toFrontendRole(role: BackendUserRole): UserRole {
  if (role === 'OWNER') return 'owner';
  if (role === 'ADMIN') return 'admin';
  return 'passenger';
}

function toBackendRole(role: UserRole): BackendUserRole {
  if (role === 'owner') return 'OWNER';
  if (role === 'admin') return 'ADMIN';
  return 'USER';
}

export type AuthUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: BackendUserRole;
  status?: string;
};

export type AuthEnvelope = {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: AuthUser;
  };
};

export type MeEnvelope = {
  success: boolean;
  message: string;
  data: AuthUser;
};

export async function loginApi(payload: { email: string; password: string }) {
  return apiRequest<AuthEnvelope>('/api/auth/login', {
    method: 'POST',
    body: payload,
  });
}

export async function registerApi(payload: RegisterPayload) {
  const role = payload.role ?? 'passenger';
  return apiRequest<AuthEnvelope>('/api/auth/register', {
    method: 'POST',
    body: {
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email,
      phone: payload.phone,
      password: payload.password,
      role: toBackendRole(role),
    },
  });
}

export async function meApi(token?: string) {
  return apiRequest<MeEnvelope>('/api/auth/me', {
    method: 'GET',
    token,
  });
}

export async function updateMeApi(payload: {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}) {
  return apiRequest<MeEnvelope>('/api/auth/me', {
    method: 'PATCH',
    body: payload,
  });
}

export async function changeMyPasswordApi(payload: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}) {
  return apiRequest<{ success: boolean; message: string; data: null }>('/api/auth/password', {
    method: 'PATCH',
    body: payload,
  });
}

export function mapAuthUserToFrontend(user: AuthUser) {
  const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
  const initials = fullName
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return {
    id: user.id,
    name: fullName || user.email,
    email: user.email,
    phone: user.phone || '',
    role: toFrontendRole(user.role),
    initials: initials || 'SC',
  };
}

export type TripSearchEnvelope = {
  success: boolean;
  message: string;
  data: Array<{
    id: string;
    departureTime: string;
    arrivalTime: string;
    duration: string;
    basePrice: number;
    availableSeatsCount: number;
    seatClasses: Array<'VIP' | 'FIRST_CLASS' | 'BUSINESS'>;
    sacco: { id: string; name: string };
    bus: { id: string; name: string; plateNumber: string; seatCapacity: number };
    route: { id: string; origin: string; destination: string };
  }>;
};

function toBackendTripType(tripType: SearchQuery['tripType']) {
  return tripType === 'return' ? 'ROUND_TRIP' : 'ONE_WAY';
}

export async function searchTripsApi(query: SearchQuery) {
  const params = new URLSearchParams();
  params.set('category', query.category);
  params.set('origin', query.from);
  params.set('destination', query.to);
  params.set('date', query.date);
  if (query.time) params.set('time', query.time);
  params.set('tripType', toBackendTripType(query.tripType));

  return apiRequest<TripSearchEnvelope>(`/api/trips/search?${params.toString()}`);
}

export type TripSeatsEnvelope = {
  success: boolean;
  message: string;
  data: {
    trip: {
      id: string;
      departureTime: string;
      arrivalTime: string;
      sacco: { id: string; name: string };
      route: { origin: string; destination: string };
      bus: { id: string; name: string; plateNumber: string };
    };
    seats: Array<{
      id: string;
      seatNumber: string;
      seatClass: 'VIP' | 'FIRST_CLASS' | 'BUSINESS';
      price: number;
      isBooked: boolean;
    }>;
  };
};

export async function getTripSeatsApi(tripId: string) {
  return apiRequest<TripSeatsEnvelope>(`/api/trips/${tripId}/seats`);
}

export type CreateBookingEnvelope = {
  success: boolean;
  message: string;
  data: {
    id: string;
    bookingCode: string;
    amount: number;
    status: string;
    tripId: string;
    seatId: string;
  };
};

export async function createBookingApi(payload: {
  tripId: string;
  seatId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  nationalId: string;
  residence: string;
}) {
  return apiRequest<CreateBookingEnvelope>('/api/bookings', {
    method: 'POST',
    body: payload,
  });
}

export type StkPushEnvelope = {
  success: boolean;
  message: string;
  data: {
    payment: {
      id: string;
      status: string;
      bookingId: string;
      amount: number;
      phoneNumber: string;
    };
    stkResponse: {
      CheckoutRequestID: string;
      MerchantRequestID: string;
    };
  };
};

export async function initiateStkPushApi(payload: { bookingId: string; phoneNumber: string }) {
  try {
    return await apiRequest<StkPushEnvelope>('/api/payments/stk-push', {
      method: 'POST',
      body: payload,
    });
  } catch (error) {
    const msg = (error as Error).message || '';
    if (!msg.includes('404')) throw error;

    // Legacy fallback for older route shapes.
    return apiRequest<StkPushEnvelope>('/api/payments/payment/stk-push', {
      method: 'POST',
      body: payload,
    });
  }
}

export type PaymentStatusEnvelope = {
  success: boolean;
  message: string;
  data: {
    bookingId: string;
    bookingCode: string;
    bookingStatus: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
    payment: null | {
      id: string;
      status: 'PENDING' | 'SUCCESS' | 'FAILED';
      transactionRef: string | null;
      amount: number;
      phoneNumber: string;
      createdAt?: string;
      updatedAt?: string;
    };
  };
};

export async function getPaymentStatusApi(bookingId: string) {
  try {
    return await apiRequest<PaymentStatusEnvelope>(`/api/payments/status/${bookingId}`);
  } catch (error) {
    const msg = (error as Error).message || '';
    if (!msg.includes('404')) throw error;

    // Legacy fallback for older route shapes.
    return apiRequest<PaymentStatusEnvelope>(`/api/payments/payment/status/${bookingId}`);
  }
}

export type MyBookingsEnvelope = {
  success: boolean;
  message: string;
  data: Array<{
    id: string;
    bookingCode: string;
    status: string;
    aiAnalysis?: string | null;
    amount: number;
    createdAt: string;
    seat: { seatNumber: string; seatClass: 'VIP' | 'FIRST_CLASS' | 'BUSINESS' };
    trip: {
      departureTime: string;
      route: { origin: string; destination: string };
      sacco: { name: string };
    };
    payment: null | {
      status: string;
      transactionRef: string | null;
      aiAnalysis?: string | null;
    };
  }>;
};

export async function getMyBookingsApi() {
  return apiRequest<MyBookingsEnvelope>('/api/bookings/me');
}

export type PortalNotificationsEnvelope = {
  success: boolean;
  message: string;
  data: Array<{
    id: string;
    title: string;
    message: string;
    channel: 'In App' | 'Email' | 'Sms' | 'Push';
    targetRole: 'ADMIN' | 'OWNER' | 'USER' | 'ALL';
    status: 'Draft' | 'Scheduled' | 'Sent' | 'Cancelled';
    scheduledFor: string | null;
    sentAt: string | null;
    createdAt: string;
  }>;
};

export async function getPortalNotificationsApi(params?: { q?: string; limit?: number }) {
  const search = new URLSearchParams();
  if (params?.q) search.set('q', params.q);
  if (params?.limit) search.set('limit', String(params.limit));
  const query = search.toString();
  return apiRequest<PortalNotificationsEnvelope>(`/api/portal/notifications${query ? `?${query}` : ''}`);
}

export type PortalHelpEnvelope = {
  success: boolean;
  message: string;
  data: Array<{
    id: string;
    title: string;
    slug: string;
    category: string;
    content: string;
    status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
    isAiGenerated: boolean;
    createdAt: string;
    updatedAt: string;
  }>;
};

export async function getPortalHelpApi(params?: { q?: string; category?: string; limit?: number }) {
  const search = new URLSearchParams();
  if (params?.q) search.set('q', params.q);
  if (params?.category) search.set('category', params.category);
  if (params?.limit) search.set('limit', String(params.limit));
  const query = search.toString();
  return apiRequest<PortalHelpEnvelope>(`/api/portal/help${query ? `?${query}` : ''}`);
}

export type OwnerBusEnvelope = {
  success: boolean;
  message: string;
  data: {
    id: string;
    saccoId: string;
    name: string;
    plateNumber: string;
    seatCapacity: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  };
};

export async function createOwnerBusApi(payload: {
  name: string;
  plateNumber: string;
  seatCapacity: number;
}) {
  return apiRequest<OwnerBusEnvelope>('/api/buses', {
    method: 'POST',
    body: payload,
  });
}

export type OwnerBusesEnvelope = {
  success: boolean;
  message: string;
  data: Array<{
    id: string;
    saccoId: string;
    name: string;
    plateNumber: string;
    seatCapacity: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  }>;
};

export async function getOwnerBusesApi() {
  return apiRequest<OwnerBusesEnvelope>('/api/buses/me');
}

export async function updateOwnerBusApi(
  busId: string,
  payload: Partial<{ name: string; plateNumber: string; seatCapacity: number }>
) {
  return apiRequest<OwnerBusEnvelope>(`/api/buses/${busId}`, {
    method: 'PATCH',
    body: payload,
  });
}

export async function deleteOwnerBusApi(busId: string) {
  return apiRequest<{ success: boolean; message: string; data: { id: string } }>(`/api/buses/${busId}`, {
    method: 'DELETE',
  });
}

export type OwnerBusSeatsEnvelope = {
  success: boolean;
  message: string;
  data: Array<{
    id: string;
    busId: string;
    seatNumber: string;
    seatClass: 'VIP' | 'FIRST_CLASS' | 'BUSINESS';
    price: number;
  }>;
};

export async function getOwnerBusSeatsApi(busId: string) {
  return apiRequest<OwnerBusSeatsEnvelope>(`/api/buses/${busId}/seats`);
}

export async function createOwnerBusSeatsApi(
  busId: string,
  seats: Array<{
    seatNumber: string;
    seatClass: 'VIP' | 'FIRST_CLASS' | 'BUSINESS';
    price: number;
  }>
) {
  return apiRequest<OwnerBusSeatsEnvelope>(`/api/buses/${busId}/seats`, {
    method: 'POST',
    body: { seats },
  });
}

export async function updateOwnerBusSeatsApi(
  busId: string,
  seats: Array<{
    seatNumber: string;
    seatClass: 'VIP' | 'FIRST_CLASS' | 'BUSINESS';
    price: number;
  }>
) {
  return apiRequest<OwnerBusSeatsEnvelope>(`/api/buses/${busId}/seats`, {
    method: 'PATCH',
    body: { seats },
  });
}

export async function deleteOwnerBusSeatsApi(busId: string) {
  return apiRequest<{ success: boolean; message: string; data: { id: string; deletedCount: number } }>(`/api/buses/${busId}/seats`, {
    method: 'DELETE',
  });
}

export type OwnerTripsEnvelope = {
  success: boolean;
  message: string;
  data: Array<{
    id: string;
    busId: string;
    routeId: string;
    departureTime: string;
    arrivalTime: string;
    basePrice: number;
    status: 'SCHEDULED' | 'CANCELLED' | 'COMPLETED';
    bookedSeats: number;
    availableSeats: number;
    bus: {
      id: string;
      name: string;
      plateNumber: string;
      seatCapacity: number;
    };
    route: {
      id: string;
      origin: string;
      destination: string;
    };
    bookings: Array<{
      id: string;
      bookingCode: string;
      firstName: string;
      lastName: string;
      phone: string;
      amount: number;
      status: string;
      createdAt: string;
    }>;
  }>;
};

export async function getOwnerTripsApi() {
  return apiRequest<OwnerTripsEnvelope>('/api/trips/me');
}

export async function createOwnerTripApi(payload: {
  busId: string;
  routeId: string;
  tripType?: 'ONE_WAY' | 'ROUND_TRIP';
  departureTime: string;
  arrivalTime: string;
  basePrice: number;
}) {
  return apiRequest<{ success: boolean; message: string; data: any }>('/api/trips', {
    method: 'POST',
    body: payload,
  });
}

export async function updateOwnerTripApi(
  tripId: string,
  payload: Partial<{
    busId: string;
    routeId: string;
    tripType: 'ONE_WAY' | 'ROUND_TRIP';
    departureTime: string;
    arrivalTime: string;
    basePrice: number;
  }>
) {
  return apiRequest<{ success: boolean; message: string; data: any }>(`/api/trips/${tripId}`, {
    method: 'PATCH',
    body: payload,
  });
}

export async function updateOwnerTripStatusApi(tripId: string, status: 'SCHEDULED' | 'CANCELLED' | 'COMPLETED') {
  return apiRequest<{ success: boolean; message: string; data: any }>(`/api/trips/${tripId}/status`, {
    method: 'PATCH',
    body: { status },
  });
}

export async function deleteOwnerTripApi(tripId: string) {
  return apiRequest<{ success: boolean; message: string; data: { id: string } }>(`/api/trips/${tripId}`, {
    method: 'DELETE',
  });
}

export type RoutesEnvelope = {
  success: boolean;
  message: string;
  data: Array<{
    id: string;
    origin: string;
    destination: string;
    distanceKm?: number;
    estimatedTime?: number;
  }>;
};

export async function getRoutesApi() {
  return apiRequest<RoutesEnvelope>('/api/routes');
}

export async function createRouteApi(payload: {
  origin: string;
  destination: string;
  distanceKm?: number;
  estimatedTime?: number;
}) {
  return apiRequest<{ success: boolean; message: string; data: RoutesEnvelope['data'][number] }>('/api/routes', {
    method: 'POST',
    body: payload,
  });
}

export async function updateRouteApi(
  routeId: string,
  payload: Partial<{ origin: string; destination: string; distanceKm: number; estimatedTime: number }>
) {
  return apiRequest<{ success: boolean; message: string; data: RoutesEnvelope['data'][number] }>(`/api/routes/${routeId}`, {
    method: 'PATCH',
    body: payload,
  });
}

export async function deleteRouteApi(routeId: string) {
  return apiRequest<{ success: boolean; message: string; data: { id: string } }>(`/api/routes/${routeId}`, {
    method: 'DELETE',
  });
}

export type CategoriesEnvelope = {
  success: boolean;
  message: string;
  data: Array<{
    id: string;
    name: string;
    slug: string;
    description?: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
};

export type CategoryEnvelope = {
  success: boolean;
  message: string;
  data: {
    id: string;
    name: string;
    slug: string;
    description?: string | null;
    createdAt: string;
    updatedAt: string;
  };
};

export async function getCategoriesApi() {
  return apiRequest<CategoriesEnvelope>('/api/categories');
}

export async function createCategoryApi(payload: { name: string; slug: string; description?: string }) {
  return apiRequest<CategoryEnvelope>('/api/categories', {
    method: 'POST',
    body: payload,
  });
}

export async function updateCategoryApi(categoryId: string, payload: { name?: string; slug?: string; description?: string }) {
  return apiRequest<CategoryEnvelope>(`/api/categories/${categoryId}`, {
    method: 'PATCH',
    body: payload,
  });
}

export async function deleteCategoryApi(categoryId: string) {
  return apiRequest<{ success: boolean; message: string; data: any }>(`/api/categories/${categoryId}`, {
    method: 'DELETE',
  });
}

export async function getBookingByIdApi(bookingId: string) {
  return apiRequest<{ success: boolean; message: string; data: any }>(`/api/bookings/${bookingId}`);
}

export type AdminDashboardEnvelope = {
  success: boolean;
  message: string;
  data: {
    generatedAt: string;
    stats: {
      totalUsers: number;
      activeSaccos: number;
      pendingSaccos: number;
      bookingsToday: number;
      grossRevenue: number;
      failedPaymentsToday: number;
      activeTrips: number;
      commission: number;
      openDisputes: number;
    };
    topRoutes: Array<{
      route: string;
      bookings: number;
    }>;
    pendingActions: {
      saccoApprovals: number;
      fraudCases: number;
      openDisputes: number;
      pendingWithdrawals: number;
    };
  };
};

export type AdminBookingsEnvelope = {
  success: boolean;
  message: string;
  data: Array<{
    id: string;
    bookingCode: string;
    passengerName: string;
    route: string;
    saccoName: string;
    createdAt: string;
    seatLabel: string;
    amount: number;
    paymentLabel: string;
    bookingStatus: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'EXPIRED';
    statusLabel: 'Upcoming' | 'On Route' | 'Completed' | 'Cancelled' | 'Disputed';
    paymentStatus: null | 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
  }>;
};

export type AdminPaymentsEnvelope = {
  success: boolean;
  message: string;
  data: Array<{
    id: string;
    bookingCode: string;
    passengerName: string;
    saccoName: string;
    route: string;
    createdAt: string;
    amount: number;
    commission: number;
    transactionRef: string;
    status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
    statusLabel: 'Settled' | 'Pending' | 'Disputed' | 'Refunded';
  }>;
};

export async function getAdminDashboardApi() {
  return apiRequest<AdminDashboardEnvelope>('/api/admins/dashboard');
}

export async function getAdminBookingsApi(params?: {
  status?: 'ALL' | 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'EXPIRED';
  q?: string;
  limit?: number;
}) {
  const search = new URLSearchParams();
  if (params?.status && params.status !== 'ALL') search.set('status', params.status);
  if (params?.q) search.set('q', params.q);
  if (params?.limit) search.set('limit', String(params.limit));
  const query = search.toString();
  return apiRequest<AdminBookingsEnvelope>(`/api/admins/bookings${query ? `?${query}` : ''}`);
}

export async function getAdminPaymentsApi(params?: {
  status?: 'ALL' | 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
  q?: string;
  limit?: number;
}) {
  const search = new URLSearchParams();
  if (params?.status && params.status !== 'ALL') search.set('status', params.status);
  if (params?.q) search.set('q', params.q);
  if (params?.limit) search.set('limit', String(params.limit));
  const query = search.toString();
  return apiRequest<AdminPaymentsEnvelope>(`/api/admins/payments${query ? `?${query}` : ''}`);
}

export type AdminUsersEnvelope = {
  success: boolean;
  message: string;
  data: Array<{
    id: string;
    name: string;
    email: string;
    phone: string;
    role: 'USER' | 'OWNER' | 'ADMIN';
    status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
    trustScore: number;
    trips: number;
    createdAt: string;
  }>;
};

export async function getAdminUsersApi(params?: {
  role?: 'ALL' | 'USER' | 'OWNER' | 'ADMIN';
  status?: 'ALL' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  q?: string;
  limit?: number;
}) {
  const search = new URLSearchParams();
  if (params?.role && params.role !== 'ALL') search.set('role', params.role);
  if (params?.status && params.status !== 'ALL') search.set('status', params.status);
  if (params?.q) search.set('q', params.q);
  if (params?.limit) search.set('limit', String(params.limit));
  const query = search.toString();
  return apiRequest<AdminUsersEnvelope>(`/api/admins/users${query ? `?${query}` : ''}`);
}

export type AdminSaccosEnvelope = {
  success: boolean;
  message: string;
  data: Array<{
    id: string;
    name: string;
    owner: string;
    email: string;
    routes: number;
    vehicles: number;
    bookings: number;
    revenue: number;
    status: 'Active' | 'Pending';
    joined: string;
    rating: number;
  }>;
};

export async function getAdminSaccosApi(params?: {
  status?: 'ALL' | 'ACTIVE' | 'PENDING';
  limit?: number;
}) {
  const search = new URLSearchParams();
  if (params?.status && params.status !== 'ALL') search.set('status', params.status);
  if (params?.limit) search.set('limit', String(params.limit));
  const query = search.toString();
  return apiRequest<AdminSaccosEnvelope>(`/api/admins/saccos${query ? `?${query}` : ''}`);
}

export type CreateAdminSaccoPayload = {
  ownerFirstName: string;
  ownerLastName: string;
  ownerEmail: string;
  ownerPhone?: string;
  ownerPassword: string;
  name: string;
  categoryId: string;
  supportEmail?: string;
  supportPhone?: string;
  logoUrl?: string;
  isActive?: boolean;
};

export async function createAdminSaccoApi(payload: CreateAdminSaccoPayload) {
  return apiRequest<{ success: boolean; message: string; data: any }>(`/api/admins/saccos`, {
    method: 'POST',
    body: payload,
  });
}

export type AdminAnalyticsEnvelope = {
  success: boolean;
  message: string;
  data: {
    range: '6m' | '30d' | 'ytd';
    periodLabel: string;
    generatedAt: string;
    windowStart: string;
    windowEnd: string;
    kpis: {
      grossRevenue: number;
      totalBookings: number;
      activeSaccos: number;
      platformCommission: number;
      avgFare: number;
      refundRate: number;
      newUsers: number;
      repeatBookingRate: number;
    };
    months: Array<{ month: string; revenue: number; bookings: number }>;
    topRoutes: Array<{ route: string; bookings: number; revenue: number }>;
    topSaccos: Array<{ name: string; revenue: number; bookings: number }>;
  };
};

export async function getAdminAnalyticsApi(params?: { range?: '6m' | '30d' | 'ytd' }) {
  const search = new URLSearchParams();
  if (params?.range) search.set('range', params.range);
  const query = search.toString();
  return apiRequest<AdminAnalyticsEnvelope>(`/api/admins/analytics${query ? `?${query}` : ''}`);
}

export type AdminSupportEnvelope = {
  success: boolean;
  message: string;
  data: Array<{
    id: string;
    ticketCode: string;
    subject: string;
    user: string;
    category: string;
    created: string;
    priority: string;
    status: string;
    assignedTo: string;
    description: string;
  }>;
};

export async function getAdminSupportApi(params?: {
  status?: 'OPEN' | 'IN_REVIEW' | 'ESCALATED' | 'RESOLVED';
  category?: 'BOOKING' | 'PAYMENT' | 'DISPUTE' | 'APP_BUG' | 'GENERAL';
  q?: string;
  limit?: number;
}) {
  const search = new URLSearchParams();
  if (params?.status) search.set('status', params.status);
  if (params?.category) search.set('category', params.category);
  if (params?.q) search.set('q', params.q);
  if (params?.limit) search.set('limit', String(params.limit));
  const query = search.toString();
  return apiRequest<AdminSupportEnvelope>(`/api/admins/support${query ? `?${query}` : ''}`);
}

export async function createAdminSupportApi(payload: {
  subject: string;
  user: string;
  category?: 'BOOKING' | 'PAYMENT' | 'DISPUTE' | 'APP_BUG' | 'GENERAL';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  status?: 'OPEN' | 'IN_REVIEW' | 'ESCALATED' | 'RESOLVED';
  assignedTo?: string;
  description?: string;
}) {
  return apiRequest<{ success: boolean; message: string; data: AdminSupportEnvelope['data'][number] }>('/api/admins/support', {
    method: 'POST',
    body: payload,
  });
}

export type AdminSettingsEnvelope = {
  success: boolean;
  message: string;
  data: {
    commissionRate: number;
    minimumFare: number;
    aiPricing: boolean;
    fraudBlockThreshold: number;
    delayRiskAlert: 'medium' | 'high';
    voiceLanguages: 'en' | 'sw' | 'en-sw';
    notifications: {
      smsBooking: boolean;
      emailTicket: boolean;
      pushDeparture: boolean;
      pushNotifications: boolean;
      saccoRevenueReport: boolean;
      adminFraudAlert: boolean;
    };
    sessionTimeoutMinutes: number;
    maxFailedLogins: number;
    require2fa: boolean;
    platformInfo: {
      version: string;
      environment: string;
      build: string;
      apiStatus: string;
    };
  };
};

export async function getAdminSettingsApi() {
  return apiRequest<AdminSettingsEnvelope>('/api/admins/settings');
}

export async function updateAdminSettingsApi(payload: Partial<AdminSettingsEnvelope['data']>) {
  return apiRequest<AdminSettingsEnvelope>('/api/admins/settings', {
    method: 'PATCH',
    body: payload,
  });
}

export async function updateAdminTicketApi(ticketId: string, payload: Partial<{
  status: 'OPEN' | 'IN_REVIEW' | 'ESCALATED' | 'RESOLVED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  category: 'BOOKING' | 'PAYMENT' | 'DISPUTE' | 'APP_BUG' | 'GENERAL';
  subject: string;
  user: string;
  assignedTo: string;
  description: string;
}>) {
  return apiRequest<{ success: boolean; message: string; data: any }>(`/api/admins/support/${ticketId}`, {
    method: 'PATCH',
    body: payload,
  });
}

export async function deleteAdminTicketApi(ticketId: string) {
  return apiRequest<{ success: boolean; message: string; data: { id: string } }>(`/api/admins/support/${ticketId}`, {
    method: 'DELETE',
  });
}

export type AdminNotificationsEnvelope = {
  success: boolean;
  message: string;
  data: Array<{
    id: string;
    title: string;
    message: string;
    channel: 'In App' | 'Email' | 'Sms' | 'Push';
    targetRole: 'ADMIN' | 'OWNER' | 'USER' | 'ALL';
    status: 'Draft' | 'Scheduled' | 'Sent' | 'Cancelled';
    scheduledFor: string | null;
    sentAt: string | null;
    createdAt: string;
  }>;
};

export async function getAdminNotificationsApi(params?: {
  status?: 'DRAFT' | 'SCHEDULED' | 'SENT' | 'CANCELLED';
  channel?: 'IN_APP' | 'EMAIL' | 'SMS' | 'PUSH';
  targetRole?: 'ADMIN' | 'OWNER' | 'USER' | 'ALL';
  q?: string;
  limit?: number;
}) {
  const search = new URLSearchParams();
  if (params?.status) search.set('status', params.status);
  if (params?.channel) search.set('channel', params.channel);
  if (params?.targetRole) search.set('targetRole', params.targetRole);
  if (params?.q) search.set('q', params.q);
  if (params?.limit) search.set('limit', String(params.limit));
  const query = search.toString();
  return apiRequest<AdminNotificationsEnvelope>(`/api/admins/notifications${query ? `?${query}` : ''}`);
}

export async function createAdminNotificationApi(payload: {
  title: string;
  message: string;
  channel: 'IN_APP' | 'EMAIL' | 'SMS' | 'PUSH';
  targetRole?: 'ADMIN' | 'OWNER' | 'USER' | 'ALL';
  status?: 'DRAFT' | 'SCHEDULED' | 'SENT' | 'CANCELLED';
  scheduledFor?: string | null;
}) {
  return apiRequest<{ success: boolean; message: string; data: AdminNotificationsEnvelope['data'][number] }>('/api/admins/notifications', {
    method: 'POST',
    body: payload,
  });
}

export async function updateAdminNotificationApi(notificationId: string, payload: Partial<{
  title: string;
  message: string;
  channel: 'IN_APP' | 'EMAIL' | 'SMS' | 'PUSH';
  targetRole: 'ADMIN' | 'OWNER' | 'USER' | 'ALL';
  status: 'DRAFT' | 'SCHEDULED' | 'SENT' | 'CANCELLED';
  scheduledFor: string | null;
}>) {
  return apiRequest<{ success: boolean; message: string; data: AdminNotificationsEnvelope['data'][number] }>(`/api/admins/notifications/${notificationId}`, {
    method: 'PATCH',
    body: payload,
  });
}

export async function deleteAdminNotificationApi(notificationId: string) {
  return apiRequest<{ success: boolean; message: string; data: { id: string } }>(`/api/admins/notifications/${notificationId}`, {
    method: 'DELETE',
  });
}

export type AdminHelpEnvelope = {
  success: boolean;
  message: string;
  data: Array<{
    id: string;
    title: string;
    slug: string;
    category: string;
    content: string;
    status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
    isAiGenerated: boolean;
    createdAt: string;
    updatedAt: string;
  }>;
};

export async function getAdminHelpApi(params?: { status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'; q?: string; limit?: number }) {
  const search = new URLSearchParams();
  if (params?.status) search.set('status', params.status);
  if (params?.q) search.set('q', params.q);
  if (params?.limit) search.set('limit', String(params.limit));
  const query = search.toString();
  return apiRequest<AdminHelpEnvelope>(`/api/admins/help${query ? `?${query}` : ''}`);
}

export async function createAdminHelpApi(payload: {
  title: string;
  category: string;
  content: string;
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  isAiGenerated?: boolean;
}) {
  return apiRequest<{ success: boolean; message: string; data: AdminHelpEnvelope['data'][number] }>('/api/admins/help', {
    method: 'POST',
    body: payload,
  });
}

export async function updateAdminHelpApi(helpId: string, payload: Partial<{
  title: string;
  category: string;
  content: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  isAiGenerated: boolean;
}>) {
  return apiRequest<{ success: boolean; message: string; data: AdminHelpEnvelope['data'][number] }>(`/api/admins/help/${helpId}`, {
    method: 'PATCH',
    body: payload,
  });
}

export async function deleteAdminHelpApi(helpId: string) {
  return apiRequest<{ success: boolean; message: string; data: { id: string } }>(`/api/admins/help/${helpId}`, {
    method: 'DELETE',
  });
}

export async function updateAdminSaccoStatusApi(saccoId: string, payload: { isActive: boolean }) {
  return apiRequest<{ success: boolean; message: string; data: any }>(`/api/admins/saccos/${saccoId}`, {
    method: 'PATCH',
    body: payload,
  });
}

export async function updateAdminUserStatusApi(userId: string, payload: { status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' }) {
  return apiRequest<{ success: boolean; message: string; data: any }>(`/api/admins/users/${userId}`, {
    method: 'PATCH',
    body: payload,
  });
}

export type AiAssistEnvelope = {
  success: boolean;
  message: string;
  data: {
    language: 'en' | 'sw';
    modules: {
      recommendation: {
        topPick: null | {
          id?: string;
          route?: string;
          price?: number;
          travelMinutes?: number;
          reliabilityScore?: number;
          score?: number;
        };
        confidence: number;
      };
      pricing: {
        currentPrice: number;
        predictedPrice: number;
        confidence: number;
        demandLevel: 'high' | 'normal' | 'unknown';
        cheaperWindowSuggestion: string;
      };
      delayRisk: {
        riskScore: number;
        riskLevel: 'low' | 'medium' | 'high';
        confidence: number;
        recommendation: string;
      };
      fraud: {
        fraudScore: number;
        decision: 'allow' | 'review' | 'block';
        confidence: number;
      };
      operations: {
        occupancyRate: number;
        riskLevel: 'low' | 'medium' | 'high';
        action: 'hold' | 'add_vehicle' | 'enable_waitlist' | 'shift_departure';
        dispatchAdvice: string;
        confidence: number;
      };
      chat: {
        message: string;
      };
    };
    summary: {
      topAction: string;
      passengerMessage: string;
    };
  };
};

export type AiContextEnvelope = {
  success: boolean;
  message: string;
  data: {
    scope: 'owner' | 'passenger';
    source: 'database';
    generatedAt: string;
    trips: Array<{
      id: string;
      route: string;
      origin: string;
      destination: string;
      departureTime: string;
      arrivalTime: string;
      vehicleName: string;
      plateNumber: string;
      seatCapacity: number;
      bookedSeats: number;
      availableSeats: number;
      occupancyRate: number;
      price: number;
      travelMinutes: number;
      reliabilityScore: number;
      saccoName?: string;
    }>;
    routes: Array<{
      id: string;
      route: string;
      origin: string;
      destination: string;
      tripCount: number;
      passengerCount?: number;
      avgFare: number;
      avgOccupancyRate?: number;
    }>;
    vehicles?: Array<{
      id: string;
      name: string;
      plateNumber: string;
      seatCapacity: number;
      isActive: boolean;
    }>;
    pricing: {
      minFare: number;
      maxFare: number;
      avgFare: number;
      currency: 'KES';
    };
    operations: {
      totalVehicles?: number;
      activeVehicles?: number;
      totalRoutes: number;
      totalUpcomingTrips: number;
      overallOccupancyRate?: number;
    };
    analytics?: {
      routePerformance: Array<{
        id: string;
        route: string;
        origin: string;
        destination: string;
        tripCount: number;
        passengerCount: number;
        avgFare: number;
        avgOccupancyRate: number;
      }>;
      revenueTrend: Array<{
        date: string;
        day: string;
        amount: number;
      }>;
    };
    nextTrip?: {
      id: string;
      route: string;
      origin: string;
      destination: string;
      departureTime: string;
      arrivalTime: string;
      vehicleName: string;
      plateNumber: string;
      seatCapacity: number;
      bookedSeats: number;
      availableSeats: number;
      occupancyRate: number;
      price: number;
      travelMinutes: number;
      reliabilityScore: number;
      saccoName: string;
    } | null;
    recentBookings?: Array<{
      id: string;
      bookingCode: string;
      status: string;
      amount: number;
      route: string;
      departureTime: string;
      saccoName: string;
    }>;
  };
};

export async function aiContextApi() {
  return apiRequest<AiContextEnvelope>('/api/ai/context');
}

export async function aiAssistApi(payload: {
  prompt: string;
  language?: 'en' | 'sw';
  route?: string;
  departureTime?: string;
  currentPrice?: number;
  totalSeats?: number;
  bookedSeats?: number;
  noShowRate?: number;
  riskFactors?: {
    weatherRisk?: number;
    trafficRisk?: number;
    routeRisk?: number;
  };
  fraudSignals?: {
    attemptsLast24h?: number;
    cardMismatch?: boolean;
    rapidRetries?: number;
    geoMismatch?: boolean;
  };
  trips?: Array<{
    id: string;
    route: string;
    price: number;
    travelMinutes: number;
    reliabilityScore: number;
  }>;
  intent?: {
    maxBudget?: number;
    maxTravelMinutes?: number;
  };
}) {
  return apiRequest<AiAssistEnvelope>('/api/ai/assist', {
    method: 'POST',
    body: payload,
  });
}

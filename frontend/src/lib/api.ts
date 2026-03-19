import type { RegisterPayload, SearchQuery, UserRole } from '../types';

const API_BASE =
  (import.meta.env.VITE_BACKEND_BASE_URL as string | undefined) ||
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ||
  'http://localhost:5000';

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
  return apiRequest<AuthEnvelope>('/api/auth/register', {
    method: 'POST',
    body: {
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email,
      phone: payload.phone,
      password: payload.password,
      role: toBackendRole(payload.role),
    },
  });
}

export async function meApi(token?: string) {
  return apiRequest<MeEnvelope>('/api/auth/me', {
    method: 'GET',
    token,
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
  return apiRequest<StkPushEnvelope>('/api/payments/stk-push', {
    method: 'POST',
    body: payload,
  });
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
    };
  };
};

export async function getPaymentStatusApi(bookingId: string) {
  return apiRequest<PaymentStatusEnvelope>(`/api/payments/status/${bookingId}`);
}

export type MyBookingsEnvelope = {
  success: boolean;
  message: string;
  data: Array<{
    id: string;
    bookingCode: string;
    status: string;
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
    };
  }>;
};

export async function getMyBookingsApi() {
  return apiRequest<MyBookingsEnvelope>('/api/bookings/me');
}

export async function getBookingByIdApi(bookingId: string) {
  return apiRequest<{ success: boolean; message: string; data: any }>(`/api/bookings/${bookingId}`);
}

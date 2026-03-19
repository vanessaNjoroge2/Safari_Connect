// ─── Auth & User ────────────────────────────────────────────────────────────

export type UserRole = 'passenger' | 'owner' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  initials: string;
  residence?: string;
  trustScore?: number;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  role?: UserRole;
  // Owner only
  saccoName?: string;
  regNumber?: string;
  category?: string;
}

// ─── Booking Flow ────────────────────────────────────────────────────────────

export type TripType = 'one-way' | 'return';
export type SeatClass = 'economy' | 'business' | 'vip';
export type Category = 'bus' | 'matatu' | 'motorbike' | 'carrier';

export interface SearchQuery {
  category: Category;
  from: string;
  to: string;
  date: string;
  time: string;
  tripType: TripType;
  returnDate?: string;
  returnTime?: string;
  passengers: number;
}

export interface BusResult {
  id: string;
  busId?: string;
  routeId?: string;
  saccoName: string;
  plateInfo: string;
  rating: number;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  price: number;
  priceLabel: string;
  seatsLeft: number;
  classes: SeatClass[];
  highlighted?: boolean;
}

export interface TripSeat {
  id: string;
  seatNumber: string;
  seatClass: SeatClass;
  price: number;
  isBooked: boolean;
}

export interface PassengerDetails {
  firstName: string;
  lastName: string;
  idNumber: string;
  residence: string;
  email: string;
}

export interface BookingState {
  searchQuery: SearchQuery | null;
  searchResults: BusResult[];
  selectedBus: BusResult | null;
  selectedTripId: string | null;
  tripSeats: TripSeat[];
  selectedSeat: string | null;
  selectedSeatId: string | null;
  seatClass: SeatClass;
  fare: number;
  passenger: PassengerDetails | null;
  phone: string;
  bookingRef: string;
  bookingId: string;
  bookingStatus: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | '';
}

// ─── Owner / Fleet ───────────────────────────────────────────────────────────

export interface Vehicle {
  id: string;
  name: string;
  plate: string;
  type: string;
  status: 'active' | 'idle' | 'maintenance';
  economySeats: number;
  businessSeats: number;
  vipSeats: number;
  driverName: string;
  conductorName?: string;
  aiInsight?: string;
}

export interface Route {
  id: string;
  from: string;
  to: string;
  distance: string;
  duration: string;
  standardFare: number;
  tripsPerDay: number;
  status: 'active' | 'review' | 'inactive';
}

export interface Trip {
  id: string;
  busId: string;
  busPlate: string;
  route: string;
  date: string;
  departure: string;
  arrival: string;
  type: 'one-way' | 'return';
  fare: number;
  classes: string;
  seatsLeft: number;
  status: 'on-route' | 'scheduled' | 'boarding' | 'completed';
}

export interface Booking {
  id: string;
  passengerName: string;
  route: string;
  bus: string;
  seat: string;
  date: string;
  paymentStatus: 'paid' | 'pending' | 'flagged' | 'failed';
  bookingStatus: 'confirmed' | 'awaiting' | 'ai-hold' | 'cancelled' | 'boarded';
  amount: number;
}

export interface Payment {
  id: string;
  passengerName: string;
  phone: string;
  amount: number;
  txRef: string;
  bookingId: string;
  time: string;
  status: 'successful' | 'initiated' | 'failed' | 'fraud-hold' | 'refunded';
}

// ─── Carrier ─────────────────────────────────────────────────────────────────

export type CarrierService = 'package' | 'movers' | 'courier';
export type VehicleType = 'motorbike' | 'van' | 'truck';
export type DeliverySpeed = 'express' | 'sameday' | 'scheduled';

export interface PackageOrder {
  pickup: string;
  dropoff: string;
  date: string;
  time: string;
  packageSize: 'small' | 'medium' | 'large' | 'custom';
  description: string;
  recipientName: string;
  recipientPhone: string;
  fragile: boolean;
  urgent: boolean;
  signatureRequired: boolean;
  vehicleType: VehicleType;
  phone: string;
  fare: number;
  orderRef: string;
}

export interface MoversOrder {
  pickup: string;
  dropoff: string;
  date: string;
  time: string;
  rooms: string;
  specialItems: string[];
  pickupFloor: string;
  dropoffFloor: string;
  elevatorAvailable: boolean;
  package: 'basic' | 'standard' | 'premium';
  phone: string;
}

// ─── Admin ───────────────────────────────────────────────────────────────────

export interface Sacco {
  id: string;
  name: string;
  category: string;
  vehicles: number;
  routes: number;
  revenueThisMonth: string;
  performance: 'top' | 'good' | 'average' | null;
  status: 'active' | 'pending' | 'suspended';
}

export interface SupportTicket {
  id: string;
  user: string;
  type: string;
  description: string;
  sacco: string;
  priority: 'high' | 'medium' | 'low';
  status: 'open' | 'resolved' | 'escalated';
  createdAt: string;
}

// ─── UI Helpers ───────────────────────────────────────────────────────────────

export type BadgeVariant = 'green' | 'amber' | 'red' | 'blue' | 'purple' | 'gray';
export type ToastType = 'success' | 'error' | 'warning' | 'info';

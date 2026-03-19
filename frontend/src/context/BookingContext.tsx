import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { BookingState, SearchQuery, BusResult, SeatClass, PassengerDetails, TripSeat } from '../types';

interface BookingContextValue {
  booking: BookingState;
  setSearch: (q: SearchQuery) => void;
  setSearchResults: (results: BusResult[]) => void;
  selectBus: (bus: BusResult) => void;
  setTripSeats: (seats: TripSeat[]) => void;
  selectSeat: (seat: string, cls: SeatClass, fare: number) => void;
  setPassenger: (p: PassengerDetails) => void;
  setPhone: (phone: string) => void;
  confirmBooking: (bookingRef?: string, bookingId?: string, bookingStatus?: BookingState['bookingStatus']) => string;
  reset: () => void;
}

const initial: BookingState = {
  searchQuery: null,
  searchResults: [],
  selectedBus: null,
  selectedTripId: null,
  tripSeats: [],
  selectedSeat: null,
  selectedSeatId: null,
  seatClass: 'economy',
  fare: 0,
  passenger: null,
  phone: '',
  bookingRef: '',
  bookingId: '',
  bookingStatus: '',
};

const BookingContext = createContext<BookingContextValue | null>(null);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [booking, setBooking] = useState<BookingState>(initial);

  const setSearch = useCallback((q: SearchQuery) =>
    setBooking(p => ({ ...p, searchQuery: q })), []);

  const setSearchResults = useCallback((results: BusResult[]) =>
    setBooking(p => ({ ...p, searchResults: results })), []);

  const selectBus = useCallback((bus: BusResult) =>
    setBooking(p => ({ ...p, selectedBus: bus, selectedTripId: bus.id })), []);

  const setTripSeats = useCallback((seats: TripSeat[]) =>
    setBooking(p => ({ ...p, tripSeats: seats })), []);

  const selectSeat = useCallback((seat: string, cls: SeatClass, fare: number) =>
    setBooking(p => {
      const selected = p.tripSeats.find((s) => s.seatNumber === seat);
      return {
        ...p,
        selectedSeat: seat,
        selectedSeatId: selected?.id || null,
        seatClass: cls,
        fare,
      };
    }), []);

  const setPassenger = useCallback((passenger: PassengerDetails) =>
    setBooking(p => ({ ...p, passenger })), []);

  const setPhone = useCallback((phone: string) =>
    setBooking(p => ({ ...p, phone })), []);

  const confirmBooking = useCallback((bookingRef?: string, bookingId?: string, bookingStatus?: BookingState['bookingStatus']): string => {
    const ref = bookingRef || `SC-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
    setBooking(p => ({
      ...p,
      bookingRef: ref,
      bookingId: bookingId || p.bookingId,
      bookingStatus: bookingStatus || p.bookingStatus,
    }));
    return ref;
  }, []);

  const reset = useCallback(() => setBooking(initial), []);

  return (
    <BookingContext.Provider value={{ booking, setSearch, setSearchResults, selectBus, setTripSeats, selectSeat, setPassenger, setPhone, confirmBooking, reset }}>
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking(): BookingContextValue {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error('useBooking must be used within BookingProvider');
  return ctx;
}

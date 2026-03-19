import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { BookingProvider } from '../../src/context/BookingContext';
import { ToastProvider } from '../../src/hooks/useToast';
import Search from '../../src/pages/passenger/Search';
import Results from '../../src/pages/passenger/Results';
import Seat from '../../src/pages/passenger/Seat';
import Confirm from '../../src/pages/passenger/Confirm';
import Payment from '../../src/pages/passenger/Payment';
import Ticket from '../../src/pages/passenger/Ticket';

const searchTripsApiMock = vi.fn();
const getTripSeatsApiMock = vi.fn();
const createBookingApiMock = vi.fn();
const initiateStkPushApiMock = vi.fn();
const getPaymentStatusApiMock = vi.fn();
const getBookingByIdApiMock = vi.fn();

vi.mock('../../src/context/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'u-passenger-1',
      name: 'Jane Passenger',
      email: 'jane@example.com',
      phone: '0712345678',
      role: 'passenger',
      initials: 'JP',
    },
    isLoading: false,
  }),
}));

vi.mock('../../src/lib/api', async () => {
  const actual = await vi.importActual<typeof import('../../src/lib/api')>('../../src/lib/api');
  return {
    ...actual,
    searchTripsApi: (...args: unknown[]) => searchTripsApiMock(...args),
    getTripSeatsApi: (...args: unknown[]) => getTripSeatsApiMock(...args),
    createBookingApi: (...args: unknown[]) => createBookingApiMock(...args),
    initiateStkPushApi: (...args: unknown[]) => initiateStkPushApiMock(...args),
    getPaymentStatusApi: (...args: unknown[]) => getPaymentStatusApiMock(...args),
    getBookingByIdApi: (...args: unknown[]) => getBookingByIdApiMock(...args),
  };
});

describe('e2e passenger full booking flow', () => {
  beforeEach(() => {
    searchTripsApiMock.mockResolvedValue({
      success: true,
      message: 'ok',
      data: [
        {
          id: 'trip-1',
          departureTime: new Date('2026-03-20T08:00:00.000Z').toISOString(),
          arrivalTime: new Date('2026-03-20T11:00:00.000Z').toISOString(),
          duration: '3h',
          basePrice: 1200,
          availableSeatsCount: 10,
          seatClasses: ['VIP', 'FIRST_CLASS', 'BUSINESS'],
          sacco: { id: 's1', name: 'Demo Sacco' },
          bus: { id: 'b1', name: 'Demo Bus', plateNumber: 'KDA 123A', seatCapacity: 33 },
          route: { id: 'r1', origin: 'Nairobi', destination: 'Nakuru' },
        },
      ],
    });

    getTripSeatsApiMock.mockResolvedValue({
      success: true,
      message: 'ok',
      data: {
        trip: {
          id: 'trip-1',
          departureTime: new Date('2026-03-20T08:00:00.000Z').toISOString(),
          arrivalTime: new Date('2026-03-20T11:00:00.000Z').toISOString(),
          sacco: { id: 's1', name: 'Demo Sacco' },
          route: { origin: 'Nairobi', destination: 'Nakuru' },
          bus: { id: 'b1', name: 'Demo Bus', plateNumber: 'KDA 123A' },
        },
        seats: [
          { id: 'seat-a1', seatNumber: 'A1', seatClass: 'VIP', price: 1800, isBooked: false },
          { id: 'seat-a2', seatNumber: 'A2', seatClass: 'FIRST_CLASS', price: 1500, isBooked: true },
        ],
      },
    });

    createBookingApiMock.mockResolvedValue({
      success: true,
      message: 'created',
      data: {
        id: 'booking-1',
        bookingCode: 'BK-0001',
        amount: 1800,
        status: 'PENDING',
        tripId: 'trip-1',
        seatId: 'seat-a1',
      },
    });

    initiateStkPushApiMock.mockResolvedValue({ success: true, message: 'ok', data: {} });

    getPaymentStatusApiMock.mockResolvedValue({
      success: true,
      message: 'ok',
      data: {
        bookingId: 'booking-1',
        bookingCode: 'BK-0001',
        bookingStatus: 'CONFIRMED',
        payment: {
          id: 'pay-1',
          status: 'SUCCESS',
          transactionRef: 'MPESA123',
          amount: 1800,
          phoneNumber: '0712345678',
        },
      },
    });

    getBookingByIdApiMock.mockResolvedValue({
      success: true,
      message: 'ok',
      data: {
        id: 'booking-1',
        bookingCode: 'BK-0001',
        firstName: 'Jane',
        lastName: 'Passenger',
        nationalId: '12345678',
        amount: 1800,
        seat: { seatNumber: 'A1', seatClass: 'VIP' },
        trip: {
          departureTime: new Date('2026-03-20T08:00:00.000Z').toISOString(),
          arrivalTime: new Date('2026-03-20T11:00:00.000Z').toISOString(),
          sacco: { name: 'Demo Sacco' },
        },
      },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('completes Search -> Seat -> Confirm -> Payment -> Ticket', async () => {
    render(
      <MemoryRouter initialEntries={['/passenger/search?auto=1&cat=bus&from=Nairobi&to=Nakuru&date=2026-03-20']}>
        <ToastProvider>
          <BookingProvider>
            <Routes>
              <Route path="/passenger/search" element={<Search />} />
              <Route path="/passenger/results" element={<Results />} />
              <Route path="/passenger/seat" element={<Seat />} />
              <Route path="/passenger/confirm" element={<Confirm />} />
              <Route path="/passenger/payment" element={<Payment />} />
              <Route path="/passenger/ticket" element={<Ticket />} />
            </Routes>
          </BookingProvider>
        </ToastProvider>
      </MemoryRouter>
    );

    await waitFor(() => expect(searchTripsApiMock).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(getTripSeatsApiMock).toHaveBeenCalledTimes(1));

    fireEvent.click(await screen.findByRole('button', { name: /A1/i }));

    fireEvent.change(screen.getByPlaceholderText('First name'), { target: { value: 'Jane' } });
    fireEvent.change(screen.getByPlaceholderText('Last name'), { target: { value: 'Passenger' } });
    fireEvent.change(screen.getByPlaceholderText('National ID'), { target: { value: '12345678' } });
    fireEvent.change(screen.getByPlaceholderText('Residence'), { target: { value: 'Nairobi' } });
    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'jane@example.com' } });

    fireEvent.click(screen.getByRole('button', { name: /Reserve Seat A1/i }));
    fireEvent.click(screen.getByRole('button', { name: /Continue to confirm/i }));

    const checkbox = await screen.findByRole('checkbox');
    fireEvent.click(checkbox);

    fireEvent.change(screen.getByPlaceholderText('07XX XXX XXX'), { target: { value: '0712345678' } });
    fireEvent.click(screen.getByRole('button', { name: /Pay KES/i }));

    await waitFor(() => expect(createBookingApiMock).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(initiateStkPushApiMock).toHaveBeenCalledTimes(1));

    await waitFor(() => expect(getPaymentStatusApiMock).toHaveBeenCalled(), { timeout: 7000 });

    expect(await screen.findByText(/SafiriConnect · E-Ticket/i, {}, { timeout: 12000 })).toBeInTheDocument();
  }, 15000);
});

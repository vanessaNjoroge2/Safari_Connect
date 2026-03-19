import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { BookingProvider } from '../../src/context/BookingContext';
import { ToastProvider } from '../../src/hooks/useToast';
import Search from '../../src/pages/passenger/Search';

const searchTripsApiMock = vi.fn();

vi.mock('../../src/lib/api', async () => {
  const actual = await vi.importActual<typeof import('../../src/lib/api')>('../../src/lib/api');
  return {
    ...actual,
    searchTripsApi: (...args: unknown[]) => searchTripsApiMock(...args),
  };
});

describe('e2e search auto mode', () => {
  it('automatically searches and navigates to results in auto mode', async () => {
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
          seatClasses: ['VIP'],
          sacco: { id: 's1', name: 'Demo Sacco' },
          bus: { id: 'b1', name: 'Demo Bus', plateNumber: 'KDA 123A', seatCapacity: 33 },
          route: { id: 'r1', origin: 'Nairobi', destination: 'Nakuru' },
        },
      ],
    });

    render(
      <MemoryRouter
        initialEntries={['/passenger/search?auto=1&cat=bus&from=Nairobi&to=Nakuru&date=2026-03-20']}
      >
        <ToastProvider>
          <BookingProvider>
            <Routes>
              <Route path="/passenger/search" element={<Search />} />
              <Route path="/passenger/results" element={<div>Results page reached</div>} />
            </Routes>
          </BookingProvider>
        </ToastProvider>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(searchTripsApiMock).toHaveBeenCalledTimes(1);
    });

    expect(await screen.findByText('Results page reached')).toBeInTheDocument();
  });
});

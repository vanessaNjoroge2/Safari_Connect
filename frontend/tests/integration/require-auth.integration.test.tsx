import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import RequireAuth from '../../src/components/RequireAuth';

const useAuthMock = vi.fn();

vi.mock('../../src/context/AuthContext', () => ({
  useAuth: () => useAuthMock(),
}));

describe('RequireAuth', () => {
  it('shows loading message while auth is restoring', () => {
    useAuthMock.mockReturnValue({ user: null, isLoading: true });

    render(
      <MemoryRouter initialEntries={['/owner/dashboard']}>
        <Routes>
          <Route
            path="/owner/dashboard"
            element={<RequireAuth role="owner"><div>Protected owner area</div></RequireAuth>}
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Restoring your session...')).toBeInTheDocument();
  });

  it('redirects unauthenticated user to role login page', () => {
    useAuthMock.mockReturnValue({ user: null, isLoading: false });

    render(
      <MemoryRouter initialEntries={['/admin/dashboard']}>
        <Routes>
          <Route
            path="/admin/dashboard"
            element={<RequireAuth role="admin"><div>Protected admin area</div></RequireAuth>}
          />
          <Route path="/auth/login" element={<div>Login page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Login page')).toBeInTheDocument();
  });

  it('redirects user with wrong role to their own home page', () => {
    useAuthMock.mockReturnValue({
      isLoading: false,
      user: {
        id: 'p-1',
        name: 'Passenger One',
        email: 'p1@example.com',
        phone: '254700000002',
        role: 'passenger',
        initials: 'PO',
      },
    });

    render(
      <MemoryRouter initialEntries={['/admin/dashboard']}>
        <Routes>
          <Route
            path="/admin/dashboard"
            element={<RequireAuth role="admin"><div>Protected admin area</div></RequireAuth>}
          />
          <Route path="/passenger/home" element={<div>Passenger home</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Passenger home')).toBeInTheDocument();
  });
});

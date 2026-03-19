import { describe, expect, it, beforeEach } from 'vitest';
import {
  AUTH_TOKEN_KEY,
  clearAuthToken,
  getAuthToken,
  mapAuthUserToFrontend,
  setAuthToken,
} from '../../src/lib/api';

describe('api helpers', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('maps backend auth user into frontend user shape', () => {
    const mapped = mapAuthUserToFrontend({
      id: 'user-1',
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@example.com',
      phone: '254700000001',
      role: 'OWNER',
    });

    expect(mapped).toEqual({
      id: 'user-1',
      name: 'Jane Doe',
      email: 'jane@example.com',
      phone: '254700000001',
      role: 'owner',
      initials: 'JD',
    });
  });

  it('falls back to email and SC initials when names are absent', () => {
    const mapped = mapAuthUserToFrontend({
      id: 'user-2',
      firstName: '',
      lastName: '',
      email: 'noname@example.com',
      role: 'USER',
    });

    expect(mapped.name).toBe('noname@example.com');
    expect(mapped.initials).toBe('SC');
    expect(mapped.role).toBe('passenger');
  });

  it('persists and clears auth token in localStorage', () => {
    expect(getAuthToken()).toBe('');

    setAuthToken('token-123');
    expect(getAuthToken()).toBe('token-123');
    expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBe('token-123');

    clearAuthToken();
    expect(getAuthToken()).toBe('');
    expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBeNull();
  });
});

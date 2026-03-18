import { useEffect, useState } from 'react';
import { AuthContext } from './authContextObject';
import { api } from '../lib/api';

const DEMO_USERS = {
  user:  { id: 1, name: 'Jane Mwangi',    role: 'user',  initials: 'JM', email: 'jane@safiri.co.ke',  phone: '0712 345 678' },
  owner: { id: 2, name: 'Modern Coast',   role: 'owner', initials: 'MC', email: 'ops@moderncoast.co.ke', sacco: 'Modern Coast Sacco' },
  admin: { id: 3, name: 'Platform Admin', role: 'admin', initials: 'PA', email: 'admin@safiri.co.ke' },
};

function toUiUser(user) {
  const role = String(user?.role || 'USER').toLowerCase();
  const firstName = user?.firstName || '';
  const lastName = user?.lastName || '';
  const name = `${firstName} ${lastName}`.trim() || user?.name || 'User';
  const initials = (firstName?.[0] || name?.[0] || 'U') + (lastName?.[0] || name?.split(' ')[1]?.[0] || 'S');

  return {
    id: user?.id,
    name,
    role,
    initials: initials.toUpperCase(),
    email: user?.email,
    phone: user?.phone,
    ownerProfile: user?.ownerProfile
  };
}

export function AuthProvider({ children }) {
  const initialToken = localStorage.getItem('sc_token');
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(Boolean(initialToken));

  useEffect(() => {
    if (!initialToken) {
      return;
    }

    api.me()
      .then((res) => setUser(toUiUser(res.data)))
      .catch(() => {
        localStorage.removeItem('sc_token');
        setUser(null);
      })
      .finally(() => setAuthLoading(false));
  }, [initialToken]);

  const login = async (payloadOrRole) => {
    if (typeof payloadOrRole === 'string') {
      setUser(DEMO_USERS[payloadOrRole]);
      return DEMO_USERS[payloadOrRole];
    }

    const response = await api.login({
      email: payloadOrRole.email,
      password: payloadOrRole.password
    });

    const token = response?.data?.token;
    const backendUser = response?.data?.user;
    if (token) {
      localStorage.setItem('sc_token', token);
    }

    const uiUser = toUiUser(backendUser);
    setUser(uiUser);
    return uiUser;
  };

  const register = async (payload) => {
    const response = await api.register(payload);
    const token = response?.data?.token;
    const backendUser = response?.data?.user;

    if (token) {
      localStorage.setItem('sc_token', token);
    }

    const uiUser = toUiUser(backendUser);
    setUser(uiUser);
    return uiUser;
  };

  const logout = () => {
    localStorage.removeItem('sc_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, authLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

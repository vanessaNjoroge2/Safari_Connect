import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export const ROLES = { USER: 'user', OWNER: 'owner', ADMIN: 'admin' };

const DEMO_USERS = {
  user:  { id: 1, name: 'Jane Mwangi',    role: 'user',  initials: 'JM', email: 'jane@safiri.co.ke',  phone: '0712 345 678' },
  owner: { id: 2, name: 'Modern Coast',   role: 'owner', initials: 'MC', email: 'ops@moderncoast.co.ke', sacco: 'Modern Coast Sacco' },
  admin: { id: 3, name: 'Platform Admin', role: 'admin', initials: 'PA', email: 'admin@safiri.co.ke' },
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const login = (role) => { setUser(DEMO_USERS[role]); };
  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() { return useContext(AuthContext); }

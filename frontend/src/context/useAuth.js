import { useContext } from 'react';
import { AuthContext } from './authContextObject';

export function useAuth() {
  return useContext(AuthContext);
}

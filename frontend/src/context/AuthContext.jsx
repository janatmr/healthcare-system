import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  clearAuthStorage,
  getStoredToken,
  getStoredUser,
  persistAuth,
} from '../services/api';
import { loginRequest, logoutRequest } from '../services/auth.service';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [token, setToken] = useState(() => getStoredToken());
  const [user, setUser] = useState(() => getStoredUser());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(false);
  }, []);

  const login = useCallback(
    async (email, password) => {
      const data = await loginRequest(email, password);
      persistAuth(data.token, data.user);
      setToken(data.token);
      setUser(data.user);
      navigate('/dashboard', { replace: true });
      return data;
    },
    [navigate]
  );

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } catch {
      // Best-effort; always clear local session
    } finally {
      clearAuthStorage();
      setToken(null);
      setUser(null);
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  const value = useMemo(
    () => ({
      user,
      token,
      login,
      logout,
      isAuthenticated: Boolean(token && user),
      isLoading,
    }),
    [user, token, login, logout, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

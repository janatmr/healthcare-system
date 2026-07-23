import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { setNavigateHandler } from './authStore';

/**
 * Wires React Router navigation into auth store login/logout actions.
 */
export function AuthProvider({ children }) {
  const navigate = useNavigate();

  useEffect(() => {
    setNavigateHandler(navigate);
    return () => setNavigateHandler(null);
  }, [navigate]);

  return children;
}

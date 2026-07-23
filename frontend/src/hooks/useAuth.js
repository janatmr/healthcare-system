import { useCallback, useMemo, useSyncExternalStore } from 'react';
import * as authStore from '../context/authStore';

export function useAuth() {
  const state = useSyncExternalStore(authStore.subscribe, authStore.getSnapshot);

  const login = useCallback((email, password) => authStore.login(email, password), []);
  const logout = useCallback(() => authStore.logout(), []);

  return useMemo(
    () => ({
      user: state.user,
      token: state.token,
      login,
      logout,
      isAuthenticated: Boolean(state.token && state.user),
      isLoading: state.isLoading,
    }),
    [state.user, state.token, state.isLoading, login, logout]
  );
}

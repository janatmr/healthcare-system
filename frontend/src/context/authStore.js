import {
  clearAuthStorage,
  getStoredToken,
  getStoredUser,
  persistAuth,
} from '../services/api';
import { loginRequest, logoutRequest } from '../services/auth.service';

let state = {
  token: getStoredToken(),
  user: getStoredUser(),
  // Token/user are read synchronously from localStorage — no async bootstrap.
  isLoading: false,
};

const listeners = new Set();
let navigateHandler = null;

function emit() {
  listeners.forEach((listener) => listener());
}

function setState(patch) {
  state = { ...state, ...patch };
  emit();
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSnapshot() {
  return state;
}

export function setNavigateHandler(handler) {
  navigateHandler = handler;
}

export async function login(email, password) {
  const data = await loginRequest(email, password);
  persistAuth(data.token, data.user);
  setState({ token: data.token, user: data.user, isLoading: false });
  navigateHandler?.('/dashboard', { replace: true });
  return data;
}

export async function logout() {
  try {
    await logoutRequest();
  } catch {
    // Best-effort; always clear local session
  } finally {
    clearAuthStorage();
    setState({ token: null, user: null, isLoading: false });
    navigateHandler?.('/login', { replace: true });
  }
}

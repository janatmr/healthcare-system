import api from './api';

export async function loginRequest(email, password) {
  const { data } = await api.post('/auth/login', { email, password });
  return data;
}

export async function logoutRequest() {
  await api.post('/auth/logout');
}

export async function fetchProfile() {
  const { data } = await api.get('/auth/profile');
  return data;
}

export async function fetchDashboardStatistics() {
  const { data } = await api.get('/dashboard/statistics');
  return data;
}

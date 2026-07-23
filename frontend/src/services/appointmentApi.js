import axios from 'axios';
import { getStoredToken, clearAuthStorage } from './api';

const appointmentApi = axios.create({
  baseURL: import.meta.env.VITE_APPOINTMENT_URL || 'http://localhost:5001',
  headers: {
    'Content-Type': 'application/json',
  },
});

appointmentApi.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

appointmentApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearAuthStorage();
      if (window.location.pathname !== '/login') {
        window.location.assign('/login');
      }
    }
    return Promise.reject(error);
  }
);

export default appointmentApi;

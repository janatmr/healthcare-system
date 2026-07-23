import appointmentApi from './appointmentApi';

export async function listAppointments(params = {}) {
  const { data } = await appointmentApi.get('/appointments', { params });
  return data;
}

export async function getAppointment(id) {
  const { data } = await appointmentApi.get(`/appointments/${id}`);
  return data;
}

export async function createAppointment(payload) {
  const { data } = await appointmentApi.post('/appointments', payload);
  return data;
}

export async function updateAppointment(id, payload) {
  const { data } = await appointmentApi.put(`/appointments/${id}`, payload);
  return data;
}

export async function updateAppointmentStatus(id, status) {
  const { data } = await appointmentApi.patch(`/appointments/${id}/status`, {
    status,
  });
  return data;
}

export async function deleteAppointment(id) {
  const { data } = await appointmentApi.delete(`/appointments/${id}`);
  return data;
}

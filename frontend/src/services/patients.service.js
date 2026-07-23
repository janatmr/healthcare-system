import api from './api';

export async function listPatients(params = {}) {
  const { data } = await api.get('/patients', { params });
  return data;
}

export async function getPatient(id) {
  const { data } = await api.get(`/patients/${id}`);
  return data;
}

export async function createPatient(payload) {
  const { data } = await api.post('/patients', payload);
  return data;
}

export async function updatePatient(id, payload) {
  const { data } = await api.put(`/patients/${id}`, payload);
  return data;
}

export async function updatePatientStatus(id, status) {
  const { data } = await api.patch(`/patients/${id}/status`, { status });
  return data;
}

export async function deletePatient(id) {
  const { data } = await api.delete(`/patients/${id}`);
  return data;
}

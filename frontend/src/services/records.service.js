import api from './api';

export async function listRecords(params = {}) {
  const { data } = await api.get('/records', { params });
  return data;
}

export async function getRecord(id) {
  const { data } = await api.get(`/records/${id}`);
  return data;
}

export async function createRecord(payload) {
  const { data } = await api.post('/records', payload);
  return data;
}

export async function updateRecord(id, payload) {
  const { data } = await api.put(`/records/${id}`, payload);
  return data;
}

export async function deleteRecord(id) {
  const { data } = await api.delete(`/records/${id}`);
  return data;
}

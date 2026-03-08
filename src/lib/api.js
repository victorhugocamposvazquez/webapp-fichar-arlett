const API_BASE = '/api';

async function request(path, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Error en la petición');
  }

  return data;
}

export const api = {
  login: (pin) => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ pin }),
  }),
  changePin: (currentPin, newPin) => request('/auth/change-pin', {
    method: 'POST',
    body: JSON.stringify({ currentPin, newPin }),
  }),
  me: () => request('/auth/me'),

  clockIn: (note) => request('/records/clock-in', {
    method: 'POST',
    body: JSON.stringify({ note }),
  }),
  clockOut: (note) => request('/records/clock-out', {
    method: 'POST',
    body: JSON.stringify({ note }),
  }),
  status: () => request('/records/status'),
  history: (params) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/records/history?${qs}`);
  },

  getUsers: () => request('/users'),
  createUser: (data) => request('/users', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateUser: (id, data) => request(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  resetPin: (id, newPin) => request(`/users/${id}/reset-pin`, {
    method: 'POST',
    body: JSON.stringify({ newPin }),
  }),
  deleteUser: (id) => request(`/users/${id}`, { method: 'DELETE' }),
  getAllRecords: (params) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/records/all?${qs}`);
  },
};

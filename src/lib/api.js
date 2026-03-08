const API_BASE = '/api';

async function request(path, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Error del servidor (${res.status}): ${text.substring(0, 200)}`);
  }

  if (!res.ok) {
    throw new Error(data.error || 'Error en la petición');
  }

  return data;
}

export const api = {
  checkInit: () => request('/auth/init'),
  initAdmin: (name, pin) => request('/auth/init', {
    method: 'POST',
    body: JSON.stringify({ name, pin }),
  }),

  login: (pin) => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ pin }),
  }),
  setup: (inviteCode, name, pin) => request('/auth/setup', {
    method: 'POST',
    body: JSON.stringify({ inviteCode, name, pin }),
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
  getWorking: () => request('/records/working'),
  history: (params) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/records/history?${qs}`);
  },

  getUsers: () => request('/users/list'),
  createUser: (data) => request('/users/create', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateUser: (id, data) => request(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  resetPin: (id) => request(`/users/${id}?op=reset-pin`, { method: 'POST' }),
  deleteUser: (id) => request(`/users/${id}`, { method: 'DELETE' }),
  getAllRecords: (params) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/records/all?${qs}`);
  },
};

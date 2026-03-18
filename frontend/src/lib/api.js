const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3215/api').replace(/\/$/, '');

async function request(path, options = {}) {
  const token = localStorage.getItem('sc_token');

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.message || 'Request failed';
    throw new Error(message);
  }

  return data;
}

export const api = {
  login: (payload) => request('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  register: (payload) => request('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  me: () => request('/auth/me'),
  mpesaStkPush: (payload) => request('/payments/mpesa/stk-push', { method: 'POST', body: JSON.stringify(payload) }),
  mpesaStatus: (checkoutRequestId) => request(`/payments/mpesa/status/${checkoutRequestId}`)
};

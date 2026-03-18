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

async function requestSafe(path, options = {}) {
  try {
    return await request(path, options);
  } catch {
    return null;
  }
}

export const api = {
  login: (payload) => request('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  register: (payload) => request('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  me: () => request('/auth/me'),
  aiChat: (payload) => request('/ai/chat', { method: 'POST', body: JSON.stringify(payload) }),
  aiAssist: (payload) => request('/ai/assist', { method: 'POST', body: JSON.stringify(payload) }),
  tripSearch: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/trips/search${query ? `?${query}` : ''}`);
  },
  mpesaStkPush: (payload) => request('/payments/mpesa/stk-push', { method: 'POST', body: JSON.stringify(payload) }),
  mpesaStatus: (checkoutRequestId) => request(`/payments/mpesa/status/${checkoutRequestId}`)
};

export { request, requestSafe };

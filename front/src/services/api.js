import API_BASE from '../utils/constants.js';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('access_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  console.log(`[API] ${options.method || 'GET'} ${endpoint}`);

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`[API] ${response.status} ${endpoint}`, data);
      throw new Error(data.error?.message || 'Error en la solicitud');
    }

    console.log(`[API] OK ${endpoint}`, data);
    return data;
  } catch (err) {
    console.error(`[API] ERROR ${endpoint}`, err.message);
    throw err;
  }
}

export const api = {
  get: (endpoint) => request(endpoint),
  post: (endpoint, body) => request(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  put: (endpoint, body) => request(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (endpoint) => request(endpoint, { method: 'DELETE' }),
};
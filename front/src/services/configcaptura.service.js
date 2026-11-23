import { api } from './api.js';

export const configCapturaService = {
  getAll: () => api.get('/config-captura'),
  update: (campos) => api.put('/config-captura', { campos }),
};

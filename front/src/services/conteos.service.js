import { api } from './api.js';
import API_BASE from '../utils/constants.js';

export const conteosService = {
  list: (params = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.set('page', params.page);
    if (params.limit) query.set('limit', params.limit);
    if (params.barrido) query.set('barrido', params.barrido);
    const qs = query.toString();
    return api.get(`/conteos${qs ? '?' + qs : ''}`);
  },
  getMisConteos: (params = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.set('page', params.page);
    if (params.limit) query.set('limit', params.limit);
    const qs = query.toString();
    return api.get(`/conteos/mis-conteos${qs ? '?' + qs : ''}`);
  },
  create: (data) => api.post('/conteos', data),
  update: (id, data) => api.put(`/conteos/${id}`, data),
  delete: (id) => api.delete(`/conteos/${id}`),
  exportCsv: (barridoId) => {
    const token = localStorage.getItem('access_token');
    return fetch(`${API_BASE}/conteos/export?barrido_id=${barridoId}`, {
      headers: { ...(token && { Authorization: `Bearer ${token}` }) },
    });
  },
};
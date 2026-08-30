import { api } from './api.js';

export const planillasService = {
  list: (params = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.set('page', params.page);
    if (params.limit) query.set('limit', params.limit);
    if (params.barrido) query.set('barrido', params.barrido);
    if (params.id_alm) query.set('id_alm', params.id_alm);
    if (params.search) query.set('search', params.search);
    const qs = query.toString();
    return api.get(`/planillas${qs ? '?' + qs : ''}`);
  },
  getBarridos: () => api.get('/planillas/barridos'),
  getAlmacenes: () => api.get('/planillas/almacenes'),
  getById: (id) => api.get(`/planillas/${id}`),
};
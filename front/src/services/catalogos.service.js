import { api } from './api.js';

export const catalogosService = {
  list: (params = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.set('page', params.page);
    if (params.limit) query.set('limit', params.limit);
    if (params.id_tabla) query.set('id_tabla', params.id_tabla);
    if (params.activo !== undefined && params.activo !== '') query.set('activo', params.activo);
    if (params.search) query.set('search', params.search);
    const qs = query.toString();
    return api.get(`/catalogos${qs ? '?' + qs : ''}`);
  },
  getActivos: (id_tabla) => api.get(`/catalogos/activos${id_tabla ? `?id_tabla=${id_tabla}` : ''}`),
  getTablas: () => api.get('/catalogos/tablas'),
  getById: (id) => api.get(`/catalogos/${id}`),
  create: (data) => api.post('/catalogos', data),
  update: (id, data) => api.put(`/catalogos/${id}`, data),
};
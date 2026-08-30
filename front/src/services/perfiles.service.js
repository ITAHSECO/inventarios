import { api } from './api.js';

export const perfilesService = {
  list: (params = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.set('page', params.page);
    if (params.limit) query.set('limit', params.limit);
    if (params.search) query.set('search', params.search);
    if (params.rol) query.set('rol', params.rol);
    if (params.activo !== undefined && params.activo !== '') query.set('activo', params.activo);
    if (params.sort) query.set('sort', params.sort);
    if (params.order) query.set('order', params.order);
    const qs = query.toString();
    return api.get(`/perfiles${qs ? '?' + qs : ''}`);
  },
  getById: (id) => api.get(`/perfiles/${id}`),
  create: (data) => api.post('/perfiles', data),
  update: (id, data) => api.put(`/perfiles/${id}`, data),
  setPin: (id, pin) => api.put(`/perfiles/${id}/pin`, { pin }),
};
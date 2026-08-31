import { api } from './api.js';

export const barridosService = {
  list: (params = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.set('page', params.page);
    if (params.limit) query.set('limit', params.limit);
    if (params.estado) query.set('estado', params.estado);
    if (params.search) query.set('search', params.search);
    const qs = query.toString();
    return api.get(`/barridos${qs ? '?' + qs : ''}`);
  },
  getById: (id) => api.get(`/barridos/${id}`),
  create: (data) => api.post('/barridos', data),
  update: (id, data) => api.put(`/barridos/${id}`, data),
  getUsuarios: (id) => api.get(`/barridos/${id}/usuarios`),
  asignarUsuarios: (id, usuario_ids) => api.post(`/barridos/${id}/usuarios`, { usuario_ids }),
  desasignarUsuario: (id, uid) => api.delete(`/barridos/${id}/usuarios/${uid}`),
  getMisBarridos: () => api.get('/barridos/mis-barridos'),
  getInventariadores: () => api.get('/barridos/inventariadores'),
};
import { api } from './api.js';

export const catalogosService = {
  getActivos: (id_tabla) => api.get(`/catalogos/activos${id_tabla ? `?id_tabla=${id_tabla}` : ''}`),
  getTablas: () => api.get('/catalogos/tablas'),
};
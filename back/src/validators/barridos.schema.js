const { z } = require('zod');

const barridoIdParam = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID debe ser numerico'),
  }),
});

const createBarridoSchema = z.object({
  body: z.object({
    nombre: z.string().min(1).max(100).transform(v => v.toUpperCase().trim()),
    estado: z.enum(['activo', 'inactivo', 'cerrado']).default('activo'),
    fecha_inicio: z.string().min(1, 'Fecha de inicio requerida'),
    fecha_fin: z.string().optional().nullable(),
  }),
});

const updateBarridoSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID debe ser numerico'),
  }),
  body: z.object({
    nombre: z.string().min(1).max(100).transform(v => v.toUpperCase().trim()).optional(),
    estado: z.enum(['activo', 'inactivo', 'cerrado']).optional(),
    fecha_inicio: z.string().optional(),
    fecha_fin: z.string().optional().nullable(),
  }),
});

const listBarridosSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(25),
    estado: z.enum(['activo', 'inactivo', 'cerrado']).optional(),
    search: z.string().optional(),
    sort: z.enum(['created_at', 'nombre', 'estado', 'fecha_inicio']).default('created_at'),
    order: z.enum(['asc', 'desc']).default('desc'),
  }),
});

const asignarUsuariosSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID debe ser numerico'),
  }),
  body: z.object({
    usuario_ids: z.array(z.string().uuid()).min(1, 'Debe seleccionar al menos un usuario'),
  }),
});

const desasignarUsuarioSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID barrido debe ser numerico'),
    uid: z.string().uuid('ID usuario debe ser UUID'),
  }),
});

module.exports = {
  barridoIdParam,
  createBarridoSchema,
  updateBarridoSchema,
  listBarridosSchema,
  asignarUsuariosSchema,
  desasignarUsuarioSchema,
};

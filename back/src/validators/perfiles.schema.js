const { z } = require('zod');

const perfilIdParam = z.object({
  params: z.object({
    id: z.string().uuid('ID de perfil invalido'),
  }),
});

const createPerfilSchema = z.object({
  body: z.object({
    username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/),
    nombres: z.string().min(1).max(100),
    apellidos: z.string().min(1).max(100),
    rol: z.enum(['superadmin', 'admin', 'inventariador', 'reportes']),
    pin_autorizacion: z.string().optional(),
    activo: z.boolean().optional(),
  }),
});

const updatePerfilSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    nombres: z.string().min(1).max(100).optional(),
    apellidos: z.string().min(1).max(100).optional(),
    rol: z.enum(['superadmin', 'admin', 'inventariador', 'reportes']).optional(),
    activo: z.boolean().optional(),
  }),
});

const pinSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    pin: z.string().min(4, 'El PIN debe tener al menos 4 caracteres').max(20),
  }),
});

const validatePinSchema = z.object({
  body: z.object({
    username: z.string().min(1),
    pin: z.string().min(1),
  }),
});

const listPerfilesSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(25),
    rol: z.enum(['superadmin', 'admin', 'inventariador', 'reportes']).optional(),
    activo: z.coerce.boolean().optional(),
    search: z.string().optional(),
    sort: z.enum(['created_at', 'username', 'nombres', 'apellidos']).default('created_at'),
    order: z.enum(['asc', 'desc']).default('desc'),
  }),
});

module.exports = {
  perfilIdParam,
  createPerfilSchema,
  updatePerfilSchema,
  pinSchema,
  validatePinSchema,
  listPerfilesSchema,
};

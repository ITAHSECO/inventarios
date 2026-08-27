const { z } = require('zod');

const createCatalogoSchema = z.object({
  body: z.object({
    id_tabla: z.string().min(1).max(50).transform((v) => v.toUpperCase().trim()),
    id_elemento: z.string().min(1).max(50).transform((v) => v.toUpperCase().trim()),
    descripcion: z.string().min(1).max(255),
    activo: z.boolean().optional(),
  }),
});

const updateCatalogoSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID debe ser numerico'),
  }),
  body: z.object({
    descripcion: z.string().min(1).max(255).optional(),
    activo: z.boolean().optional(),
  }),
});

const catalogoIdParam = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID debe ser numerico'),
  }),
});

const listCatalogosSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(25),
    id_tabla: z.string().optional(),
    activo: z.coerce.boolean().optional(),
    search: z.string().optional(),
  }),
});

module.exports = {
  createCatalogoSchema,
  updateCatalogoSchema,
  catalogoIdParam,
  listCatalogosSchema,
};

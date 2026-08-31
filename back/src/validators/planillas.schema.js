const { z } = require('zod');

const createPlanillaSchema = z.object({
  body: z.object({
    barrido: z.string().min(1).max(100).transform((v) => v.toUpperCase().trim()),
    id_alm: z.string().min(1).max(50).transform((v) => v.toUpperCase().trim()),
    id_marca: z.string().max(50).transform((v) => v.toUpperCase().trim()).optional().nullable(),
    id_categoria: z.string().max(50).transform((v) => v.toUpperCase().trim()).optional().nullable(),
    codigo: z.string().min(1).max(50).transform((v) => v.toUpperCase().trim()),
    cod_fab: z.string().max(50).optional().nullable(),
    existencia: z.coerce.number().min(0).default(0),
    descripcion: z.string().min(1).max(255),
    cunidad: z.string().max(20).optional().nullable(),
    serie_lote: z.string().max(100).default('-'),
    vcto: z.string().optional().nullable(),
    maneja_serie_lote: z.boolean().default(false),
  }),
});

const updatePlanillaSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID debe ser numerico'),
  }),
  body: z.object({
    id_marca: z.string().max(50).transform((v) => v.toUpperCase().trim()).optional().nullable(),
    id_categoria: z.string().max(50).transform((v) => v.toUpperCase().trim()).optional().nullable(),
    cod_fab: z.string().max(50).optional().nullable(),
    existencia: z.coerce.number().min(0).optional(),
    descripcion: z.string().min(1).max(255).optional(),
    cunidad: z.string().max(20).optional().nullable(),
    serie_lote: z.string().max(100).optional(),
    vcto: z.string().optional().nullable(),
    maneja_serie_lote: z.boolean().optional(),
  }),
});

const planillaIdParam = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID debe ser numerico'),
  }),
});

const listPlanillasSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(25),
    barrido: z.string().optional(),
    id_alm: z.string().optional(),
    search: z.string().optional(),
  }),
});

const bulkCreatePlanillaSchema = z.object({
  body: z.object({
    barrido: z.string().min(1).max(100).transform((v) => v.toUpperCase().trim()),
    planillas: z.array(createPlanillaSchema.shape.body).min(1, 'Debe incluir al menos una planilla'),
  }),
});

module.exports = {
  createPlanillaSchema,
  updatePlanillaSchema,
  planillaIdParam,
  listPlanillasSchema,
  bulkCreatePlanillaSchema,
};

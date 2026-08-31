const { z } = require('zod');

const createConteoSchema = z.object({
  body: z.object({
    barrido_id: z.coerce.number().int().positive().optional().nullable(),
    barrido: z.string().min(1).max(100).transform((v) => v.toUpperCase().trim()).optional().nullable(),
    codigo: z.string().min(1).max(50).transform((v) => v.toUpperCase().trim()).optional().nullable(),
    descripcion: z.string().max(255).optional().nullable(),
    ubicacion: z.string().min(1).max(100).transform((v) => v.toUpperCase().trim()),
    conteo: z.coerce.number().min(0),
    cunidad: z.string().min(1).max(20).transform((v) => v.toUpperCase().trim()),
    serie_lote: z.string().max(100).default('-').transform((v) => v.toUpperCase().trim()),
    vcto_capturado: z.string().optional().nullable(),
    observacion: z.string().max(255).optional().nullable(),
  }),
});

const bulkConteoSchema = z.object({
  body: z.object({
    capturas: z.array(z.object({
      barrido_id: z.coerce.number().int().positive().optional().nullable(),
      barrido: z.string().min(1).max(100).transform((v) => v.toUpperCase().trim()).optional().nullable(),
      codigo: z.string().min(1).max(50).transform((v) => v.toUpperCase().trim()).optional().nullable(),
      descripcion: z.string().max(255).optional().nullable(),
      ubicacion: z.string().min(1).max(100).transform((v) => v.toUpperCase().trim()),
      conteo: z.coerce.number().min(0),
      cunidad: z.string().min(1).max(20).transform((v) => v.toUpperCase().trim()),
      serie_lote: z.string().max(100).default('-').transform((v) => v.toUpperCase().trim()),
      vcto_capturado: z.string().optional().nullable(),
      observacion: z.string().max(255).optional().nullable(),
      client_capture_id: z.string().uuid().optional(),
    })).min(1).max(500),
  }),
});

const updateConteoSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID debe ser numerico'),
  }),
  body: z.object({
    ubicacion: z.string().min(1).max(100).transform((v) => v.toUpperCase().trim()).optional(),
    conteo: z.coerce.number().min(0).optional(),
    serie_lote: z.string().max(100).transform((v) => v.toUpperCase().trim()).optional(),
    vcto_capturado: z.string().optional().nullable(),
    observacion: z.string().max(255).optional().nullable(),
  }),
});

const supervisorEditSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID debe ser numerico'),
  }),
  body: z.object({
    ubicacion: z.string().min(1).max(100).transform((v) => v.toUpperCase().trim()).optional(),
    conteo: z.coerce.number().min(0).optional(),
    serie_lote: z.string().max(100).transform((v) => v.toUpperCase().trim()).optional(),
    vcto_capturado: z.string().optional().nullable(),
    observacion: z.string().max(255).optional().nullable(),
  }),
});

const conteoIdParam = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID debe ser numerico'),
  }),
});

const listConteosSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(25),
    barrido: z.string().optional(),
    codigo: z.string().optional(),
    inventariador_id: z.string().uuid().optional(),
    search: z.string().optional(),
  }),
});

module.exports = {
  createConteoSchema,
  bulkConteoSchema,
  updateConteoSchema,
  supervisorEditSchema,
  conteoIdParam,
  listConteosSchema,
};

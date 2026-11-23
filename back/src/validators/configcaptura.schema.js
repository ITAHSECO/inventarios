const { z } = require('zod');

const CAMPOS_PERMITIDOS = [
  'codigo',
  'unidad',
  'descripcion',
  'ubicacion',
  'conteo',
  'almacen',
  'marca',
  'serie_lote',
  'vcto',
  'observacion',
];

const updateConfigSchema = z.object({
  body: z.object({
    campos: z
      .array(
        z.object({
          campo: z.enum(CAMPOS_PERMITIDOS),
          activo: z.boolean(),
          obligatorio: z.boolean(),
        })
      )
      .min(1)
      .max(50),
  }),
});

module.exports = { updateConfigSchema, CAMPOS_PERMITIDOS };

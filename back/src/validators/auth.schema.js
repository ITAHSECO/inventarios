const { z } = require('zod');

const signupSchema = z.object({
  body: z.object({
    email: z.string().email('Email invalido'),
    password: z.string().min(6, 'La contrasena debe tener al menos 6 caracteres'),
    username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_.]+$/, 'Username solo puede contener letras, numeros, guiones bajos y puntos'),
    nombres: z.string().min(1).max(100),
    apellidos: z.string().min(1).max(100),
    rol: z.enum(['superadmin', 'admin', 'inventariador', 'reportes']).optional(),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Email invalido'),
    password: z.string().min(1, 'Contrasena requerida'),
  }),
});

const refreshSchema = z.object({
  body: z.object({
    refresh_token: z.string().min(1, 'Refresh token requerido'),
  }),
});

const passwordSchema = z.object({
  body: z.object({
    current_password: z.string().min(1, 'Contrasena actual requerida'),
    new_password: z.string().min(6, 'La nueva contrasena debe tener al menos 6 caracteres'),
  }),
});

module.exports = { signupSchema, loginSchema, refreshSchema, passwordSchema };

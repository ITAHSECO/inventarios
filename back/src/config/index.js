require('dotenv').config();

const config = {
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  supabase: {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },
  corsOrigins: process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim())
    : ['http://localhost:5173', 'http://localhost:3000', 'https://inventarios-d4uj.onrender.com'],
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000,
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
    authMax: parseInt(process.env.RATE_LIMIT_AUTH_MAX, 10) || 20,
  },
};

const required = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'];
for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Variable de entorno requerida no definida: ${key}`);
  }
}

module.exports = config;

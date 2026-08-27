const swaggerJsdoc = require('swagger-jsdoc');
const config = require('./index');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Inventarios API',
      version: '1.0.0',
      description: 'API REST para el Sistema de Captura de Inventario en Campo',
      contact: {
        name: 'Soporte Técnico',
      },
    },
    servers: [
      {
        url: `http://localhost:${config.port}/api`,
        description: 'Servidor de desarrollo',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT de Supabase Auth',
        },
        supervisorPin: {
          type: 'apiKey',
          in: 'header',
          name: 'X-Supervisor-Pin',
          description: 'PIN de autorización del supervisor',
        },
      },
      schemas: {
        Perfil: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            username: { type: 'string', example: 'jdoe' },
            nombres: { type: 'string', example: 'JUAN' },
            apellidos: { type: 'string', example: 'DOE' },
            rol: { type: 'string', enum: ['superadmin', 'admin', 'inventariador', 'reportes'] },
            activo: { type: 'boolean' },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        Catalogo: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            id_tabla: { type: 'string', example: 'ALMACEN' },
            id_elemento: { type: 'string', example: 'ALM001' },
            descripcion: { type: 'string', example: 'Almacen Principal' },
            activo: { type: 'boolean' },
          },
        },
        Planilla: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            barrido: { type: 'string', example: 'BARRIDO-001' },
            id_alm: { type: 'string', example: 'ALM001' },
            id_marca: { type: 'string', nullable: true },
            id_categoria: { type: 'string', nullable: true },
            codigo: { type: 'string', example: 'ART001' },
            cod_fab: { type: 'string', nullable: true },
            existencia: { type: 'number', example: 100 },
            articulo: { type: 'string', example: 'Articulo de Prueba' },
            cunidad: { type: 'string', nullable: true },
            serie_lote: { type: 'string', default: '-' },
            vcto: { type: 'string', format: 'date', nullable: true },
            maneja_serie_lote: { type: 'boolean', default: false },
          },
        },
        Conteo: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            planilla_id: { type: 'integer' },
            barrido: { type: 'string' },
            codigo: { type: 'string' },
            ubicacion: { type: 'string', example: 'ESTANTE-01' },
            conteo: { type: 'number', example: 50 },
            serie_lote: { type: 'string', default: '-' },
            vcto_capturado: { type: 'string', format: 'date', nullable: true },
            modificado_por_supervisor: { type: 'boolean' },
            supervisor_id: { type: 'string', format: 'uuid', nullable: true },
            observacion: { type: 'string', nullable: true },
            inventariador_id: { type: 'string', format: 'uuid' },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                message: { type: 'string' },
                details: { type: 'array', items: { type: 'object' } },
              },
            },
          },
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'object' },
          },
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'array', items: {} },
            meta: {
              type: 'object',
              properties: {
                total: { type: 'integer' },
                page: { type: 'integer' },
                limit: { type: 'integer' },
                totalPages: { type: 'integer' },
              },
            },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;

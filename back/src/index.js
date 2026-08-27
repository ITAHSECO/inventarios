const app = require('./app');
const config = require('./config');
const logger = require('./utils/logger');

const server = app.listen(config.port, () => {
  logger.info(`Servidor corriendo en puerto ${config.port}`);
  logger.info(`Entorno: ${config.nodeEnv}`);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error({ err: reason }, 'UNHANDLED REJECTION');
  server.close(() => process.exit(1));
});

process.on('uncaughtException', (err) => {
  logger.error({ err: { message: err.message, stack: err.stack, name: err.name } }, 'UNCAUGHT EXCEPTION');
  server.close(() => process.exit(1));
});

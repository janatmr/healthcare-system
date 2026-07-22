const app = require('./app');
const config = require('./config');
const logger = require('./utils/logger');

const server = app.listen(config.port, () => {
  logger.info('Backend server started', {
    port: config.port,
    env: config.nodeEnv,
  });
});

function shutdown(signal) {
  logger.info(`Received ${signal}, shutting down gracefully`);
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });

  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', {
    message: reason instanceof Error ? reason.message : String(reason),
  });
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', {
    message: err.message,
    ...(config.isProduction ? {} : { stack: err.stack }),
  });
  process.exit(1);
});

module.exports = server;

const app = require('./app');
const config = require('./config');
const { connectDB, disconnectDB } = require('./config/db');
const logger = require('./utils/logger');

let server;

async function startServer() {
  try {
    await connectDB();

    server = app.listen(config.port, () => {
      logger.info('Backend server started', {
        port: config.port,
        env: config.nodeEnv,
      });
    });
  } catch (err) {
    logger.error('Failed to start backend server', {
      message: err.message,
      ...(config.isProduction ? {} : { stack: err.stack }),
    });
    process.exit(1);
  }
}

async function shutdown(signal) {
  logger.info(`Received ${signal}, shutting down gracefully`);

  const forceTimer = setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
  forceTimer.unref();

  try {
    if (server) {
      await new Promise((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      });
      logger.info('HTTP server closed');
    }

    await disconnectDB();
    clearTimeout(forceTimer);
    process.exit(0);
  } catch (err) {
    logger.error('Error during shutdown', { message: err.message });
    process.exit(1);
  }
}

process.on('SIGTERM', () => {
  shutdown('SIGTERM');
});

process.on('SIGINT', () => {
  shutdown('SIGINT');
});

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

startServer();

module.exports = { startServer };

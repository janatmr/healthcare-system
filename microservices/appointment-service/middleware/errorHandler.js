const logger = require('../utils/logger');
const AppError = require('../utils/AppError');
const config = require('../config');

function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';

  if (!(err instanceof AppError) && !err.statusCode) {
    statusCode = 500;
    message = config.isProduction ? 'Internal server error' : err.message;
  }

  const isOperational = err.isOperational === true;

  if (!isOperational || statusCode >= 500) {
    logger.error('Request failed', {
      statusCode,
      path: req.originalUrl,
      method: req.method,
      message: err.message,
      ...(config.isProduction ? {} : { stack: err.stack }),
    });
  } else {
    logger.warn('Operational error', {
      statusCode,
      path: req.originalUrl,
      method: req.method,
      message: err.message,
    });
  }

  const payload = {
    success: false,
    message,
  };

  if (!config.isProduction && !isOperational && err.stack) {
    payload.stack = err.stack;
  }

  res.status(statusCode).json(payload);
}

module.exports = errorHandler;

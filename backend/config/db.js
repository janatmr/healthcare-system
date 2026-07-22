const mongoose = require('mongoose');
const config = require('./index');
const logger = require('../utils/logger');

let listenersAttached = false;

function attachConnectionListeners() {
  if (listenersAttached) {
    return;
  }

  mongoose.connection.on('error', (err) => {
    logger.error('MongoDB connection error', { message: err.message });
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
  });

  listenersAttached = true;
}

async function connectDB() {
  attachConnectionListeners();

  mongoose.set('strictQuery', true);

  await mongoose.connect(config.mongodbUri);
  logger.info('MongoDB connected', {
    host: mongoose.connection.host,
    name: mongoose.connection.name,
  });
}

async function disconnectDB() {
  if (mongoose.connection.readyState === 0) {
    return;
  }

  await mongoose.connection.close();
  logger.info('MongoDB disconnected');
}

module.exports = {
  connectDB,
  disconnectDB,
};

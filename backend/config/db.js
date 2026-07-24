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

  // Reuse warm connections in serverless (Vercel) invocations
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (mongoose.connection.readyState === 2) {
    await new Promise((resolve, reject) => {
      mongoose.connection.once('connected', resolve);
      mongoose.connection.once('error', reject);
    });
    return mongoose.connection;
  }

  await mongoose.connect(config.mongodbUri);
  logger.info('MongoDB connected', {
    host: mongoose.connection.host,
    name: mongoose.connection.name,
  });
  return mongoose.connection;
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

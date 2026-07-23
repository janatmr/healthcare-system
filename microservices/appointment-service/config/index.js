const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';

const jwtSecret = process.env.JWT_SECRET;

if (isProduction && !jwtSecret) {
  throw new Error('JWT_SECRET is required when NODE_ENV is production');
}

const config = {
  port: Number(process.env.PORT) || 5001,
  nodeEnv,
  isProduction,
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/healthcare',
  jwtSecret: jwtSecret || 'dev-only-change-me',
  // Spec: CORS only for frontend origin
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
};

module.exports = config;

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
  port: Number(process.env.PORT) || 5000,
  nodeEnv,
  isProduction,
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/healthcare',
  jwtSecret: jwtSecret || 'dev-only-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  appointmentServiceUrl:
    process.env.APPOINTMENT_SERVICE_URL || 'http://localhost:5001',
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
};

module.exports = config;

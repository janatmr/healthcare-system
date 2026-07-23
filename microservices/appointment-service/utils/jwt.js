const jwt = require('jsonwebtoken');
const config = require('../config');
const AppError = require('./AppError');

function verifyToken(token) {
  try {
    return jwt.verify(token, config.jwtSecret);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new AppError('Token expired', 401);
    }
    throw new AppError('Invalid token', 401);
  }
}

module.exports = {
  verifyToken,
};

const jwt = require('jsonwebtoken');
const config = require('../../config');
const mongoose = require('mongoose');

function signTestToken({ userId, role }) {
  return jwt.sign({ role }, config.jwtSecret, {
    subject: String(userId || new mongoose.Types.ObjectId()),
    expiresIn: '1h',
  });
}

function authHeader(token) {
  return { Authorization: `Bearer ${token}` };
}

module.exports = {
  signTestToken,
  authHeader,
};

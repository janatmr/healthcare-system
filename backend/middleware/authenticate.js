const User = require('../models/User');
const AppError = require('../utils/AppError');
const { verifyToken } = require('../utils/jwt');

/**
 * Requires Authorization: Bearer <token> and attaches req.user.
 */
async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith('Bearer ')) {
      throw new AppError('Authentication required', 401);
    }

    const token = header.slice(7).trim();
    if (!token) {
      throw new AppError('Authentication required', 401);
    }

    const payload = verifyToken(token);
    const userId = payload.sub;

    if (!userId) {
      throw new AppError('Invalid token', 401);
    }

    const user = await User.findById(userId);

    if (!user || !user.active) {
      throw new AppError('Authentication required', 401);
    }

    req.user = user;
    return next();
  } catch (err) {
    return next(err);
  }
}

module.exports = authenticate;

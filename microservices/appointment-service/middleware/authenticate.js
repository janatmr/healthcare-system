const AppError = require('../utils/AppError');
const { verifyToken } = require('../utils/jwt');

/**
 * Verifies JWT issued by the main backend. No User DB lookup (service isolation).
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
    const role = payload.role;

    if (!userId || !role) {
      throw new AppError('Invalid token', 401);
    }

    req.user = {
      id: userId,
      role,
    };

    return next();
  } catch (err) {
    return next(err);
  }
}

module.exports = authenticate;

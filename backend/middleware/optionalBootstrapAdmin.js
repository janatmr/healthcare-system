const authenticate = require('./authenticate');
const authorize = require('./authorize');
const authService = require('../services/auth.service');
const AppError = require('../utils/AppError');

/**
 * Allows unauthenticated Admin registration when no users exist.
 * Otherwise requires Admin authentication.
 */
async function optionalBootstrapAdmin(req, res, next) {
  try {
    const empty = await authService.isUsersEmpty();

    if (empty) {
      if (req.body.role !== 'Admin') {
        return next(
          new AppError(
            'Initial bootstrap user must have role Admin',
            400
          )
        );
      }
      return next();
    }

    return authenticate(req, res, (err) => {
      if (err) {
        return next(err);
      }
      return authorize('Admin')(req, res, next);
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = optionalBootstrapAdmin;

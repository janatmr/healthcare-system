const AppError = require('../utils/AppError');

/**
 * Restricts access to the given roles. Must run after authenticate.
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError('Forbidden', 403));
    }

    return next();
  };
}

module.exports = authorize;

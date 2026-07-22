const authService = require('../services/auth.service');

async function login(req, res, next) {
  try {
    const result = await authService.login(req.body);
    res.status(200).json({
      success: true,
      token: result.token,
      user: result.user,
    });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (err) {
    next(err);
  }
}

async function register(req, res, next) {
  try {
    const user = await authService.register(req.body);
    res.status(201).json({
      success: true,
      user,
    });
  } catch (err) {
    next(err);
  }
}

async function getProfile(req, res, next) {
  try {
    const user = await authService.getProfile(req.user._id);
    res.status(200).json({
      success: true,
      user,
    });
  } catch (err) {
    next(err);
  }
}

async function changePassword(req, res, next) {
  try {
    const result = await authService.changePassword(req.user._id, req.body);
    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  login,
  logout,
  register,
  getProfile,
  changePassword,
};

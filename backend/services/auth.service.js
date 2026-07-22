const User = require('../models/User');
const AppError = require('../utils/AppError');
const { signToken } = require('../utils/jwt');
const logger = require('../utils/logger');

async function login({ email, password }) {
  const user = await User.findOne({ email: email.toLowerCase() }).select(
    '+password'
  );

  if (!user || !user.active) {
    throw new AppError('Invalid email or password', 401);
  }

  const matches = await user.comparePassword(password);
  if (!matches) {
    throw new AppError('Invalid email or password', 401);
  }

  const token = signToken({ userId: user._id, role: user.role });

  logger.info('User logged in', { userId: String(user._id), role: user.role });

  return {
    token,
    user: user.toJSON(),
  };
}

async function register(payload) {
  const existing = await User.findOne({ email: payload.email.toLowerCase() });
  if (existing) {
    throw new AppError('Email already registered', 409);
  }

  const user = await User.create({
    firstName: payload.firstName,
    lastName: payload.lastName,
    email: payload.email,
    password: payload.password,
    role: payload.role,
    department: payload.department || '',
  });

  logger.info('User registered', { userId: String(user._id), role: user.role });

  return user.toJSON();
}

async function getProfile(userId) {
  const user = await User.findById(userId);
  if (!user || !user.active) {
    throw new AppError('User not found', 404);
  }
  return user.toJSON();
}

async function changePassword(userId, { currentPassword, newPassword }) {
  const user = await User.findById(userId).select('+password');

  if (!user || !user.active) {
    throw new AppError('User not found', 404);
  }

  const matches = await user.comparePassword(currentPassword);
  if (!matches) {
    throw new AppError('Current password is incorrect', 401);
  }

  user.password = newPassword;
  await user.save();

  logger.info('Password changed', { userId: String(user._id) });

  return { message: 'Password updated successfully' };
}

async function isUsersEmpty() {
  const count = await User.countDocuments();
  return count === 0;
}

module.exports = {
  login,
  register,
  getProfile,
  changePassword,
  isUsersEmpty,
};

process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_EXPIRES_IN = '1h';

const jwt = require('jsonwebtoken');
const { signToken, verifyToken } = require('../../utils/jwt');
const AppError = require('../../utils/AppError');

describe('jwt utils', () => {
  test('signToken and verifyToken round-trip', () => {
    const token = signToken({ userId: '507f1f77bcf86cd799439011', role: 'Admin' });
    const payload = verifyToken(token);
    expect(payload.sub).toBe('507f1f77bcf86cd799439011');
    expect(payload.role).toBe('Admin');
  });

  test('verifyToken throws AppError for invalid token', () => {
    expect(() => verifyToken('not-a-token')).toThrow(AppError);
    try {
      verifyToken('not-a-token');
    } catch (err) {
      expect(err.statusCode).toBe(401);
      expect(err.message).toBe('Invalid token');
    }
  });

  test('verifyToken throws AppError for expired token', () => {
    const token = jwt.sign({ role: 'Doctor' }, process.env.JWT_SECRET, {
      subject: '507f1f77bcf86cd799439011',
      expiresIn: -1,
    });
    expect(() => verifyToken(token)).toThrow(AppError);
    try {
      verifyToken(token);
    } catch (err) {
      expect(err.statusCode).toBe(401);
      expect(err.message).toBe('Token expired');
    }
  });
});

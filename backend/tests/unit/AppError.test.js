const AppError = require('../../utils/AppError');

describe('AppError', () => {
  test('sets statusCode and isOperational', () => {
    const err = new AppError('Not found', 404);
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('AppError');
    expect(err.message).toBe('Not found');
    expect(err.statusCode).toBe(404);
    expect(err.isOperational).toBe(true);
  });

  test('defaults statusCode to 500', () => {
    const err = new AppError('Boom');
    expect(err.statusCode).toBe(500);
  });
});

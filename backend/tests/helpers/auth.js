const request = require('supertest');
const app = require('../../app');
const User = require('../../models/User');

const PASSWORD = 'Password123!';

async function createUser(overrides = {}) {
  return User.create({
    firstName: 'Test',
    lastName: 'User',
    email: overrides.email || `user-${Date.now()}@test.local`,
    password: PASSWORD,
    role: overrides.role || 'Doctor',
    department: overrides.department || 'General',
    ...overrides,
  });
}

async function loginAs(email, password = PASSWORD) {
  const res = await request(app).post('/auth/login').send({ email, password });
  if (!res.body.token) {
    throw new Error(`Login failed for ${email}: ${res.body.message}`);
  }
  return res.body.token;
}

async function bootstrapAdmin() {
  const res = await request(app).post('/auth/register').send({
    firstName: 'Ava',
    lastName: 'Admin',
    email: 'admin@test.local',
    password: PASSWORD,
    role: 'Admin',
    department: 'Administration',
  });
  expect(res.status).toBe(201);
  const token = await loginAs('admin@test.local');
  return { user: res.body.user, token };
}

function authHeader(token) {
  return { Authorization: `Bearer ${token}` };
}

module.exports = {
  PASSWORD,
  createUser,
  loginAs,
  bootstrapAdmin,
  authHeader,
};

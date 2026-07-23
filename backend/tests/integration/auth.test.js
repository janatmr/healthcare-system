const request = require('supertest');
const app = require('../../app');
const {
  connectTestDB,
  clearCollections,
  closeTestDB,
} = require('../setup/mongo');
const {
  PASSWORD,
  createUser,
  loginAs,
  bootstrapAdmin,
  authHeader,
} = require('../helpers/auth');

describe('auth integration', () => {
  beforeAll(async () => {
    await connectTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  beforeEach(async () => {
    await clearCollections();
  });

  test('bootstrap admin register when users empty', async () => {
    const res = await request(app).post('/auth/register').send({
      firstName: 'Ava',
      lastName: 'Admin',
      email: 'admin@test.local',
      password: PASSWORD,
      role: 'Admin',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.user.email).toBe('admin@test.local');
    expect(res.body.user.role).toBe('Admin');
    expect(res.body.user.password).toBeUndefined();
  });

  test('login returns token', async () => {
    await bootstrapAdmin();
    const res = await request(app).post('/auth/login').send({
      email: 'admin@test.local',
      password: PASSWORD,
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.token).toBe('string');
    expect(res.body.user.role).toBe('Admin');
  });

  test('profile requires auth then returns user', async () => {
    const { token } = await bootstrapAdmin();

    const unauthorized = await request(app).get('/auth/profile');
    expect(unauthorized.status).toBe(401);

    const res = await request(app)
      .get('/auth/profile')
      .set(authHeader(token));

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('admin@test.local');
  });

  test('nurse cannot register staff', async () => {
    await bootstrapAdmin();
    const nurse = await createUser({
      email: 'nurse@test.local',
      role: 'Nurse',
    });
    const nurseToken = await loginAs(nurse.email);

    const res = await request(app)
      .post('/auth/register')
      .set(authHeader(nurseToken))
      .send({
        firstName: 'New',
        lastName: 'Doc',
        email: 'newdoc@test.local',
        password: PASSWORD,
        role: 'Doctor',
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
});

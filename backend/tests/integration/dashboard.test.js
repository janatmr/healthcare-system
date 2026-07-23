const request = require('supertest');
const app = require('../../app');
const Patient = require('../../models/Patient');
const {
  connectTestDB,
  clearCollections,
  closeTestDB,
} = require('../setup/mongo');
const { bootstrapAdmin, authHeader } = require('../helpers/auth');

describe('dashboard integration', () => {
  beforeAll(async () => {
    await connectTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  beforeEach(async () => {
    await clearCollections();
  });

  test('returns statistics shape; appointments default when client unreachable', async () => {
    const { token } = await bootstrapAdmin();
    await Patient.create({
      firstName: 'Pat',
      lastName: 'One',
      gender: 'Other',
      dateOfBirth: new Date('1992-02-02'),
      phone: '+15550002222',
      status: 'Stable',
    });

    const res = await request(app)
      .get('/dashboard/statistics')
      .set(authHeader(token));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({
      patients: {
        total: 1,
        byStatus: expect.objectContaining({
          Good: expect.any(Number),
          Stable: expect.any(Number),
          Critical: expect.any(Number),
        }),
      },
      records: {
        total: expect.any(Number),
        recent: expect.any(Array),
      },
      staff: {
        doctors: expect.any(Number),
        nurses: expect.any(Number),
        admins: expect.any(Number),
      },
      appointments: { today: 0, upcoming: 0 },
    });
  });
});

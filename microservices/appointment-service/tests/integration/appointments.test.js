const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../app');
const {
  connectTestDB,
  clearCollections,
  closeTestDB,
} = require('../setup/mongo');
const { signTestToken, authHeader } = require('../helpers/auth');

describe('appointments integration', () => {
  const doctorId = new mongoose.Types.ObjectId().toString();
  const patientId = new mongoose.Types.ObjectId().toString();
  let doctorToken;
  let nurseToken;
  let adminToken;

  beforeAll(async () => {
    await connectTestDB();
    doctorToken = signTestToken({ userId: doctorId, role: 'Doctor' });
    nurseToken = signTestToken({ role: 'Nurse' });
    adminToken = signTestToken({ role: 'Admin' });
  });

  afterAll(async () => {
    await closeTestDB();
  });

  beforeEach(async () => {
    await clearCollections();
  });

  const basePayload = {
    patientId,
    doctorId,
    appointmentDate: '2030-06-15',
    appointmentTime: '10:00',
    duration: 30,
    department: 'Cardiology',
  };

  test('creates appointment and lists it', async () => {
    const created = await request(app)
      .post('/appointments')
      .set(authHeader(doctorToken))
      .send(basePayload);

    expect(created.status).toBe(201);
    expect(created.body.success).toBe(true);
    expect(created.body.data.appointmentTime).toBe('10:00');

    const listed = await request(app)
      .get('/appointments')
      .set(authHeader(adminToken));

    expect(listed.status).toBe(200);
    expect(listed.body.data).toHaveLength(1);
  });

  test('overlap returns 409', async () => {
    await request(app)
      .post('/appointments')
      .set(authHeader(doctorToken))
      .send(basePayload);

    const conflict = await request(app)
      .post('/appointments')
      .set(authHeader(doctorToken))
      .send({
        ...basePayload,
        patientId: new mongoose.Types.ObjectId().toString(),
        appointmentTime: '10:15',
      });

    expect(conflict.status).toBe(409);
    expect(conflict.body.success).toBe(false);
  });

  test('status patch works', async () => {
    const created = await request(app)
      .post('/appointments')
      .set(authHeader(doctorToken))
      .send(basePayload);

    const id = created.body.data._id;
    const patched = await request(app)
      .patch(`/appointments/${id}/status`)
      .set(authHeader(doctorToken))
      .send({ status: 'Confirmed' });

    expect(patched.status).toBe(200);
    expect(patched.body.data.status).toBe('Confirmed');
  });

  test('nurse is forbidden on create', async () => {
    const res = await request(app)
      .post('/appointments')
      .set(authHeader(nurseToken))
      .send(basePayload);

    expect(res.status).toBe(403);
  });

  test('stats summary returns counts', async () => {
    await request(app)
      .post('/appointments')
      .set(authHeader(doctorToken))
      .send({
        ...basePayload,
        appointmentDate: new Date().toISOString(),
      });

    const res = await request(app)
      .get('/appointments/stats/summary')
      .set(authHeader(adminToken));

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(
      expect.objectContaining({
        today: expect.any(Number),
        upcoming: expect.any(Number),
      })
    );
    expect(res.body.data.today + res.body.data.upcoming).toBeGreaterThanOrEqual(1);
  });
});

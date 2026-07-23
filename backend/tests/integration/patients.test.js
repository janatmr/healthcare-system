const request = require('supertest');
const app = require('../../app');
const {
  connectTestDB,
  clearCollections,
  closeTestDB,
} = require('../setup/mongo');
const {
  createUser,
  loginAs,
  bootstrapAdmin,
  authHeader,
} = require('../helpers/auth');

const patientPayload = {
  firstName: 'Jamie',
  lastName: 'Rivera',
  gender: 'Female',
  dateOfBirth: '1990-05-12',
  phone: '+15551234567',
  email: 'jamie@example.com',
  bloodGroup: 'O+',
  status: 'Stable',
};

describe('patients integration', () => {
  let adminToken;
  let doctorToken;
  let nurseToken;

  beforeAll(async () => {
    await connectTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  beforeEach(async () => {
    await clearCollections();
    ({ token: adminToken } = await bootstrapAdmin());
    const doctor = await createUser({
      email: 'doctor@test.local',
      role: 'Doctor',
    });
    const nurse = await createUser({
      email: 'nurse@test.local',
      role: 'Nurse',
    });
    doctorToken = await loginAs(doctor.email);
    nurseToken = await loginAs(nurse.email);
  });

  test('CRUD + status patch', async () => {
    const created = await request(app)
      .post('/patients')
      .set(authHeader(doctorToken))
      .send(patientPayload);

    expect(created.status).toBe(201);
    expect(created.body.success).toBe(true);
    const id = created.body.data._id;

    const listed = await request(app)
      .get('/patients')
      .set(authHeader(adminToken));
    expect(listed.status).toBe(200);
    expect(listed.body.data).toHaveLength(1);

    const fetched = await request(app)
      .get(`/patients/${id}`)
      .set(authHeader(nurseToken));
    expect(fetched.status).toBe(200);
    expect(fetched.body.data.firstName).toBe('Jamie');

    const updated = await request(app)
      .put(`/patients/${id}`)
      .set(authHeader(doctorToken))
      .send({ ...patientPayload, address: '12 Care St' });
    expect(updated.status).toBe(200);
    expect(updated.body.data.address).toBe('12 Care St');

    const status = await request(app)
      .patch(`/patients/${id}/status`)
      .set(authHeader(nurseToken))
      .send({ status: 'Critical' });
    expect(status.status).toBe(200);
    expect(status.body.data.status).toBe('Critical');

    const deleted = await request(app)
      .delete(`/patients/${id}`)
      .set(authHeader(adminToken));
    expect(deleted.status).toBe(200);

    const missing = await request(app)
      .get(`/patients/${id}`)
      .set(authHeader(adminToken));
    expect(missing.status).toBe(404);
  });

  test('nurse is forbidden on create', async () => {
    const res = await request(app)
      .post('/patients')
      .set(authHeader(nurseToken))
      .send(patientPayload);

    expect(res.status).toBe(403);
  });
});

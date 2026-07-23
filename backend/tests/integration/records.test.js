const request = require('supertest');
const app = require('../../app');
const Patient = require('../../models/Patient');
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

describe('records integration', () => {
  let adminToken;
  let doctorToken;
  let nurseToken;
  let patientId;

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

    const patient = await Patient.create({
      firstName: 'Sam',
      lastName: 'Lee',
      gender: 'Male',
      dateOfBirth: new Date('1985-01-01'),
      phone: '+15550001111',
      status: 'Good',
    });
    patientId = patient._id.toString();
  });

  test('create, list, delete', async () => {
    const created = await request(app)
      .post('/records')
      .set(authHeader(doctorToken))
      .send({
        patientId,
        diagnosis: 'Hypertension',
        medication: ['Lisinopril'],
        doctorNotes: 'Monitor BP',
      });

    expect(created.status).toBe(201);
    expect(created.body.data.diagnosis).toBe('Hypertension');
    const id = created.body.data._id;

    const listed = await request(app)
      .get('/records')
      .set(authHeader(adminToken));
    expect(listed.status).toBe(200);
    expect(listed.body.data).toHaveLength(1);

    const deleted = await request(app)
      .delete(`/records/${id}`)
      .set(authHeader(adminToken));
    expect(deleted.status).toBe(200);
  });

  test('nurse is forbidden on create', async () => {
    const res = await request(app)
      .post('/records')
      .set(authHeader(nurseToken))
      .send({
        patientId,
        diagnosis: 'Cold',
      });

    expect(res.status).toBe(403);
  });
});

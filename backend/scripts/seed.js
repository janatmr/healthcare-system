/**
 * Repeatable database seed for local development.
 * Drops target collections then inserts fixed counts of realistic data.
 */
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const User = require('../models/User');
const Patient = require('../models/Patient');
const MedicalRecord = require('../models/MedicalRecord');

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/healthcare';
const DEFAULT_PASSWORD = 'Password123!';

const FIRST_NAMES = [
  'Amina', 'James', 'Sofia', 'Omar', 'Elena', 'Noah', 'Layla', 'Ethan',
  'Maya', 'Lucas', 'Sara', 'Daniel', 'Nora', 'Adam', 'Hana', 'Leo',
  'Yara', 'Mason', 'Rania', 'Ibrahim',
];
const LAST_NAMES = [
  'Hassan', 'Carter', 'Nguyen', 'Patel', 'Brooks', 'Ali', 'Kim', 'Garcia',
  'Wright', 'Chen', 'Murphy', 'Singh', 'Lopez', 'Khan', 'Baker', 'Costa',
  'Reed', 'Diaz', 'Foster', 'Quinn',
];
const DIAGNOSES = [
  'Hypertension', 'Type 2 Diabetes', 'Asthma', 'Migraine', 'Anemia',
  'Lower back pain', 'Seasonal allergies', 'GERD', 'Anxiety disorder',
  'Bronchitis', 'Hyperlipidemia', 'Osteoarthritis', 'UTI', 'Sinusitis',
  'Hypothyroidism', 'Dermatitis', 'Pneumonia', 'Chest pain evaluation',
  'Post-op follow-up', 'Routine wellness exam',
];
const DEPARTMENTS = [
  'Cardiology', 'Internal Medicine', 'Pulmonology', 'Neurology', 'Orthopedics',
];
const STATUSES = ['Good', 'Stable', 'Critical'];
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const GENDERS = ['Male', 'Female', 'Other'];

function startOfUtcDay(offsetDays = 0) {
  const d = new Date();
  const day = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  day.setUTCDate(day.getUTCDate() + offsetDays);
  return day;
}

async function seed() {
  console.log(`Connecting to ${MONGODB_URI}`);
  await mongoose.connect(MONGODB_URI);

  const collections = ['users', 'patients', 'medicalrecords', 'appointments'];
  for (const name of collections) {
    try {
      await mongoose.connection.collection(name).deleteMany({});
    } catch {
      // Collection may not exist yet
    }
  }
  console.log('Cleared collections:', collections.join(', '));

  const admin = await User.create({
    firstName: 'Ava',
    lastName: 'Admin',
    email: 'admin@hospital.local',
    password: DEFAULT_PASSWORD,
    role: 'Admin',
    department: 'Administration',
  });

  const doctors = [];
  for (let n = 1; n <= 3; n += 1) {
    doctors.push(
      await User.create({
        firstName: ['Grace', 'Marcus', 'Priya'][n - 1],
        lastName: ['Chen', 'Hall', 'Shah'][n - 1],
        email: `doctor${n}@hospital.local`,
        password: DEFAULT_PASSWORD,
        role: 'Doctor',
        department: DEPARTMENTS[n - 1],
      })
    );
  }

  const nurses = [];
  for (const nurse of [
    {
      firstName: 'Nina',
      lastName: 'Brooks',
      email: 'nurse1@hospital.local',
      password: DEFAULT_PASSWORD,
      role: 'Nurse',
      department: 'Ward A',
    },
    {
      firstName: 'Theo',
      lastName: 'Ng',
      email: 'nurse2@hospital.local',
      password: DEFAULT_PASSWORD,
      role: 'Nurse',
      department: 'Ward B',
    },
  ]) {
    nurses.push(await User.create(nurse));
  }

  const patients = [];
  for (let i = 0; i < 20; i += 1) {
    patients.push({
      firstName: FIRST_NAMES[i],
      lastName: LAST_NAMES[i],
      gender: GENDERS[i % GENDERS.length],
      dateOfBirth: new Date(1965 + (i % 40), i % 12, (i % 27) + 1),
      phone: `+1555001${String(i).padStart(4, '0')}`,
      email: `patient${i + 1}@example.com`,
      address: `${100 + i} Health Ave`,
      bloodGroup: BLOOD_GROUPS[i % BLOOD_GROUPS.length],
      emergencyContact: {
        name: `Contact ${FIRST_NAMES[i]}`,
        phone: `+1555002${String(i).padStart(4, '0')}`,
        relationship: i % 2 === 0 ? 'Spouse' : 'Sibling',
      },
      allergies: i % 3 === 0 ? ['Penicillin'] : [],
      medicalConditions: i % 4 === 0 ? ['Hypertension'] : [],
      status: STATUSES[i % STATUSES.length],
    });
  }
  const createdPatients = await Patient.insertMany(patients);

  const records = [];
  for (let i = 0; i < 20; i += 1) {
    const doctor = doctors[i % doctors.length];
    records.push({
      patientId: createdPatients[i]._id,
      diagnosis: DIAGNOSES[i],
      medication: i % 2 === 0 ? ['Lisinopril 10mg'] : ['Albuterol inhaler'],
      prescriptions: [`Rx-${1000 + i}`],
      referrals: i % 5 === 0 ? ['Cardiology'] : [],
      doctorNotes: `Follow-up recommended for ${DIAGNOSES[i].toLowerCase()}.`,
      createdBy: doctor._id,
      visitDate: startOfUtcDay(-i),
    });
  }
  await MedicalRecord.insertMany(records);

  const appointments = [];
  for (let i = 0; i < 15; i += 1) {
    const doctor = doctors[i % doctors.length];
    const hour = 9 + Math.floor(i / 3);
    const minute = (i % 3) * 20;
    appointments.push({
      patientId: createdPatients[i]._id,
      doctorId: doctor._id,
      appointmentDate: startOfUtcDay(i % 5),
      appointmentTime: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
      duration: 20,
      department: doctor.department || DEPARTMENTS[i % DEPARTMENTS.length],
      status: ['Pending', 'Confirmed', 'Completed'][i % 3],
      notes: `Seeded visit ${i + 1}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
  await mongoose.connection.collection('appointments').insertMany(appointments);

  const counts = {
    admins: 1,
    doctors: doctors.length,
    nurses: nurses.length,
    patients: createdPatients.length,
    medicalRecords: records.length,
    appointments: appointments.length,
  };

  console.log('Seed complete:', counts);
  console.log('');
  console.log('Default password for all seeded users:', DEFAULT_PASSWORD);
  console.log('  admin@hospital.local (Admin)');
  console.log('  doctor1@hospital.local … doctor3@hospital.local (Doctor)');
  console.log('  nurse1@hospital.local, nurse2@hospital.local (Nurse)');
  console.log(`  Admin id: ${admin._id}`);

  await mongoose.connection.close();
}

seed().catch(async (err) => {
  console.error('Seed failed:', err.message);
  try {
    await mongoose.connection.close();
  } catch {
    // ignore
  }
  process.exit(1);
});

const Patient = require('../models/Patient');
const AppError = require('../utils/AppError');
const {
  getPagination,
  buildPaginationMeta,
} = require('../utils/pagination');

async function listPatients(query) {
  const { page, limit, skip, sort } = getPagination({
    ...query,
    sort: query.sort || '-createdAt',
  });

  const filter = {};

  if (query.status) {
    filter.status = query.status;
  }

  if (query.search && String(query.search).trim()) {
    const term = String(query.search).trim();
    const regex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [
      { firstName: regex },
      { lastName: regex },
      { phone: regex },
      { email: regex },
    ];
  }

  const [data, total] = await Promise.all([
    Patient.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    Patient.countDocuments(filter),
  ]);

  return {
    data,
    pagination: buildPaginationMeta(page, limit, total),
  };
}

async function getPatientById(id) {
  const patient = await Patient.findById(id);
  if (!patient) {
    throw new AppError('Patient not found', 404);
  }
  return patient;
}

async function createPatient(payload) {
  try {
    const patient = await Patient.create(payload);
    return patient;
  } catch (err) {
    if (err.code === 11000) {
      throw new AppError('Patient with this email already exists', 409);
    }
    throw err;
  }
}

async function updatePatient(id, payload) {
  try {
    const patient = await Patient.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    });

    if (!patient) {
      throw new AppError('Patient not found', 404);
    }

    return patient;
  } catch (err) {
    if (err.code === 11000) {
      throw new AppError('Patient with this email already exists', 409);
    }
    throw err;
  }
}

async function updatePatientStatus(id, status) {
  const patient = await Patient.findByIdAndUpdate(
    id,
    { status },
    { new: true, runValidators: true }
  );

  if (!patient) {
    throw new AppError('Patient not found', 404);
  }

  return patient;
}

async function deletePatient(id) {
  const patient = await Patient.findByIdAndDelete(id);
  if (!patient) {
    throw new AppError('Patient not found', 404);
  }
  return patient;
}

module.exports = {
  listPatients,
  getPatientById,
  createPatient,
  updatePatient,
  updatePatientStatus,
  deletePatient,
};

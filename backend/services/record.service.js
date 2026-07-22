const MedicalRecord = require('../models/MedicalRecord');
const Patient = require('../models/Patient');
const AppError = require('../utils/AppError');
const {
  getPagination,
  buildPaginationMeta,
} = require('../utils/pagination');

const POPULATE = [
  { path: 'patientId', select: 'firstName lastName status' },
  { path: 'createdBy', select: 'firstName lastName role' },
];

async function listRecords(query) {
  const { page, limit, skip, sort } = getPagination({
    ...query,
    sort: query.sort || '-visitDate',
  });

  const filter = {};
  if (query.patientId) {
    filter.patientId = query.patientId;
  }

  const [data, total] = await Promise.all([
    MedicalRecord.find(filter)
      .populate(POPULATE)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    MedicalRecord.countDocuments(filter),
  ]);

  return {
    data,
    pagination: buildPaginationMeta(page, limit, total),
  };
}

async function getRecordById(id) {
  const record = await MedicalRecord.findById(id).populate(POPULATE);
  if (!record) {
    throw new AppError('Medical record not found', 404);
  }
  return record;
}

async function createRecord(payload, userId) {
  const patient = await Patient.findById(payload.patientId);
  if (!patient) {
    throw new AppError('Patient not found', 404);
  }

  const record = await MedicalRecord.create({
    ...payload,
    createdBy: userId,
  });

  return MedicalRecord.findById(record._id).populate(POPULATE);
}

async function updateRecord(id, payload) {
  if (payload.patientId) {
    const patient = await Patient.findById(payload.patientId);
    if (!patient) {
      throw new AppError('Patient not found', 404);
    }
  }

  // Never allow client to reassign authorship
  const safePayload = { ...payload };
  delete safePayload.createdBy;

  const record = await MedicalRecord.findByIdAndUpdate(id, safePayload, {
    new: true,
    runValidators: true,
  }).populate(POPULATE);

  if (!record) {
    throw new AppError('Medical record not found', 404);
  }

  return record;
}

async function deleteRecord(id) {
  const record = await MedicalRecord.findByIdAndDelete(id);
  if (!record) {
    throw new AppError('Medical record not found', 404);
  }
  return record;
}

module.exports = {
  listRecords,
  getRecordById,
  createRecord,
  updateRecord,
  deleteRecord,
};

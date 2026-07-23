const Patient = require('../models/Patient');
const MedicalRecord = require('../models/MedicalRecord');
const User = require('../models/User');
const { getAppointmentStats } = require('./appointmentClient');

async function getStatistics(authorizationHeader) {
  const [
    patientTotal,
    statusAgg,
    recordTotal,
    recentRecords,
    doctorCount,
    nurseCount,
    adminCount,
    appointments,
  ] = await Promise.all([
    Patient.countDocuments(),
    Patient.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    MedicalRecord.countDocuments(),
    MedicalRecord.find()
      .sort('-visitDate')
      .limit(5)
      .populate([
        { path: 'patientId', select: 'firstName lastName status' },
        { path: 'createdBy', select: 'firstName lastName role' },
      ])
      .lean(),
    User.countDocuments({ role: 'Doctor', active: true }),
    User.countDocuments({ role: 'Nurse', active: true }),
    User.countDocuments({ role: 'Admin', active: true }),
    getAppointmentStats(authorizationHeader),
  ]);

  const byStatus = { Good: 0, Stable: 0, Critical: 0 };
  for (const row of statusAgg) {
    if (row._id && Object.prototype.hasOwnProperty.call(byStatus, row._id)) {
      byStatus[row._id] = row.count;
    }
  }

  return {
    patients: {
      total: patientTotal,
      byStatus,
    },
    records: {
      total: recordTotal,
      recent: recentRecords,
    },
    staff: {
      doctors: doctorCount,
      nurses: nurseCount,
      admins: adminCount,
    },
    appointments,
  };
}

module.exports = {
  getStatistics,
};

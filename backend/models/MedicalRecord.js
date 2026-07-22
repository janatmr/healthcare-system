const mongoose = require('mongoose');

const labResultSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, required: true },
    value: { type: String, trim: true, default: '' },
    unit: { type: String, trim: true, default: '' },
    date: { type: Date, default: Date.now },
  },
  { _id: false }
);

const medicalRecordSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: [true, 'Patient reference is required'],
    },
    diagnosis: {
      type: String,
      required: [true, 'Diagnosis is required'],
      trim: true,
    },
    medication: {
      type: [String],
      default: [],
    },
    labResults: {
      type: [labResultSchema],
      default: [],
    },
    prescriptions: {
      type: [String],
      default: [],
    },
    referrals: {
      type: [String],
      default: [],
    },
    doctorNotes: {
      type: String,
      trim: true,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Created-by user reference is required'],
    },
    visitDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

medicalRecordSchema.index({ patientId: 1 });
medicalRecordSchema.index({ patientId: 1, visitDate: -1 });
medicalRecordSchema.index({ createdBy: 1 });

const MedicalRecord = mongoose.model('MedicalRecord', medicalRecordSchema);

module.exports = MedicalRecord;

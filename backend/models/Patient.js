const mongoose = require('mongoose');

const GENDERS = ['Male', 'Female', 'Other'];
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const STATUSES = ['Good', 'Stable', 'Critical'];

const emergencyContactSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, default: '' },
    phone: { type: String, trim: true, default: '' },
    relationship: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const patientSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
    },
    gender: {
      type: String,
      enum: {
        values: GENDERS,
        message: 'Gender must be Male, Female, or Other',
      },
      required: [true, 'Gender is required'],
    },
    dateOfBirth: {
      type: Date,
      required: [true, 'Date of birth is required'],
    },
    phone: {
      type: String,
      required: [true, 'Phone is required'],
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: undefined,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
    bloodGroup: {
      type: String,
      enum: {
        values: BLOOD_GROUPS,
        message: 'Invalid blood group',
      },
    },
    emergencyContact: {
      type: emergencyContactSchema,
      default: () => ({}),
    },
    allergies: {
      type: [String],
      default: [],
    },
    medicalConditions: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: {
        values: STATUSES,
        message: 'Status must be Good, Stable, or Critical',
      },
      default: 'Good',
    },
  },
  {
    timestamps: true,
  }
);

patientSchema.index({ phone: 1 });
patientSchema.index({ email: 1 }, { unique: true, sparse: true });
patientSchema.index({ status: 1 });
patientSchema.index({ lastName: 1, firstName: 1 });

const Patient = mongoose.model('Patient', patientSchema);

module.exports = Patient;
module.exports.GENDERS = GENDERS;
module.exports.BLOOD_GROUPS = BLOOD_GROUPS;
module.exports.STATUSES = STATUSES;

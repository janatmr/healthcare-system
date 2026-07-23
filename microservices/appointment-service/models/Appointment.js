const mongoose = require('mongoose');

const STATUSES = ['Pending', 'Confirmed', 'Cancelled', 'Completed'];

const appointmentSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'patientId is required'],
      index: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'doctorId is required'],
      index: true,
    },
    appointmentDate: {
      type: Date,
      required: [true, 'appointmentDate is required'],
    },
    appointmentTime: {
      type: String,
      required: [true, 'appointmentTime is required'],
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'appointmentTime must be HH:mm'],
    },
    duration: {
      type: Number,
      default: 30,
      min: [5, 'duration must be at least 5 minutes'],
    },
    department: {
      type: String,
      required: [true, 'department is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: STATUSES,
        message: `status must be one of: ${STATUSES.join(', ')}`,
      },
      default: 'Pending',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

appointmentSchema.index({ doctorId: 1, appointmentDate: 1 });
appointmentSchema.index({ patientId: 1, appointmentDate: 1 });
appointmentSchema.index({ status: 1 });

const Appointment = mongoose.model('Appointment', appointmentSchema);

module.exports = Appointment;
module.exports.STATUSES = STATUSES;

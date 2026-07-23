const Appointment = require('../models/Appointment');
const AppError = require('../utils/AppError');
const {
  getPagination,
  buildPaginationMeta,
} = require('../utils/pagination');
const { timeToMinutes, rangesOverlap } = require('../utils/availability');

function startOfUtcDay(date) {
  const d = new Date(date);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

async function assertAvailability({
  doctorId,
  appointmentDate,
  appointmentTime,
  duration,
  excludeId,
}) {
  const day = startOfUtcDay(appointmentDate);
  const nextDay = new Date(day);
  nextDay.setUTCDate(nextDay.getUTCDate() + 1);

  const filter = {
    doctorId,
    status: { $ne: 'Cancelled' },
    appointmentDate: { $gte: day, $lt: nextDay },
  };

  if (excludeId) {
    filter._id = { $ne: excludeId };
  }

  const existing = await Appointment.find(filter).lean();
  const start = timeToMinutes(appointmentTime);
  const dur = duration || 30;

  for (const appt of existing) {
    if (
      rangesOverlap(
        start,
        dur,
        timeToMinutes(appt.appointmentTime),
        appt.duration || 30
      )
    ) {
      throw new AppError('Doctor is not available at the requested time', 409);
    }
  }
}

function buildListFilter(query) {
  const filter = {};

  if (query.status) {
    filter.status = query.status;
  }
  if (query.doctorId) {
    filter.doctorId = query.doctorId;
  }
  if (query.patientId) {
    filter.patientId = query.patientId;
  }
  if (query.date) {
    const day = startOfUtcDay(query.date);
    const nextDay = new Date(day);
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);
    filter.appointmentDate = { $gte: day, $lt: nextDay };
  }

  return filter;
}

async function listAppointments(query) {
  const { page, limit, skip, sort } = getPagination(query);
  const filter = buildListFilter(query);

  const [data, total] = await Promise.all([
    Appointment.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    Appointment.countDocuments(filter),
  ]);

  return {
    data,
    pagination: buildPaginationMeta(page, limit, total),
  };
}

async function listByDoctor(doctorId, query) {
  return listAppointments({ ...query, doctorId });
}

async function listByPatient(patientId, query) {
  return listAppointments({ ...query, patientId });
}

async function getById(id) {
  const appointment = await Appointment.findById(id);
  if (!appointment) {
    throw new AppError('Appointment not found', 404);
  }
  return appointment;
}

async function createAppointment(payload) {
  const duration = payload.duration || 30;
  const day = startOfUtcDay(payload.appointmentDate);

  await assertAvailability({
    doctorId: payload.doctorId,
    appointmentDate: day,
    appointmentTime: payload.appointmentTime,
    duration,
  });

  return Appointment.create({
    ...payload,
    appointmentDate: day,
    duration,
  });
}

async function updateAppointment(id, payload) {
  const existing = await Appointment.findById(id);
  if (!existing) {
    throw new AppError('Appointment not found', 404);
  }

  const next = {
    doctorId: payload.doctorId ?? existing.doctorId,
    appointmentDate: payload.appointmentDate
      ? startOfUtcDay(payload.appointmentDate)
      : existing.appointmentDate,
    appointmentTime: payload.appointmentTime ?? existing.appointmentTime,
    duration: payload.duration ?? existing.duration,
    status: payload.status ?? existing.status,
  };

  if (next.status !== 'Cancelled') {
    await assertAvailability({
      doctorId: next.doctorId,
      appointmentDate: next.appointmentDate,
      appointmentTime: next.appointmentTime,
      duration: next.duration,
      excludeId: id,
    });
  }

  Object.assign(existing, payload, {
    appointmentDate: next.appointmentDate,
  });

  await existing.save();
  return existing;
}

async function updateStatus(id, status) {
  const appointment = await Appointment.findById(id);
  if (!appointment) {
    throw new AppError('Appointment not found', 404);
  }

  if (status !== 'Cancelled') {
    await assertAvailability({
      doctorId: appointment.doctorId,
      appointmentDate: appointment.appointmentDate,
      appointmentTime: appointment.appointmentTime,
      duration: appointment.duration,
      excludeId: id,
    });
  }

  appointment.status = status;
  await appointment.save();
  return appointment;
}

async function deleteAppointment(id) {
  const appointment = await Appointment.findByIdAndDelete(id);
  if (!appointment) {
    throw new AppError('Appointment not found', 404);
  }
  return appointment;
}

async function getSummaryStats() {
  const today = startOfUtcDay(new Date());
  const tomorrow = new Date(today);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

  const active = { status: { $ne: 'Cancelled' } };

  const [todayCount, upcomingCount] = await Promise.all([
    Appointment.countDocuments({
      ...active,
      appointmentDate: { $gte: today, $lt: tomorrow },
    }),
    Appointment.countDocuments({
      ...active,
      appointmentDate: { $gte: tomorrow },
    }),
  ]);

  return {
    today: todayCount,
    upcoming: upcomingCount,
  };
}

module.exports = {
  listAppointments,
  listByDoctor,
  listByPatient,
  getById,
  createAppointment,
  updateAppointment,
  updateStatus,
  deleteAppointment,
  getSummaryStats,
};

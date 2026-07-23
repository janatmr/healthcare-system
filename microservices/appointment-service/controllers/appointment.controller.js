const appointmentService = require('../services/appointment.service');

async function list(req, res, next) {
  try {
    const result = await appointmentService.listAppointments(req.query);
    res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (err) {
    next(err);
  }
}

async function listByDoctor(req, res, next) {
  try {
    const result = await appointmentService.listByDoctor(
      req.params.doctorId,
      req.query
    );
    res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (err) {
    next(err);
  }
}

async function listByPatient(req, res, next) {
  try {
    const result = await appointmentService.listByPatient(
      req.params.patientId,
      req.query
    );
    res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const appointment = await appointmentService.getById(req.params.id);
    res.status(200).json({
      success: true,
      data: appointment,
    });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const appointment = await appointmentService.createAppointment(req.body);
    res.status(201).json({
      success: true,
      data: appointment,
    });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const appointment = await appointmentService.updateAppointment(
      req.params.id,
      req.body
    );
    res.status(200).json({
      success: true,
      data: appointment,
    });
  } catch (err) {
    next(err);
  }
}

async function updateStatus(req, res, next) {
  try {
    const appointment = await appointmentService.updateStatus(
      req.params.id,
      req.body.status
    );
    res.status(200).json({
      success: true,
      data: appointment,
    });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await appointmentService.deleteAppointment(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Appointment deleted successfully',
    });
  } catch (err) {
    next(err);
  }
}

async function summary(req, res, next) {
  try {
    const data = await appointmentService.getSummaryStats();
    res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  list,
  listByDoctor,
  listByPatient,
  getById,
  create,
  update,
  updateStatus,
  remove,
  summary,
};

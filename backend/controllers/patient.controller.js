const patientService = require('../services/patient.service');

async function list(req, res, next) {
  try {
    const result = await patientService.listPatients(req.query);
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
    const patient = await patientService.getPatientById(req.params.id);
    res.status(200).json({
      success: true,
      data: patient,
    });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const patient = await patientService.createPatient(req.body);
    res.status(201).json({
      success: true,
      data: patient,
    });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const patient = await patientService.updatePatient(req.params.id, req.body);
    res.status(200).json({
      success: true,
      data: patient,
    });
  } catch (err) {
    next(err);
  }
}

async function updateStatus(req, res, next) {
  try {
    const patient = await patientService.updatePatientStatus(
      req.params.id,
      req.body.status
    );
    res.status(200).json({
      success: true,
      data: patient,
    });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await patientService.deletePatient(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Patient deleted successfully',
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  list,
  getById,
  create,
  update,
  updateStatus,
  remove,
};

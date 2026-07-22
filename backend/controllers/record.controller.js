const recordService = require('../services/record.service');

async function list(req, res, next) {
  try {
    const result = await recordService.listRecords(req.query);
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
    const record = await recordService.getRecordById(req.params.id);
    res.status(200).json({
      success: true,
      data: record,
    });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const record = await recordService.createRecord(req.body, req.user._id);
    res.status(201).json({
      success: true,
      data: record,
    });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const record = await recordService.updateRecord(req.params.id, req.body);
    res.status(200).json({
      success: true,
      data: record,
    });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await recordService.deleteRecord(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Medical record deleted successfully',
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
  remove,
};

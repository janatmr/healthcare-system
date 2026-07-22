const dashboardService = require('../services/dashboard.service');

async function getStatistics(req, res, next) {
  try {
    const data = await dashboardService.getStatistics();
    res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getStatistics,
};

const config = require('../config');
const logger = require('../utils/logger');

const DEFAULT_STATS = { today: 0, upcoming: 0 };
const TIMEOUT_MS = 3000;

/**
 * Fetch appointment summary stats from the appointment microservice.
 * Failures are non-fatal so the dashboard remains available.
 */
async function getAppointmentStats(authorizationHeader) {
  const url = `${config.appointmentServiceUrl}/appointments/stats/summary`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const headers = {
      Accept: 'application/json',
    };

    if (authorizationHeader) {
      headers.Authorization = authorizationHeader;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers,
      signal: controller.signal,
    });

    if (!response.ok) {
      logger.warn('Appointment service stats request failed', {
        statusCode: response.status,
      });
      return { ...DEFAULT_STATS };
    }

    const body = await response.json();
    const today = Number(body?.data?.today);
    const upcoming = Number(body?.data?.upcoming);

    return {
      today: Number.isFinite(today) ? today : 0,
      upcoming: Number.isFinite(upcoming) ? upcoming : 0,
    };
  } catch (err) {
    logger.warn('Appointment service unreachable', {
      message: err.message,
    });
    return { ...DEFAULT_STATS };
  } finally {
    clearTimeout(timer);
  }
}

module.exports = {
  getAppointmentStats,
};

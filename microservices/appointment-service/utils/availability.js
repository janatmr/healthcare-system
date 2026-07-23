/**
 * Pure helpers for appointment slot overlap checks.
 */

function timeToMinutes(time) {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function rangesOverlap(startA, durationA, startB, durationB) {
  const endA = startA + durationA;
  const endB = startB + durationB;
  return startA < endB && startB < endA;
}

module.exports = {
  timeToMinutes,
  rangesOverlap,
};

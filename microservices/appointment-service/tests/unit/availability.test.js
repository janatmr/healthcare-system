const {
  timeToMinutes,
  rangesOverlap,
} = require('../../utils/availability');

describe('availability helpers', () => {
  test('timeToMinutes converts HH:mm', () => {
    expect(timeToMinutes('00:00')).toBe(0);
    expect(timeToMinutes('09:30')).toBe(9 * 60 + 30);
    expect(timeToMinutes('23:59')).toBe(23 * 60 + 59);
  });

  test('rangesOverlap detects overlapping slots', () => {
    expect(rangesOverlap(9 * 60, 30, 9 * 60 + 15, 30)).toBe(true);
    expect(rangesOverlap(9 * 60, 30, 9 * 60 + 30, 30)).toBe(false);
    expect(rangesOverlap(9 * 60 + 30, 30, 9 * 60, 45)).toBe(true);
    expect(rangesOverlap(11 * 60, 30, 9 * 60, 30)).toBe(false);
  });
});

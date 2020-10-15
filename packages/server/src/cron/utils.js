'use strict';
/**
 * @param {string} schedule
 * @return {string}
 */
function normalizeCronSchedule(schedule) {
  if (typeof schedule !== 'string') {
    throw new Error(`Schedule must be provided`);
  }

  if (process.env.OVERRIDE_SCHEDULE_FOR_TEST) {
    return process.env.OVERRIDE_SCHEDULE_FOR_TEST;
  }

  const parts = schedule.split(/\s+/).filter(Boolean);
  if (parts.length !== 5) {
    throw new Error(`Invalid cron format, expected <minutes> <hours> <day> <month> <day of week>`);
  }

  if (parts[0] === '*') {
    throw new Error(`Cron schedule "${schedule}" is too frequent`);
  }

  return ['0', ...parts].join(' ');
}
module.exports = {normalizeCronSchedule};

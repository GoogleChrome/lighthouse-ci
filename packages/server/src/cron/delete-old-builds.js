'use strict';

const {CronJob} = require('cron');
const {normalizeCronSchedule} = require('./utils');

/**
 * @param {LHCI.ServerCommand.StorageMethod} storageMethod
 * @param {number} range
 * @param {Date} now
 * @return {Promise<void>}
 */
async function deleteOldBuilds(storageMethod, range, now = new Date()) {
  if (!range || !Number.isInteger(range) || range <= 0) {
    throw new Error('Invalid range');
  }

  const runAt = new Date(now.setDate(now.getDate() + range));
  const oldBuilds = await storageMethod.findOldBuilds(runAt);
  for (const {projectId, id} of oldBuilds) {
    await storageMethod.deleteBuild(projectId, id);
  }
}

/**
 * @param {LHCI.ServerCommand.StorageMethod} storageMethod
 * @param {LHCI.ServerCommand.Options} options
 * @return {void}
 */
function startDeletingOldBuildsCron(storageMethod, options) {
  if (options.storage.storageMethod !== 'sql' || !options.storage.deleteOldBuilds) {
    return;
  }

  if (!options.storage.deleteOldBuilds.schedule || !options.storage.deleteOldBuilds.dateRange) {
    throw new Error('Cannot configure schedule');
  }

  const log =
    options.logLevel === 'silent'
      ? () => {}
      : msg => process.stdout.write(`${new Date().toISOString()} - ${msg}\n`);

  let inProgress = false;

  const {schedule, dateRange} = options.storage.deleteOldBuilds;

  const cron = new CronJob(normalizeCronSchedule(schedule), () => {
    if (inProgress) {
      log(`Deleting old builds still in progress. Skipping...`);
      return;
    }
    inProgress = true;
    log(`Starting delete old builds`);
    deleteOldBuilds(storageMethod, dateRange, new Date())
      .then(() => {
        log(`Successfully delete old builds`);
      })
      .catch(err => {
        log(`Delete old builds failure: ${err.message}`);
      })
      .finally(() => {
        inProgress = false;
      });
  });
  cron.start();
}
module.exports = {startDeletingOldBuildsCron, deleteOldBuilds};

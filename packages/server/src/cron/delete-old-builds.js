/**
 * @license Copyright 2020 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

'use strict';

const {CronJob} = require('cron');
const {normalizeCronSchedule} = require('./utils');

/**
 * @param {LHCI.ServerCommand.StorageMethod} storageMethod
 * @param {number} maxAgeInDays
 * @param {Date} now
 * @return {Promise<void>}
 */
async function deleteOldBuilds(storageMethod, maxAgeInDays, now = new Date()) {
  if (!maxAgeInDays || !Number.isInteger(maxAgeInDays) || maxAgeInDays <= 0) {
    throw new Error('Invalid range');
  }

  const DAY_IN_MS = 24 * 60 * 60 * 1000;
  const cutoffTime = new Date(Date.now() - maxAgeInDays * DAY_IN_MS);
  const oldBuilds = await storageMethod.findBuildsBeforeTimestamp(cutoffTime);
  for (const {projectId, id} of oldBuilds) {
    await storageMethod.deleteBuild(projectId, id);
  }
}

/**
 * @param {LHCI.ServerCommand.StorageMethod} storageMethod
 * @param {LHCI.ServerCommand.Options} options
 * @return {void}
 */
function startDeleteOldBuildsCron(storageMethod, options) {
  if (options.storage.storageMethod !== 'sql' || !options.deleteOldBuildsCron) {
    return;
  }

  if (!options.deleteOldBuildsCron.schedule || !options.deleteOldBuildsCron.maxAgeInDays) {
    throw new Error('Cannot configure schedule');
  }

  const log =
    options.logLevel === 'silent'
      ? () => {}
      : msg => process.stdout.write(`${new Date().toISOString()} - ${msg}\n`);

  let inProgress = false;

  const {schedule, maxAgeInDays} = options.deleteOldBuildsCron;

  const cron = new CronJob(normalizeCronSchedule(schedule), () => {
    if (inProgress) {
      log(`Deleting old builds still in progress. Skipping...`);
      return;
    }
    inProgress = true;
    log(`Starting delete old builds`);
    deleteOldBuilds(storageMethod, maxAgeInDays, new Date())
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
module.exports = {startDeleteOldBuildsCron, deleteOldBuilds};

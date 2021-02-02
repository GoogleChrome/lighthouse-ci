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
 * @param {string[] | null} skipBranches
 * @param {string[] | null} onlyBranches
 * @return {Promise<void>}
 */
async function deleteOldBuilds(storageMethod, maxAgeInDays, skipBranches, onlyBranches) {
  if (!maxAgeInDays || !Number.isInteger(maxAgeInDays) || maxAgeInDays <= 0) {
    throw new Error('Invalid range');
  }

  const DAY_IN_MS = 24 * 60 * 60 * 1000;
  const cutoffTime = new Date(Date.now() - maxAgeInDays * DAY_IN_MS);
  const oldBuilds = (await storageMethod.findBuildsBeforeTimestamp(cutoffTime)).filter(
    ({branch}) => {
      if (Array.isArray(skipBranches) && skipBranches.includes(branch)) {
        return false;
      }
      if (Array.isArray(onlyBranches) && !onlyBranches.includes(branch)) return false;

      return true;
    }
  );

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

  /** @type {(s: string) => void} */
  const log =
    options.logLevel === 'silent'
      ? () => {}
      : msg => process.stdout.write(`${new Date().toISOString()} - ${msg}\n`);

  /**
   *
   * @type {LHCI.ServerCommand.DeleteOldBuildsCron[]}
   */
  const cronConfig = Array.isArray(options.deleteOldBuildsCron)
    ? options.deleteOldBuildsCron
    : [options.deleteOldBuildsCron];

  cronConfig.forEach((config, index) => {
    if (!config.schedule || !config.maxAgeInDays) {
      throw new Error(
        `Can't configure schedule because you didn't specify 'schedule' field or 'maxAgeInDays' field in item with index: ${index}`
      );
    }

    runCronJob(storageMethod, log, config);
  });
}

/**
 *
 * @param {LHCI.ServerCommand.StorageMethod} storageMethod
 * @param {(s: string) => void} log
 * @param {LHCI.ServerCommand.DeleteOldBuildsCron} cronConfig
 */
function runCronJob(storageMethod, log, cronConfig) {
  let inProgress = false;

  const {schedule, maxAgeInDays, skipBranches = null, onlyBranches = null} = cronConfig;

  const cron = new CronJob(normalizeCronSchedule(schedule), () => {
    if (inProgress) {
      log(`Deleting old builds still in progress. Skipping...`);
      return;
    }
    inProgress = true;
    log(`Starting delete old builds`);
    deleteOldBuilds(storageMethod, maxAgeInDays, skipBranches, onlyBranches)
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

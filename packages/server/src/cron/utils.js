/**
 * @license Copyright 2020 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

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

/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const LighthouseRunner = require('./lighthouse-runner.js');
const {saveLHR, clearSavedLHRs} = require('@lhci/utils/src/saved-reports.js');

/**
 * @param {import('yargs').Argv} yargs
 */
function buildCommand(yargs) {
  return yargs.options({
    method: {type: 'string', choices: ['node', 'docker'], default: 'node'},
    headful: {type: 'boolean', description: 'Run with a headful Chrome'},
    additive: {type: 'boolean', description: 'Skips clearing of previous collect data'},
    url: {description: 'The URL to run Lighthouse on.', required: true},
    settings: {description: 'The Lighthouse settings and flags to use when collecting'},
    numberOfRuns: {
      alias: 'n',
      description: 'The number of times to run Lighthouse.',
      default: 3,
      type: 'number',
    },
  });
}

/**
 * @param {LHCI.CollectCommand.Options} options
 * @return {Promise<void>}
 */
async function runCommand(options) {
  if (options.method !== 'node') throw new Error(`Method "${options.method}" not yet supported`);
  const runner = new LighthouseRunner();

  if (!options.additive) clearSavedLHRs();
  process.stdout.write(`Running Lighthouse ${options.numberOfRuns} time(s)\n`);

  for (let i = 0; i < options.numberOfRuns; i++) {
    process.stdout.write(`Run #${i + 1}...`);
    try {
      const lhr = await runner.runUntilSuccess(options.url, {
        headful: options.headful,
        settings: options.settings,
      });
      saveLHR(lhr);
      process.stdout.write('done.\n');
    } catch (err) {
      process.stdout.write('failed!\n');
      throw err;
    }
  }

  process.stdout.write(`Done running Lighthouse!\n`);
}

module.exports = {buildCommand, runCommand};

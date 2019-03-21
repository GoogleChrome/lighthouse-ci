/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const LighthouseRunner = require('./lighthouse-runner.js');
const {saveLHR, clearSavedLHRs} = require('../shared/saved-reports.js');

/**
 * @param {import('yargs').Argv} yargs
 */
function buildCommand(yargs) {
  return yargs.options({
    method: {type: 'string', choices: ['node', 'docker'], default: 'node'},
    headful: {type: 'boolean', description: 'When enabled runs with a headful Chrome'},
    chromeFlags: {type: 'array', description: 'The list of flags to pass to Chrome'},
    url: {description: 'The URL to run Lighthouse on.', required: true},
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

  clearSavedLHRs();
  process.stdout.write(`Running Lighthouse ${options.numberOfRuns} time(s)\n`);

  for (let i = 0; i < options.numberOfRuns; i++) {
    process.stdout.write(`Run #${i + 1}...`);
    const lhr = await runner.run(options.url, {
      headful: options.headful,
      chromeFlags: options.chromeFlags,
    });
    saveLHR(lhr);
    process.stdout.write('done.\n');
  }

  process.stdout.write(`Done running Lighthouse!\n`);
}

module.exports = {buildCommand, runCommand};

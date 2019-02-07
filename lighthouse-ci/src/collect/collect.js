/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const LighthouseRunner = require('./lighthouse-runner.js');

/**
 * @param {import('yargs').Argv} yargs
 */
function buildCommand(yargs) {
  return yargs.options({
    token: {type: 'string', required: true},
    method: {type: 'string', choices: ['node', 'docker'], default: 'node'},
    auditUrl: {description: 'The URL to audit.', required: true},
    numberOfRuns: {
      description: 'The number of times to run Lighthouse.',
      default: 3,
      type: 'number',
    },
    serverBaseUrl: {
      description: 'The base URL of the server where results will be saved.',
      default: 'http://localhost:9001/',
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

  for (let i = 0; i < options.numberOfRuns; i++) {
    const lhr = await runner.run(options.auditUrl);
    // eslint-disable-next-line no-console
    console.log('Would have beaconed LHR to', options.serverBaseUrl, 'fetched at', lhr.fetchTime);
  }
}

module.exports = {buildCommand, runCommand};

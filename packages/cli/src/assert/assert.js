/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const {getSavedLHRs} = require('@lhci/utils/src/saved-reports.js');
const {getAllAssertionResults} = require('@lhci/utils/src/assertions.js');
const log = require('lighthouse-logger');

/**
 * @param {import('yargs').Argv} yargs
 */
function buildCommand(yargs) {
  return yargs.options({
    preset: {
      description: 'The assertions preset to extend',
      choices: ['lighthouse:all', 'lighthouse:recommended'],
    },
    assertions: {
      description: 'The assertions to use.',
    },
  });
}

/**
 * @param {LHCI.AssertCommand.Options} options
 * @return {Promise<void>}
 */
async function runCommand(options) {
  if (!options.assertions && !options.preset) throw new Error('No assertions to use');
  const lhrs = getSavedLHRs().map(json => JSON.parse(json));
  const results = getAllAssertionResults(options, lhrs);

  process.stderr.write(`Checking assertions against ${lhrs.length} run(s)\n`);

  let hasFailure = false;
  for (const result of results) {
    hasFailure = hasFailure || result.level === 'error';
    const label = result.level === 'warn' ? 'warning' : 'failure';
    const warningOrErrorIcon = result.level === 'warn' ? '⚠️  ' : log.redify(log.cross);
    const idPart = `${log.bold}${result.auditId}${log.reset}`;
    const propertyPart = result.auditProperty ? `.${result.auditProperty}` : '';
    const namePart = `${log.bold}${result.name}${log.reset}`;
    process.stderr.write(`
${warningOrErrorIcon} ${idPart}${propertyPart} ${label} for ${namePart} assertion
      expected: ${result.operator}${log.greenify(result.expected)}
         found: ${log.redify(result.actual)}
    ${log.dim}all values: ${result.values.join(', ')}${log.reset}
\n`);
  }

  if (hasFailure) {
    process.stderr.write(`Assertion failed. Exiting with status code 1.\n`);
    process.exit(1);
  }

  process.stderr.write(`All results processed!\n`);
}

module.exports = {buildCommand, runCommand};

/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const _ = require('@lhci/utils/src/lodash.js');
const {loadSavedLHRs, saveAssertionResults} = require('@lhci/utils/src/saved-reports.js');
const {getAllAssertionResults} = require('@lhci/utils/src/assertions.js');
const {convertBudgetsToAssertions} = require('@lhci/utils/src/budgets-converter.js');
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
    budgetsFile: {
      description: 'The path (relative to cwd) to a budgets.json file.',
    },
  });
}

/** @param {string} budgetsFile @return {Array<LHCI.AssertCommand.Budget>} */
function readBudgets(budgetsFile) {
  const fullyResolvedPath = path.resolve(process.cwd(), budgetsFile);
  return JSON.parse(fs.readFileSync(fullyResolvedPath, 'utf8'));
}

/**
 * @param {LHCI.AssertCommand.Options} options
 * @return {Promise<void>}
 */
async function runCommand(options) {
  const {budgetsFile, assertions, assertMatrix, preset} = options;
  const areAssertionsSet = Boolean(assertions || assertMatrix || preset);
  if (!areAssertionsSet && !budgetsFile) throw new Error('No assertions to use');
  if (budgetsFile && areAssertionsSet) throw new Error('Cannot use both budgets AND assertions');
  // If we have a budgets file, convert it to our assertions format.
  if (budgetsFile) options = convertBudgetsToAssertions(readBudgets(budgetsFile));

  const lhrs = loadSavedLHRs().map(json => JSON.parse(json));
  const allResults = getAllAssertionResults(options, lhrs);
  const groupedResults = _.groupBy(allResults, result => result.url);

  process.stderr.write(
    `Checking assertions against ${groupedResults.length} URL(s), ${lhrs.length} total run(s)\n\n`
  );

  let hasFailure = false;
  for (const results of groupedResults) {
    const url = results[0].url;
    const sortedResults = results.sort((a, b) => {
      const {level: levelA = 'error', auditId: auditIdA = 'unknown'} = a;
      const {level: levelB = 'error', auditId: auditIdB = 'unknown'} = b;
      return levelA.localeCompare(levelB) || auditIdA.localeCompare(auditIdB);
    });

    process.stderr.write(`${sortedResults.length} result(s) for ${log.bold}${url}${log.reset}\n`);

    for (const result of sortedResults) {
      hasFailure = hasFailure || result.level === 'error';
      const label = result.level === 'warn' ? 'warning' : 'failure';
      const warningOrErrorIcon = result.level === 'warn' ? '⚠️ ' : `${log.redify(log.cross)} `;
      const idPart = `${log.bold}${result.auditId}${log.reset}`;
      const propertyPart = result.auditProperty ? `.${result.auditProperty}` : '';
      const namePart = `${log.bold}${result.name}${log.reset}`;
      process.stderr.write(`
  ${warningOrErrorIcon} ${idPart}${propertyPart} ${label} for ${namePart} assertion
        expected: ${result.operator}${log.greenify(result.expected)}
           found: ${log.redify(result.actual)}
      ${log.dim}all values: ${result.values.join(', ')}${log.reset}\n\n`);
    }
  }

  saveAssertionResults(allResults);

  if (hasFailure) {
    process.stderr.write(`Assertion failed. Exiting with status code 1.\n`);
    process.exit(1);
  }

  process.stderr.write(`All results processed!\n`);
}

module.exports = {buildCommand, runCommand};

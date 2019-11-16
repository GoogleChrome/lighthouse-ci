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
      choices: ['lighthouse:all', 'lighthouse:recommended', 'lighthouse:no-pwa'],
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

/** @param {number} value @return {string} */
function getBytesValueOutput(value) {
  return `${(value / 1024).toFixed(2)} KB`;
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
  const uniqueUrls = new Set(lhrs.map(lhr => lhr.finalUrl));
  const allResults = getAllAssertionResults(options, lhrs);
  const groupedResults = _.groupBy(allResults, result => result.url);

  process.stderr.write(
    `Checking assertions against ${uniqueUrls.size} URL(s), ${lhrs.length} total run(s)\n\n`
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
      const icon = result.level === 'warn' ? '⚠️ ' : `${log.redify(log.cross)} `;
      const idPart = `${log.bold}${result.auditId}${log.reset}`;
      const propertyPart = result.auditProperty ? `.${result.auditProperty}` : '';
      const namePart = `${log.bold}${result.name}${log.reset}`;
      const isResourceSizes = result.auditId === 'resource-summary';
      const actual = isResourceSizes ? getBytesValueOutput(result.actual) : result.actual;
      const expected = isResourceSizes ? getBytesValueOutput(result.expected) : result.expected;
      const values = isResourceSizes
        ? result.values.map(value => getBytesValueOutput(value))
        : result.values;

      const auditTitlePart = result.auditTitle || '';
      const documentationPart = result.auditDocumentationLink
        ? `Documentation: ${result.auditDocumentationLink}`
        : '';
      const titleAndDocs = [auditTitlePart, documentationPart]
        .filter(Boolean)
        .map(s => `     ` + s)
        .join('\n');
      const humanFriendlyParts = titleAndDocs ? `\n${titleAndDocs}\n` : '';

      process.stderr.write(`
  ${icon} ${idPart}${propertyPart} ${label} for ${namePart} assertion${humanFriendlyParts}
        expected: ${result.operator}${log.greenify(expected)}
           found: ${log.redify(actual)}
      ${log.dim}all values: ${values.join(', ')}${log.reset}\n\n`);
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

/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const fs = require('fs');
const tmp = require('tmp');
const open = require('open');
const _ = require('@lhci/utils/src/lodash.js');
const {computeRepresentativeRuns} = require('@lhci/utils/src/representative-runs.js');
const {loadSavedLHRs, getHTMLReportForLHR} = require('@lhci/utils/src/saved-reports.js');

/**
 * @param {import('yargs').Argv} yargs
 */
function buildCommand(yargs) {
  return yargs.options({
    url: {type: 'string', description: 'The URL of the report to open.'},
  });
}

/**
 * @param {LHCI.OpenCommand.Options} options
 * @return {Promise<void>}
 */
async function runCommand(options) {
  /** @type {Array<LH.Result>} */
  const lhrs = loadSavedLHRs().map(lhr => JSON.parse(lhr));
  /** @type {Array<Array<[LH.Result, LH.Result]>>} */
  const groupedByUrl = _.groupBy(lhrs, lhr => lhr.finalUrl).map(lhrs =>
    lhrs.map(lhr => [lhr, lhr])
  );
  const representativeLhrs = computeRepresentativeRuns(groupedByUrl);

  if (!representativeLhrs.length) {
    process.stdout.write('No available reports to open. ');
  }

  for (const lhr of representativeLhrs) {
    if (options.url && lhr.finalUrl !== options.url) continue;

    process.stdout.write(`Opening median report for ${lhr.finalUrl}...\n`);
    const tmpFile = tmp.fileSync({postfix: '.html'});
    fs.writeFileSync(tmpFile.name, getHTMLReportForLHR(lhr));
    await open(tmpFile.name);
  }

  process.stdout.write('Done!\n');
}

module.exports = {buildCommand, runCommand};

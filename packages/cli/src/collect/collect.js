/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const path = require('path');
const FallbackServer = require('./fallback-server.js');
const LighthouseRunner = require('./lighthouse-runner.js');
const {saveLHR, clearSavedLHRs} = require('@lhci/utils/src/saved-reports.js');

/**
 * @param {import('yargs').Argv} yargs
 */
function buildCommand(yargs) {
  return yargs.options({
    method: {type: 'string', choices: ['node'], default: 'node'},
    headful: {type: 'boolean', description: 'Run with a headful Chrome'},
    additive: {type: 'boolean', description: 'Skips clearing of previous collect data'},
    url: {description: 'The URL to run Lighthouse on.'},
    buildDir: {
      description: 'The build directory where your HTML files to run Lighthouse on are located.',
    },
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
 * @param {string} url
 * @param {LHCI.CollectCommand.Options} options
 * @return {Promise<void>}
 */
async function runOnUrl(url, options) {
  const runner = new LighthouseRunner();
  process.stdout.write(`Running Lighthouse ${options.numberOfRuns} time(s) on ${url}\n`);

  for (let i = 0; i < options.numberOfRuns; i++) {
    process.stdout.write(`Run #${i + 1}...`);
    try {
      const lhr = await runner.runUntilSuccess(url, {
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
}

/**
 * @param {LHCI.CollectCommand.Options} options
 * @return {Promise<{urls: Array<string>, close: () => void}>}
 */
async function determineUrls(options) {
  if (options.url) {
    return {
      urls: Array.isArray(options.url) ? options.url : [options.url],
      close: () => undefined,
    };
  }

  if (!options.buildDir) throw new Error('Either url or buildDir required');

  const pathToBuildDir = path.resolve(process.cwd(), options.buildDir);
  const server = new FallbackServer(pathToBuildDir);
  await server.listen();
  const urls = server.getAvailableUrls();
  return {urls, close: () => server.close()};
}

/**
 * @param {LHCI.CollectCommand.Options} options
 * @return {Promise<void>}
 */
async function runCommand(options) {
  if (options.method !== 'node') throw new Error(`Method "${options.method}" not yet supported`);
  if (!options.additive) clearSavedLHRs();

  const {urls, close} = await determineUrls(options);
  try {
    for (const url of urls) {
      await runOnUrl(url, options);
    }
  } finally {
    close();
  }

  process.stdout.write(`Done running Lighthouse!\n`);
}

module.exports = {buildCommand, runCommand};

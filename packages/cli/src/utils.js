/**
 * @license Copyright 2020 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const fs = require('fs');
const PuppeteerManager = require('./collect/puppeteer-manager.js');
const ChromeLauncher = require('chrome-launcher').Launcher;

/** @param {string} dependency */
function assertOptionalDependency(dependency) {
  try {
    require(dependency);
  } catch (err) {
    throw new Error(
      [
        `This action requires the optional dependency "${dependency}"`,
        `  Run: npm install "${dependency}"`,
      ].join('\n')
    );
  }
}

/** @param {string} filePath @return {boolean} */
function canAccessPath(filePath) {
  try {
    fs.accessSync(filePath);
    return true;
  } catch (_) {
    return false;
  }
}

/**
 * ChromeLauncher has an annoying API that *throws* instead of returning an empty array.
 * Also enables testing of environments that don't have Chrome globally installed in tests.
 *
 * @return {string[]}
 */
function getChromeInstallationsSafe() {
  if (process.env.LHCITEST_IGNORE_CHROME_INSTALLATIONS) return [];

  try {
    return ChromeLauncher.getInstallations();
  } catch (err) {
    return [];
  }
}

/**
 * @param {Partial<LHCI.CollectCommand.Options>} options
 * @return {string|undefined}
 */
function determineChromePath(options) {
  return (
    options.chromePath ||
    process.env.CHROME_PATH ||
    PuppeteerManager.getChromiumPath(options) ||
    getChromeInstallationsSafe()[0] ||
    undefined
  );
}

module.exports = {
  assertOptionalDependency,
  canAccessPath,
  determineChromePath,
  getChromeInstallationsSafe,
};

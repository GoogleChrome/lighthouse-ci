/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const childProcess = require('child_process');
const {getSavedReportsDirectory} = require('@lhci/utils/src/saved-reports.js');

const LH_CLI_PATH = path.join(require.resolve('lighthouse'), '../../lighthouse-cli/index.js');

class LighthouseRunner {
  /**
   * @param {string} url
   * @param {Partial<LHCI.CollectCommand.Options>} options
   * @return {{args: string[], cleanupFn: () => void}}
   */
  static computeArgumentsAndCleanup(url, options) {
    const settings = options.settings || {};
    const chromeFlags = options.settings && options.settings.chromeFlags;
    let chromeFlagsAsString = chromeFlags || '';
    if (!options.headful) chromeFlagsAsString += ' --headless';
    if (chromeFlagsAsString) settings.chromeFlags = chromeFlagsAsString;

    // Make sure we're not passing something that will ruin our runner.
    delete settings.auditMode;
    delete settings.gatherMode;
    delete settings.output;
    delete settings.outputPath;
    delete settings.channel;
    delete settings.listAllAudits;
    delete settings.listAllCategories;
    delete settings.printConfig;

    let cleanupFn = () => {};
    const lhArgs = [url, '--output', 'json', '--output-path', 'stdout'];

    if (Object.keys(settings).length) {
      const flagsFilename = `flags-${Math.round(Math.random() * 10000)}.json`;
      const flagsFilePath = path.join(getSavedReportsDirectory(), flagsFilename);
      lhArgs.push('--cli-flags-path', flagsFilePath);

      fs.writeFileSync(flagsFilePath, JSON.stringify(settings));
      cleanupFn = () => fs.unlinkSync(flagsFilePath);
    }

    return {args: lhArgs, cleanupFn};
  }

  /**
   * @param {string} url
   * @param {Partial<LHCI.CollectCommand.Options>} [options]
   * @return {Promise<string>}
   */
  run(url, options = {}) {
    /** @type {(lhr: string) => void} */
    let resolve;
    /** @type {(e: Error) => void} */
    let reject;
    const promise = new Promise((r1, r2) => {
      resolve = r1;
      reject = r2;
    });

    let stdout = '';
    let stderr = '';

    const {args, cleanupFn} = LighthouseRunner.computeArgumentsAndCleanup(url, options);
    const process = childProcess.spawn(LH_CLI_PATH, args);

    process.stdout.on('data', chunk => (stdout += chunk.toString()));
    process.stderr.on('data', chunk => (stderr += chunk.toString()));

    process.on('exit', code => {
      cleanupFn();
      if (code === 0) return resolve(stdout);

      /** @type {any} */
      const error = new Error(`Lighthouse failed with exit code ${code}`);
      error.stdout = stdout;
      error.stderr = stderr;
      reject(error);
    });

    return promise;
  }

  /**
   * @param {string} url
   * @param {Partial<LHCI.CollectCommand.Options>} [options]
   * @return {Promise<string>}
   */
  async runUntilSuccess(url, options = {}) {
    /** @type {Array<Error>} */
    const attempts = [];

    while (attempts.length < 3) {
      try {
        return await this.run(url, options);
      } catch (err) {
        attempts.push(err);
      }
    }

    throw attempts[0];
  }
}

module.exports = LighthouseRunner;

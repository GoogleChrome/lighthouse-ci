/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const path = require('path');
const childProcess = require('child_process');

const LH_CLI_PATH = path.join(__dirname, '../../../lighthouse-cli/index.js');

class LighthouseRunner {
  /**
   * @param {string} url
   * @return {Promise<string>}
   */
  run(url) {
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

    const lhArgs = [
      url,
      '--output', 'json',
    ];
    const process = childProcess.spawn(LH_CLI_PATH, lhArgs);

    process.stdout.on('data', chunk => stdout += chunk.toString());
    process.stderr.on('data', chunk => stderr += chunk.toString());

    process.on('exit', code => {
      if (code === 0) return resolve(stdout);

      /** @type {any} */
      const error = new Error(`Lighthouse failed with exit code ${code}`);
      error.stdout = stdout;
      error.stderr = stderr;
      reject(error);
    });

    return promise;
  }
}

module.exports = LighthouseRunner;

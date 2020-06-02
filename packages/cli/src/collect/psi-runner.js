/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const PsiClient = require('@lhci/utils/src/psi-client.js');

class PsiRunner {
  /**
   * @param {string} url
   * @param {Partial<LHCI.CollectCommand.Options>} [options]
   * @return {Promise<string>}
   */
  async run(url, options = {}) {
    const apiKey = options.psiApiKey;
    if (!apiKey) throw new Error('PSI API key must be provided to use the PSI runner');
    const client = new PsiClient({apiKey, endpointURL: options.psiApiEndpoint});
    return JSON.stringify(await client.run(url));
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

module.exports = PsiRunner;

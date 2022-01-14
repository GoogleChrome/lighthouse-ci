/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const PsiClient = require('./psi-client.js');

const CACHEBUST_TIMEOUT = Number(process.env.PSI_CACHEBUST_TIMEOUT_MS) || 60e3;

class PsiRunner {
  /**
   * @param {{psiApiKey?: string, psiApiEndpoint?: string}} [options]
   */
  constructor(options) {
    this._options = options || {};
  }

  /**
   * @param {string} url
   * @param {{psiApiKey?: string, psiApiEndpoint?: string, psiStrategy?: 'mobile'|'desktop', psiCategories?: Array<'performance' | 'accessibility' | 'best-practices' | 'pwa' | 'seo'>}} [options]
   * @return {Promise<string>}
   */
  async run(url, options) {
    options = {...this._options, ...options};
    const apiKey = options.psiApiKey;
    if (!apiKey) throw new Error('PSI API key must be provided to use the PSI runner');
    const client = new PsiClient({apiKey, endpointURL: options.psiApiEndpoint});
    return JSON.stringify(
      await client.run(url, {strategy: options.psiStrategy, categories: options.psiCategories})
    );
  }

  /**
   * @param {string} url
   * @param {{psiApiKey?: string, psiApiEndpoint?: string, psiStrategy?: 'mobile'|'desktop', psiCategories?: Array<'performance' | 'accessibility' | 'best-practices' | 'pwa' | 'seo'>}} [options]
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

  /** @return {number} */
  get CACHEBUST_TIMEOUT() {
    return CACHEBUST_TIMEOUT;
  }

  static get CACHEBUST_TIMEOUT() {
    return CACHEBUST_TIMEOUT;
  }
}

module.exports = PsiRunner;

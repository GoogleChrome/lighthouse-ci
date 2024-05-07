/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const URL = require('url').URL;
const fetch = require('isomorphic-fetch');

const PSI_URL = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';

class PsiClient {
  /**
   * @param {{apiKey: string, endpointURL?: string, fetch?: import('isomorphic-fetch'), URL?: typeof import('url').URL, extraHeaders?: Record<string, string>, basicAuth?: LHCI.ServerCommand.Options['basicAuth']}} options
   */
  constructor(options) {
    this._apiKey = options.apiKey;
    this._endpointURL = options.endpointURL || PSI_URL;
    this._fetch = options.fetch || fetch;
    this._URL = options.URL || URL;
  }

  /**
   * @param {string} urlToTest
   * @param {{strategy?: 'mobile'|'desktop', locale?: string, categories?: Array<'performance' | 'accessibility' | 'best-practices' | 'seo'>}} [options]
   * @return {Promise<LH.Result>}
   */
  async run(urlToTest, options = {}) {
    const {
      strategy = 'mobile',
      locale = 'en_US',
      categories = ['performance', 'accessibility', 'best-practices', 'seo'],
    } = options;
    const url = new this._URL(this._endpointURL);
    url.searchParams.set('url', urlToTest);
    url.searchParams.set('locale', locale);
    url.searchParams.set('strategy', strategy);
    url.searchParams.set('key', this._apiKey);
    categories.forEach(category => url.searchParams.append('category', category));

    const response = await this._fetch(url.href);
    const body = await response.json();
    if (body.lighthouseResult) return body.lighthouseResult;

    if (body.error) {
      const {code = 'UNKNOWN', message = 'Unknown reason'} = body.error;
      const error = new Error(`PSI Failed (${code}): ${message}`);
      // @ts-ignore - append information to the error
      error.originalError = body.error;
      throw error;
    }

    throw new Error(`Unexpected PSI response: ${JSON.stringify(body)}`);
  }
}

module.exports = PsiClient;

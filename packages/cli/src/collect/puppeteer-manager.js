/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const path = require('path');

/** @typedef {(browser: import('puppeteer').Browser, context: {url: string, options: LHCI.CollectCommand.Options}) => void} PuppeteerScript */

class PuppeteerManager {
  /** @param {LHCI.CollectCommand.Options} options */
  constructor(options) {
    this._options = options;

    /** @type {null|import('puppeteer').Browser} */
    this._browser = null;
  }

  /** @return {Promise<import('puppeteer').Browser>} */
  async _getBrowser() {
    if (!this.isActive()) throw new Error('Should not launch a browser when inactive');
    if (this._browser) return this._browser;

    // Delay require to only run after user requests puppeteer functionality.
    const puppeteer = require('puppeteer');
    this._browser = await puppeteer.launch({
      ...(this._options.puppeteerLaunchOptions || {}),
      pipe: false,
      devtools: false,
      headless: !this._options.headful,
      executablePath: this._options.chromePath,
    });

    return this._browser;
  }

  /** @return {boolean} */
  isActive() {
    return !!this._options.puppeteerScript;
  }

  /** @return {Promise<number>} */
  async getBrowserPort() {
    const browser = await this._getBrowser();
    return Number(new URL(browser.wsEndpoint()).port);
  }

  /**
   * @param {string} url
   * @return {Promise<void>}
   */
  async invokePuppeteerScriptForUrl(url) {
    const scriptPath = this._options.puppeteerScript;
    if (!scriptPath) return;

    const browser = await this._getBrowser();
    /** @type {PuppeteerScript} */
    const script = require(path.join(process.cwd(), scriptPath));
    await script(browser, {url, options: this._options});
  }
}

module.exports = PuppeteerManager;

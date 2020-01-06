/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const fs = require('fs');
const express = require('express');
const compression = require('compression');
const createHttpServer = require('http').createServer;

class FallbackServer {
  /**
   * @param {string} pathToBuildDir
   * @param {boolean|undefined} isSinglePageApplication
   */
  constructor(pathToBuildDir, isSinglePageApplication) {
    this._pathToBuildDir = pathToBuildDir;
    this._app = express();
    this._app.use(compression());
    this._app.use('/', express.static(pathToBuildDir));
    if (isSinglePageApplication) {
      this._app.use('/*', (req, res) => res.sendFile(pathToBuildDir + '/index.html'));
    }
    this._port = 0;
    /** @type {undefined|ReturnType<typeof createHttpServer>} */
    this._server = undefined;
  }

  get port() {
    return this._port;
  }

  /** @return {Promise<void>} */
  listen() {
    const server = createHttpServer(this._app);
    this._server = server;

    return new Promise((resolve, reject) => {
      server.listen(0, () => {
        const serverAddress = server.address();
        if (typeof serverAddress === 'string' || !serverAddress) {
          return reject(new Error(`Invalid server address "${serverAddress}"`));
        }

        this._port = serverAddress.port;
        resolve();
      });
    });
  }

  /** @return {Promise<void>} */
  async close() {
    if (!this._server) return;
    const server = this._server;
    return new Promise((resolve, reject) => server.close(err => (err ? reject(err) : resolve())));
  }

  /** @return {string[]} */
  getAvailableUrls() {
    const htmlFiles = fs.readdirSync(this._pathToBuildDir).filter(file => file.endsWith('.html'));
    return htmlFiles.map(file => `http://localhost:${this._port}/${file}`);
  }
}

module.exports = FallbackServer;

/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const express = require('express');
const compression = require('compression');
const createHttpServer = require('http').createServer;

const IGNORED_FOLDERS_FOR_AUTOFIND = new Set([
  'node_modules',
  'bower_components',
  'jspm_packages',
  'web_modules',
  'tmp',
]);

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
    this._app.use('/app', express.static(pathToBuildDir));
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
    return new Promise((resolve, reject) =>
      server.close(
        /** @param {Error|undefined} err */
        err => (err ? reject(err) : resolve())
      )
    );
  }

  /**
   * @param {number} maxDepth
   * @return  {string[]}
   */
  getAvailableUrls(maxDepth) {
    if (maxDepth >= 0) {
      maxDepth = Math.floor(maxDepth);
    } else {
      process.stderr.write(
        `WARNING: staticDirFileDiscoveryDepth must be greater than 0. Defaulting to a discovery depth of 2\n`
      );
      maxDepth = 2;
    }
    const htmlFiles = FallbackServer.readHtmlFilesInDirectory(this._pathToBuildDir, maxDepth);
    return htmlFiles.map(({file}) => `http://localhost:${this._port}/${file}`);
  }

  /**
   * @param {string} directory
   * @param {number} depth
   * @return {Array<{file: string, depth: number}>}
   */
  static readHtmlFilesInDirectory(directory, depth) {
    const filesAndFolders = fs.readdirSync(directory, {withFileTypes: true});

    const files = filesAndFolders.filter(fileOrDir => fileOrDir.isFile()).map(file => file.name);
    const folders = filesAndFolders
      .filter(fileOrDir => fileOrDir.isDirectory())
      .map(dir => dir.name);

    const htmlFiles = files
      .filter(file => file.endsWith('.html') || file.endsWith('.htm'))
      .map(file => ({file, depth: 0}));

    if (depth === 0) return htmlFiles;

    for (const folder of folders) {
      // Don't recurse into hidden folders, things that look like files, or dependency folders
      if (folder.includes('.')) continue;
      if (IGNORED_FOLDERS_FOR_AUTOFIND.has(folder)) continue;

      try {
        const fullPath = path.join(directory, folder);
        if (!fs.statSync(fullPath).isDirectory()) continue;

        htmlFiles.push(
          ...FallbackServer.readHtmlFilesInDirectory(fullPath, depth - 1).map(({file, depth}) => {
            return {file: `${folder}/${file}`, depth: depth + 1};
          })
        );
      } catch (err) {}
    }

    return htmlFiles;
  }
}

module.exports = FallbackServer;

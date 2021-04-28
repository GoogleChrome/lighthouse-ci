/**
 * @license Copyright 2021 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';
const createHttpServer = require('http').createServer;
const express = require('express');

/**
 * @return {Promise<{app: Parameters<typeof createHttpServer>[1]}>}
 */
async function createApp() {
  const app = express();

  app.post('/repos/GoogleChrome/lighthouse-ci/statuses/hash', (req, res) => {
    if (!req.headers.authorization || req.headers.authorization !== 'token githubToken') {
      res.status(401);
      res.json();
      return;
    }

    setTimeout(() => {
      res.status(201);
      res.json({});
    }, 100);
  });

  return {app};
}

/**
 * @return {Promise<{port: number, close: () => Promise<void>}>}
 */
async function createServer() {
  const {app} = await createApp();

  return new Promise(resolve => {
    const server = createHttpServer(app);
    server.listen(0, () => {
      const serverAddress = server.address();
      const listenPort =
        typeof serverAddress === 'string' || !serverAddress ? 0 : serverAddress.port;

      resolve({
        port: listenPort,
        close: async () => {
          await new Promise(r => server.close(r));
        },
      });
    });
  });
}

module.exports = {createApp, createServer};

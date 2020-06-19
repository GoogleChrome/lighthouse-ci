/**
 * @license Copyright 2020 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const createHttpServer = require('http').createServer;
const express = require('express');
const LHR = require('../../../../server/test/fixtures/lh-6-0-0-coursehero-a.json');

/**
 * @return {Promise<{app: Parameters<typeof createHttpServer>[1]}>}
 */
async function createApp() {
  const app = express();

  app.get('/', (_, res) => res.send('<!DOCTYPE html><h1>Hello'));

  app.get('/runPagespeed', (req, res) => {
    if (!req.query || req.query.key !== 'secret-key') {
      res.status(500);
      res.json({error: {message: 'Oops'}});
      return;
    }

    const url = req.query.url;
    const lighthouseResult = JSON.parse(JSON.stringify(LHR));
    lighthouseResult.finalUrl = url;
    lighthouseResult.initialUrl = url;
    setTimeout(() => res.json({lighthouseResult}), 2000);
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

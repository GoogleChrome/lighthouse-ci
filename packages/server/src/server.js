/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/** @typedef {{port: number, close: () => Promise<void>, storageMethod: StorageMethod}} ServerInstance */

const log = require('debug')('lhci:server:sql');
const path = require('path');
const createHttpServer = require('http').createServer;
const express = require('express');
const morgan = require('morgan');
const compression = require('compression');
const bodyParser = require('body-parser');
const ApiClient = require('@lhci/utils/src/api-client.js');
const createProjectsRouter = require('./api/routes/projects.js');
const StorageMethod = require('./api/storage/storage-method.js');
const {errorMiddleware, createBasicAuthMiddleware} = require('./api/express-utils.js');
const {startPsiCollectCron} = require('./cron/psi-collect.js');
const {startDeleteOldBuildsCron} = require('./cron/delete-old-builds');
const version = require('../package.json').version;

const DIST_FOLDER = path.join(__dirname, '../dist');

/**
 * @param {LHCI.ServerCommand.Options} options
 * @return {Promise<{app: Parameters<typeof createHttpServer>[1], storageMethod: StorageMethod}>}
 */
async function createApp(options) {
  const {storage, useBodyParser} = options;

  log('[createApp] initializing storage method');
  const storageMethod = StorageMethod.from(storage);
  await storageMethod.initialize(storage);

  log('[createApp] creating express app');
  const context = {storageMethod, options};
  const app = express();
  if (options.logLevel !== 'silent') app.use(morgan('short'));

  // While LHCI should be served behind nginx/apache that handles compression, it won't always be.
  app.use(compression());

  if (typeof useBodyParser === 'undefined' || useBodyParser) {
    // 1. Optional if you want to overwrite by other middleware like koa or fastify
    // 2. Support large payloads because LHRs are big.
    // 3. Support JSON primitives because `PUT /builds/<id>/lifecycle "sealed"`
    app.use(bodyParser.json({limit: '10mb', strict: false}));
  }

  // Add a health check route before auth
  app.use('/healthz', (_, res) => res.send('healthy'));

  // The rest of the server can be protected by HTTP Basic Authentication
  const authMiddleware = createBasicAuthMiddleware(context);
  if (authMiddleware) app.use(authMiddleware);

  app.get('/', (_, res) => res.redirect('/app'));
  app.use('/version', (_, res) => res.send(version));
  app.use('/v1/projects', createProjectsRouter(context));
  app.use('/app', express.static(DIST_FOLDER));
  app.get('/app/*', (_, res) => res.sendFile(path.join(DIST_FOLDER, 'index.html')));
  app.use(errorMiddleware);

  log('[createApp] launching cron jobs');
  startPsiCollectCron(storageMethod, options);
  startDeleteOldBuildsCron(storageMethod, options);

  return {app, storageMethod};
}

/**
 * @param {LHCI.ServerCommand.Options} options
 * @return {Promise<ServerInstance>}
 */
async function createServer(options) {
  const {app, storageMethod} = await createApp(options);

  return new Promise((resolve, reject) => {
    const server = createHttpServer(app);

    // Node default socket timeout is 2 minutes.
    // Some LHCI API operations (computing statistics) can take longer than that under heavy load.
    // Set the timeout even higher to allow for these requests to complete.
    server.on('connection', socket => {
      socket.setTimeout(20 * 60 * 1000); // 20 minutes
      socket.on('timeout', () => {
        if (options.logLevel !== 'silent') {
          process.stdout.write(`${new Date().toISOString()} - socket timed out\n`);
        }

        socket.end();
      });
    });

    server.on('error', err => reject(err));

    const listenOptions = {
      port: options.port,
      host: options.host,
    };

    server.listen(listenOptions, () => {
      const serverAddress = server.address();
      const listenPort =
        typeof serverAddress === 'string' || !serverAddress ? options.port : serverAddress.port;

      resolve({
        storageMethod,
        port: listenPort,
        close: async () => {
          await Promise.all([new Promise(r => server.close(r)), storageMethod.close()]);
        },
      });
    });
  });
}

module.exports = {createApp, createServer, ApiClient};

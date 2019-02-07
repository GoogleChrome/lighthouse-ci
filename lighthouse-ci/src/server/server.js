/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const createServer = require('http').createServer;
const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const createProjectsRouter = require('./routes/projects');
const StorageMethod = require('./api/storage/storage-method.js');

/**
 * @param {import('yargs').Argv} yargs
 */
function buildCommand(yargs) {
  return yargs.options({
    logLevel: {
      type: 'string',
      choices: ['silent', 'verbose'],
      default: 'verbose',
    },
    port: {
      alias: 'p',
      type: 'number',
      default: 9001,
    },
    'storage.storageMethod': {
      type: 'string',
      choices: ['sql', 'bigquery'],
      default: 'sql',
    },
    'storage.sqlDialect': {
      type: 'string',
      choices: ['sqlite', 'mysql'],
      default: 'sqlite',
    },
    'storage.sqlDatabasePath': {
      description: 'The path to a SQLite database on disk.',
    },
    'storage.sqlDangerouslyForceMigration': {
      description:
        'Whether to force the database to the required schema. WARNING: THIS WILL DELETE ALL DATA',
      type: 'boolean',
      default: false,
    },
  });
}

/**
 * @param {LHCI.ServerCommand.Options} options
 * @return {Promise<{port: number, close: () => void}>}
 */
async function runCommand(options) {
  const {port, storage} = options;

  const storageMethod = StorageMethod.from(storage);
  await storageMethod.initialize(storage);

  const app = express();
  if (options.logLevel !== 'silent') app.use(morgan('short'));
  app.use(bodyParser.json());
  app.use('/v1/projects', createProjectsRouter({storageMethod}));

  return new Promise(resolve => {
    const server = createServer(app);
    server.listen(port, () => {
      const serverAddress = server.address();
      const listenPort = typeof serverAddress === 'string' ? port : serverAddress.port;
      resolve({port: listenPort, close: () => server.close()});
    });
  });
}

module.exports = {buildCommand, runCommand};

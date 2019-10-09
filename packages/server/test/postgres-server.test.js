/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/* eslint-env jest */

const runTests = require('./server-test-suite.js').runTests;
const runServer = require('../src/server.js').createServer;

describe('postgres server', () => {
  if (!process.env.POSTGRES_DB_URL) {
    it.skip('should work on postgres', () => {});
    return;
  }

  const state = {
    port: undefined,
    closeServer: undefined,
  };

  beforeAll(async () => {
    const {port, close} = await runServer({
      logLevel: 'silent',
      port: 0,
      storage: {
        storageMethod: 'sql',
        sqlDialect: 'postgres',
        sqlConnectionUrl: process.env.POSTGRES_DB_URL,
        sqlConnectionSsl: !!process.env.POSTGRES_DB_SSL,
        sqlDangerouslyResetDatabase: true,
      },
    });

    state.port = port;
    state.closeServer = close;
  });

  afterAll(() => {
    state.closeServer();
  });

  runTests(state);
});

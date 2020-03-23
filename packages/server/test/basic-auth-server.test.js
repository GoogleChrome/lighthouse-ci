/**
 * @license Copyright 2020 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/* eslint-env jest */

const path = require('path');
const fetch = require('isomorphic-fetch');
const runTests = require('./server-test-suite.js').runTests;
const runServer = require('../src/server.js').createServer;
const {safeDeleteFile} = require('../../cli/test/test-utils.js');

describe('sqlite server (authenticated)', () => {
  const state = {
    port: undefined,
    closeServer: undefined,
  };

  const dbPath = path.join(__dirname, 'server-auth-test.tmp.sql');

  beforeAll(async () => {
    await safeDeleteFile(dbPath);

    const {port, close, storageMethod} = await runServer({
      logLevel: 'silent',
      port: 0,
      storage: {
        storageMethod: 'sql',
        sqlDialect: 'sqlite',
        sqlDatabasePath: dbPath,
      },
      basicAuth: {
        username: 'foobar',
        password: 'ICanBeYourLighthouse',
      },
    });

    const basicAuthEncoded = Buffer.from('foobar:ICanBeYourLighthouse').toString('base64');
    state.port = port;
    state.closeServer = close;
    state.storageMethod = storageMethod;
    state.extraHeaders = {Authorization: `Basic ${basicAuthEncoded}`};
  });

  afterAll(async () => {
    await state.closeServer();
    await safeDeleteFile(dbPath);
  });

  runTests(state);

  describe('basic authentication', () => {
    const routes = ['/', '/v1/projects', '/app', '/version'];
    for (const route of routes) {
      it(`should reject unauthorized requests for ${route}`, async () => {
        const response = await fetch(`http://localhost:${state.port}${route}`);
        expect(response.status).toEqual(401);
      });

      it(`should reject incorrect login requests for ${route}`, async () => {
        const incorrectBasicAuth = Buffer.from('lhci:password').toString('base64');
        const response = await fetch(`http://localhost:${state.port}${route}`, {
          headers: {Authorization: `Basic ${incorrectBasicAuth}`},
        });
        expect(response.status).toEqual(401);
      });

      it(`should allow authorized requests for ${route}`, async () => {
        const response = await fetch(`http://localhost:${state.port}${route}`, {
          headers: state.extraHeaders,
        });
        expect(response.status).toEqual(200);
        const body = await response.text();
        expect(body.length).toBeGreaterThan(4);
      });
    }
  });
});

/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/* eslint-env jest */

const runTests = require('./server-test-suite.js').runTests;
const runServer = require('../src/server.js').createServer;
const Sequelize = require('sequelize').Sequelize;

describe('mysql server', () => {
  if (!process.env.MYSQL_DB_URL) {
    it.skip('should work on mysql', () => {});
    return;
  }

  const state = {
    port: undefined,
    closeServer: undefined,
  };

  const customSequelizeTableName = 'sequelize_meta';

  beforeAll(async () => {
    const {port, close, storageMethod} = await runServer({
      logLevel: 'silent',
      port: 0,
      storage: {
        storageMethod: 'sql',
        sqlDialect: 'mysql',
        sqlConnectionUrl: process.env.MYSQL_DB_URL,
        sqlConnectionSsl: !!process.env.MYSQL_DB_SSL,
        sqlDangerouslyResetDatabase: true,
        sqlMigrationOptions: {tableName: customSequelizeTableName},
      },
    });

    state.port = port;
    state.closeServer = close;
    state.storageMethod = storageMethod;
  });

  afterAll(() => {
    state.closeServer();
  });

  runTests(state);

  describe('sqlMigrationOptions', () => {
    it('should use the renamed table', async () => {
      const sequelize = new Sequelize(process.env.MYSQL_DB_URL);
      try {
        const tables = await sequelize.query('show tables');
        expect(JSON.stringify(tables)).toContain(customSequelizeTableName);
      } finally {
        await sequelize.close();
      }
    });
  });
});

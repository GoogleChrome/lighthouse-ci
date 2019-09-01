/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const {createServer} = require('@lhci/server');

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
  return createServer(options);
}

module.exports = {buildCommand, runCommand};

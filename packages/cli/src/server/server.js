/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const yargsParser = require('yargs-parser');
const {resolveRcFilePath} = require('@lhci/utils/src/lighthouserc.js');

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
    host: {
      type: 'string',
    },
    'storage.storageMethod': {
      type: 'string',
      choices: ['sql', 'spanner'],
      default: 'sql',
    },
    'storage.sqlDialect': {
      type: 'string',
      choices: ['sqlite', 'postgres', 'mysql'],
      default: 'sqlite',
    },
    'storage.sqlDatabasePath': {
      description: 'The path to a SQLite database on disk.',
    },
    'storage.sqlConnectionUrl': {
      description: 'The connection url to a postgres or mysql database.',
    },
    'storage.sqlConnectionSsl': {
      type: 'boolean',
      default: false,
      description: 'Whether the SQL connection should force use of SSL',
    },
    'storage.sqlDangerouslyResetDatabase': {
      description:
        'Whether to force the database to the required schema. WARNING: THIS WILL DELETE ALL DATA',
      type: 'boolean',
      default: false,
    },
    'storage.sqlMigrationOptions.tableName': {
      type: 'string',
      description: 'Use a different Sequelize table name.',
    },
    'basicAuth.username': {
      type: 'string',
      description: 'The username to protect the server with HTTP Basic Authentication.',
    },
    'basicAuth.password': {
      type: 'string',
      description: 'The password to protect the server with HTTP Basic Authentication.',
    },
  });
}

/**
 * @param {LHCI.ServerCommand.Options} options
 * @return {Promise<{port: number, close: () => void}>}
 */
async function runCommand(options) {
  if (!Number.isInteger(options.port) || options.port < 0 || options.port > 65536) {
    const simpleArgv = yargsParser(process.argv.slice(2), {envPrefix: 'LHCI'});
    const environment = Object.keys(process.env)
      .filter(key => key.startsWith('LHCI_'))
      .map(key => `${key}="${process.env[key]}"`)
      .sort()
      .join(', ');
    process.stderr.write(`Invalid port option "${options.port}"\n`);
    process.stderr.write(`environment: ${environment}\n`);
    process.stderr.write(`process.argv: ${process.argv.slice(2).join(' ')}\n`);
    process.stderr.write(`simpleArgv: port=${simpleArgv.port}, p=${simpleArgv.p}\n`);
    process.stderr.write(`configFile: ${resolveRcFilePath(simpleArgv.config)}\n`);
    process.exit(1);
  }

  // Require this only after they decide to run `lhci server`
  // eslint-disable-next-line import/no-extraneous-dependencies
  const {createServer} = require('@lhci/server');
  return createServer(options);
}

module.exports = {buildCommand, runCommand};

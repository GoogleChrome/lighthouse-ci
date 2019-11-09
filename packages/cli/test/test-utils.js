/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const path = require('path');
const {spawn, spawnSync} = require('child_process');
const testingLibrary = require('@testing-library/dom');

const CLI_PATH = path.join(__dirname, '../src/cli.js');

function getSqlFilePath() {
  return `cli-test-${Math.round(Math.random() * 1e9)}.tmp.sql`;
}

async function startServer(sqlFile) {
  if (!sqlFile) {
    sqlFile = getSqlFilePath();
  }

  let stdout = '';
  const serverProcess = spawn(CLI_PATH, ['server', '-p=0', `--storage.sqlDatabasePath=${sqlFile}`]);
  serverProcess.stdout.on('data', chunk => (stdout += chunk.toString()));

  await waitForCondition(() => stdout.includes('listening'));

  const port = stdout.match(/port (\d+)/)[1];
  return {port, process: serverProcess, sqlFile};
}

function waitForCondition(fn, label) {
  return testingLibrary.wait(() => {
    if (!fn()) throw new Error(label || 'Condition not met');
  });
}

/**
 * @param {string[]} args
 * @param {{cwd?: string, env?: Record<string, string>}} [overrides]
 * @return {{stdout: string, stderr: string, status: number}}
 */
function runCLI(args, overrides = {}) {
  const {env: extraEnvVars, ...options} = overrides;
  const cleanEnv = {
    ...process.env,
    LHCI_GITHUB_TOKEN: '',
    LHCI_GITHUB_APP_TOKEN: '',
    NO_UPDATE_NOTIFIER: '1',
    LHCI_NO_LIGHTHOUSERC: '1',
  };
  const env = {...cleanEnv, ...extraEnvVars};
  let {stdout = '', stderr = '', status = -1} = spawnSync(CLI_PATH, args, {...options, env});

  stdout = stdout.toString();
  stderr = stderr.toString();
  status = status || 0;

  return {stdout, stderr, status};
}

module.exports = {
  CLI_PATH,
  runCLI,
  startServer,
  waitForCondition,
  getSqlFilePath,
};

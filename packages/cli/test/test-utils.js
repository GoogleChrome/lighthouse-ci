/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const path = require('path');
const {spawn} = require('child_process');
const testingLibrary = require('@testing-library/dom');

const CLI_PATH = path.join(__dirname, '../src/cli.js');

async function startServer(sqlFile) {
  if (!sqlFile) {
    sqlFile = `cli-test-${Math.round(Math.random() * 1e9)}.tmp.sql`;
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

module.exports = {
  CLI_PATH,
  startServer,
  waitForCondition,
};

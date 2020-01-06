/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const os = require('os');
const fs = require('fs');
const path = require('path');
const rimraf = require('rimraf');
const {spawn, spawnSync} = require('child_process');
const testingLibrary = require('@testing-library/dom');
const FallbackServer = require('../src/collect/fallback-server.js');

const CLI_PATH = path.join(__dirname, '../src/cli.js');
const UUID_REGEX = /[0-9a-f-]{36}/gi;

function getSqlFilePath() {
  return `cli-test-${Math.round(Math.random() * 1e9)}.tmp.sql`;
}

function cleanStdOutput(output) {
  return output
    .replace(/✘/g, 'X')
    .replace(/×/g, 'X')
    .replace(/[0-9a-f-]{36}/gi, '<UUID>')
    .replace(/:\d{4,6}/g, ':XXXX')
    .replace(/port \d{4,6}/, 'port XXXX')
    .replace(/\d{4,}(\.\d{1,})?/g, 'XXXX');
}

async function safeDeleteFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  let attempt = 0;
  while (attempt < 3) {
    attempt++;
    try {
      fs.unlinkSync(filePath);
      return;
    } catch (err) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }
}

async function withTmpDir(fn) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lighthouse-ci-'));
  await fn(tmpDir);
  rimraf.sync(tmpDir);
}

async function startServer(sqlFile) {
  if (!sqlFile) {
    sqlFile = getSqlFilePath();
  }

  let stdout = '';
  const serverProcess = spawn('node', [
    CLI_PATH,
    'server',
    '-p=0',
    `--storage.sqlDatabasePath=${sqlFile}`,
  ]);
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
 * @return {{stdout: string, stderr: string, status: number, matches: {uuids: RegExpMatchArray}}}
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
  let {stdout = '', stderr = '', status = -1} = spawnSync('node', [CLI_PATH, ...args], {
    ...options,
    env,
  });

  stdout = stdout.toString();
  stderr = stderr.toString();
  status = status || 0;

  const uuids = stdout.match(UUID_REGEX);
  stdout = cleanStdOutput(stdout);
  stderr = cleanStdOutput(stderr);

  return {stdout, stderr, status, matches: {uuids}};
}

/**
 * @param {string} staticDistDir
 * @param {{isSinglePageApplication: boolean}} options
 * @returns {Promise<FallbackServer>}
 */
async function startFallbackServer(staticDistDir, options) {
  const {isSinglePageApplication} = options;
  const pathToBuildDir = path.resolve(process.cwd(), staticDistDir);
  const server = new FallbackServer(pathToBuildDir, isSinglePageApplication);
  await server.listen();
  return server;
}

module.exports = {
  CLI_PATH,
  runCLI,
  startServer,
  waitForCondition,
  getSqlFilePath,
  safeDeleteFile,
  withTmpDir,
  cleanStdOutput,
  startFallbackServer,
};

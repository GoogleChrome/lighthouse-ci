/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/* eslint-env jest */

const os = require('os');
const fs = require('fs');
const path = require('path');
const rimraf = require('rimraf');
const {spawn} = require('child_process');
const testingLibrary = require('@testing-library/dom');
const FallbackServer = require('../src/collect/fallback-server.js');

jest.setTimeout(30e3);

const CLI_PATH = path.join(__dirname, '../src/cli.js');
const UUID_REGEX = /[0-9a-f-]{36}/gi;

function getSqlFilePath() {
  return `cli-test-${Math.round(Math.random() * 1e9)}.tmp.sql`;
}

/** @param {import('child_process').ChildProcess & {stdoutMemory: string}} wizardProcess @param {string[]} inputs */
async function writeAllInputs(wizardProcess, inputs) {
  const ENTER_KEY = '\x0D';

  for (const input of inputs) {
    wizardProcess.stdin.write(input);
    wizardProcess.stdin.write(ENTER_KEY);
    // Wait for inquirer to write back our response, that's the signal we can continue.
    await waitForCondition(() => wizardProcess.stdoutMemory.includes(input));
    // Sometimes it still isn't ready though, give it a bit more time to process.
    await new Promise(r => setTimeout(r, process.env.CI ? 500 : 50));
  }

  wizardProcess.stdin.end();
}

/** @param {string} output */
function cleanStdOutput(output) {
  return output
    .replace(/✘/g, 'X')
    .replace(/×/g, 'X')
    .replace(/[0-9a-f-]{36}/gi, '<UUID>')
    .replace(/:\d{4,6}/g, ':XXXX')
    .replace(/port \d{4,6}/, 'port XXXX')
    .replace(/(\s+at \S+) .*/g, '$1')
    .replace(
      /appspot.com\/reports\/[0-9-]+.report.html/,
      'appspot.com/reports/XXXX-XXXX.report.html'
    )
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

async function startServer(sqlFile, extraArgs = []) {
  if (!sqlFile) {
    sqlFile = getSqlFilePath();
  }

  let stdout = '';
  let stderr = '';
  const serverProcess = spawn('node', [
    CLI_PATH,
    'server',
    '-p=0',
    `--storage.sqlDatabasePath=${sqlFile}`,
    ...extraArgs,
  ]);
  serverProcess.stdout.on('data', chunk => (stdout += chunk.toString()));
  serverProcess.stderr.on('data', chunk => (stderr += chunk.toString()));

  try {
    await waitForCondition(() => stdout.includes('listening'), 'Server failed to start');
  } catch (err) {
    throw new Error(`${err.message}\nSTDOUT: ${stdout}\nSTDERR: ${stderr}`);
  }

  const port = stdout.match(/port (\d+)/)[1];
  return {port, process: serverProcess, sqlFile};
}

function waitForNonException(fn) {
  return testingLibrary.wait(fn);
}

function waitForCondition(fn, label) {
  return testingLibrary.wait(() => {
    if (!fn()) {
      throw new Error(typeof label === 'function' ? label() : label || 'Condition not met');
    }
  });
}

/** @param {Record<string, string>|undefined} extraEnvVars */
function getCleanEnvironment(extraEnvVars) {
  const cleanEnv = {
    ...process.env,
    CHROME_PATH: undefined,
    LHCI_GITHUB_TOKEN: undefined,
    LHCI_GITHUB_APP_TOKEN: undefined,
    LHCI_CANARY_SERVER_URL: undefined,
    LHCI_CANARY_SERVER_TOKEN: undefined,
    NO_UPDATE_NOTIFIER: '1',
    LHCI_NO_LIGHTHOUSERC: '1',
  };

  return {...cleanEnv, ...extraEnvVars};
}

/**
 * @param {string[]} args
 * @param {{cwd?: string, env?: Record<string, string>}} [overrides]
 * @return {{stdout: string, stderr: string, status: number, matches: {uuids: RegExpMatchArray}, childProcess: NodeJS.ChildProcess, exitPromise: Promise<void>}}
 */
function runCLIWithoutWaiting(args, overrides = {}) {
  const {env: extraEnvVars, cwd} = overrides;
  const env = getCleanEnvironment(extraEnvVars);
  const childProcess = spawn('node', [CLI_PATH, ...args], {
    cwd,
    env,
  });

  const results = {stdout: '', stderr: '', status: -1, matches: {uuids: []}};
  childProcess.stdout.on('data', chunk => (results.stdout += chunk.toString()));
  childProcess.stderr.on('data', chunk => (results.stderr += chunk.toString()));
  childProcess.once('exit', code => (results.status = code));
  const exitPromise = new Promise(r => childProcess.once('exit', r));

  results.exitPromise = exitPromise.then(() => {
    results.matches.uuids = results.stdout.match(UUID_REGEX);
    results.stdout = cleanStdOutput(results.stdout);
    results.stderr = cleanStdOutput(results.stderr);
  });
  results.childProcess = childProcess;
  return results;
}

/**
 * @param {string[]} args
 * @param {{cwd?: string, env?: Record<string, string>}} [overrides]
 * @return {Promise<{stdout: string, stderr: string, status: number, matches: {uuids: RegExpMatchArray}}>}
 */
async function runCLI(args, overrides = {}) {
  const results = runCLIWithoutWaiting(args, overrides);
  await results.exitPromise;
  return results;
}

/**
 * @param {string[]} args
 * @param {string[]} inputs
 * @param {{cwd?: string, env?: Record<string, string>, inputWaitCondition?: string}} [overrides]
 * @return {{stdout: string, stderr: string, status: number, matches: {uuids: RegExpMatchArray}}}
 */
async function runWizardCLI(args, inputs, overrides = {}) {
  const {env: extraEnvVars, cwd, inputWaitCondition = 'Which wizard'} = overrides;
  const env = getCleanEnvironment(extraEnvVars);
  const wizardProcess = spawn('node', [CLI_PATH, 'wizard', ...args], {
    cwd,
    env,
  });

  wizardProcess.stdoutMemory = '';
  wizardProcess.stderrMemory = '';
  let status = -1;
  wizardProcess.stdout.on('data', chunk => (wizardProcess.stdoutMemory += chunk.toString()));
  wizardProcess.stderr.on('data', chunk => (wizardProcess.stderrMemory += chunk.toString()));
  wizardProcess.on('exit', code => (status = code));

  try {
    await waitForCondition(
      () => wizardProcess.stdoutMemory.includes(inputWaitCondition),
      () =>
        `Output never contained "${inputWaitCondition}"\nSTDOUT: ${
          wizardProcess.stdoutMemory
        }\nSTDERR:${wizardProcess.stderrMemory}`
    );
    await writeAllInputs(wizardProcess, inputs);
    await waitForCondition(() => status >= 0).catch(() => undefined);
  } finally {
    wizardProcess.kill();
  }

  return {stdout: wizardProcess.stdoutMemory, stderr: wizardProcess.stderrMemory, status};
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
  runWizardCLI,
  runCLIWithoutWaiting,
  startServer,
  waitForCondition,
  waitForNonException,
  getSqlFilePath,
  safeDeleteFile,
  withTmpDir,
  cleanStdOutput,
  startFallbackServer,
  writeAllInputs,
};

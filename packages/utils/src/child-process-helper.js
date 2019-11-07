/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const treeKill = require('tree-kill');
const childProcess = require('child_process');

/** @param {number} pid */
async function killProcessTree(pid) {
  return new Promise((resolve, reject) => treeKill(pid, err => (err ? reject(err) : resolve())));
}

/**
 * @param {string} command
 * @param {RegExp} pattern
 * @param {{timeout?: number}} [opts]
 * @return {Promise<{child: import('child_process').ChildProcess, patternMatch: string|null}>}
 */
async function runCommandAndWaitForPattern(command, pattern, opts = {}) {
  const {timeout = 5000} = opts;

  /** @type {string|null} */
  let patternMatch = null;
  /** @type {() => void} */
  let resolve;
  /** @type {(e: Error) => void} */
  let reject;
  const timeoutPromise = new Promise(r => setTimeout(r, timeout));
  const foundStringPromise = new Promise((r1, r2) => {
    resolve = r1;
    reject = r2;
  });

  const child = childProcess.spawn(command, {stdio: 'pipe', shell: true});
  /** @param {Buffer} chunk */
  const stringListener = chunk => {
    const match = chunk.toString().match(pattern);
    patternMatch = patternMatch || (match && match[0]);
    if (match) resolve();
  };
  /** @param {number|null} code */
  const exitListener = code => {
    if (code !== 0) reject(new Error(`Command exited with code ${code}`));
  };

  child.on('exit', exitListener);
  child.stdout.on('data', stringListener);
  child.stderr.on('data', stringListener);
  await Promise.race([timeoutPromise, foundStringPromise]);
  child.stdout.off('data', stringListener);
  child.stderr.off('data', stringListener);
  child.off('exit', exitListener);

  return {child, patternMatch};
}

function getListOfRunningCommands() {
  return childProcess
    .spawnSync('ps', ['aux'])
    .stdout.toString()
    .split('\n')
    .map(line => line.split(/\d+:\d+\.\d+/)[1])
    .filter(Boolean)
    .map(command => command.trim());
}

module.exports = {
  killProcessTree,
  getListOfRunningCommands,
  runCommandAndWaitForPattern,
};

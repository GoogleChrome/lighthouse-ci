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
  return new Promise(resolve => treeKill(pid, resolve));
}

/**
 * @param {string} command
 * @param {RegExp} pattern
 * @param {{timeout?: number}} [opts]
 * @return {Promise<{child: import('child_process').ChildProcess, patternMatch: string|null, stdout: string, stderr: string}>}
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
  /** @type {Promise<void>} */
  const foundStringPromise = new Promise((r1, r2) => {
    resolve = r1;
    reject = r2;
  });
  const output = {stdout: '', stderr: ''};

  const child = childProcess.spawn(command, {stdio: 'pipe', shell: true});
  /** @param {'stdout'|'stderr'} channel @return {(chunk: Buffer) => void}  */
  const stringListener = channel => chunk => {
    const data = chunk.toString();
    output[channel] += data;
    const match = chunk.toString().match(pattern);
    patternMatch = patternMatch || (match && match[0]);
    if (match) resolve();
  };
  /** @param {number|null} code */
  const exitListener = code => {
    if (code !== 0) {
      const err = new Error(`Command exited with code ${code}`);
      Object.assign(err, output);
      reject(err);
    }
  };

  const stdoutListener = stringListener('stdout');
  const stderrListener = stringListener('stderr');

  child.on('exit', exitListener);
  child.stdout.on('data', stdoutListener);
  child.stderr.on('data', stderrListener);
  await Promise.race([timeoutPromise, foundStringPromise]);
  child.stdout.off('data', stdoutListener);
  child.stderr.off('data', stderrListener);
  child.off('exit', exitListener);

  return {child, patternMatch, ...output};
}

module.exports = {
  killProcessTree,
  runCommandAndWaitForPattern,
};

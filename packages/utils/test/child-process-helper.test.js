/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/* eslint-env jest */

const os = require('os');
const childProcess = require('child_process');
const childProcessHelper = require('../src/child-process-helper.js');

const IS_WINDOWS = os.platform() === 'win32';

jest.retryTimes(3);

function wait() {
  return new Promise(r => setTimeout(r, 100));
}

async function tryUntilPasses(fn, timeout = 5000) {
  const startedAt = Date.now();
  let lastError;
  while (Date.now() - startedAt < timeout) {
    try {
      await fn();
      return;
    } catch (err) {
      lastError = err;
      await wait();
    }
  }

  throw lastError;
}

function getListOfRunningCommands() {
  const psLines = childProcess
    .spawnSync('ps', ['aux'])
    .stdout.toString()
    .split('\n');

  return psLines
    .map(line => {
      if (line.includes('PID') && line.includes('COMMAND')) return '';

      const matches = line.split(/\s+\d+:\d+(\.\d+|:\d+)?/g);
      const match = matches[matches.length - 1];
      return match.trim();
    })
    .filter(Boolean)
    .map(command => command.trim());
}

describe('child-process-helper.js', () => {
  describe('#killProcessTree()', () => {
    let pid;

    afterEach(async () => {
      if (pid) await childProcessHelper.killProcessTree(pid);
    });

    it('should kill the child process', async () => {
      const command = 'sleep 11532';
      const commandPs = IS_WINDOWS ? '/usr/bin/sleep' : command;
      expect(getListOfRunningCommands()).not.toContain(commandPs);
      const child = childProcess.spawn(command, {shell: true});
      pid = child.pid;

      await tryUntilPasses(() => expect(getListOfRunningCommands()).toContain(commandPs));

      await childProcessHelper.killProcessTree(child.pid);
      pid = undefined;

      await tryUntilPasses(() => {
        expect(getListOfRunningCommands()).not.toContain(commandPs);
      });
    }, 15000);

    it('should kill the grandchild process', async () => {
      // FIXME: for some inexplicable reason this test cannot pass in Travis Windows
      if (os.platform() === 'win32') return;

      const command = 'sleep 9653';
      const commandPs = IS_WINDOWS ? '/usr/bin/sleep' : command;
      expect(getListOfRunningCommands()).not.toContain(commandPs);
      const child = childProcess.spawn(`${command} &\n${command}`, {shell: true});
      pid = child.pid;

      await tryUntilPasses(() => {
        const matching = getListOfRunningCommands().filter(c => c === command);
        expect(matching).toHaveLength(2);
      });

      await childProcessHelper.killProcessTree(child.pid);
      pid = undefined;

      await tryUntilPasses(() => {
        expect(getListOfRunningCommands()).not.toContain(commandPs);
      });
    }, 15000);
  });

  describe('#runCommandAndWaitForPattern()', () => {
    it('should run the command and resolve on pattern', async () => {
      const command = 'sleep 1 && echo Hello, World!';
      const pattern = 'Hello, World';
      const {child, patternMatch} = await childProcessHelper.runCommandAndWaitForPattern(
        command,
        pattern
      );
      await childProcessHelper.killProcessTree(child.pid);
      expect(patternMatch).toBeTruthy();
    });

    it('should run the command and resolve on timeout', async () => {
      const command = 'sleep 5 && echo "Hello, World!"';
      const pattern = 'Hello, World';
      const opts = {timeout: 1000};
      const {child, patternMatch} = await childProcessHelper.runCommandAndWaitForPattern(
        command,
        pattern,
        opts
      );
      await childProcessHelper.killProcessTree(child.pid);
      expect(patternMatch).toBeFalsy();
    }, 4000);

    it('should run the command and reject on failure', async () => {
      const command = 'exit 1';
      const pattern = 'Hello, World';
      const promise = childProcessHelper.runCommandAndWaitForPattern(command, pattern);
      await expect(promise).rejects.toBeTruthy();
    });
  });
});

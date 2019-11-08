/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/* eslint-env jest */

const childProcess = require('child_process');
const childProcessHelper = require('../src/child-process-helper.js');

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
      lastError = error;
      await wait();
    }
  }

  throw lastError;
}

describe('child-process-helper.js', () => {
  describe('#killProcessTree()', () => {
    it('should kill the child process', async () => {
      const command = 'sleep 11532';
      expect(childProcessHelper.getListOfRunningCommands()).not.toContain(command);
      const child = childProcess.spawn(command, {shell: true});
      await wait();

      await tryUntilPasses(() =>
        expect(childProcessHelper.getListOfRunningCommands()).toContain(command)
      );

      await childProcessHelper.killProcessTree(child.pid);

      await tryUntilPasses(() => {
        expect(childProcessHelper.getListOfRunningCommands()).not.toContain(command);
      });
    });

    it('should kill the grandchild process', async () => {
      const command = 'sleep 9653';
      expect(childProcessHelper.getListOfRunningCommands()).not.toContain(command);
      const child = childProcess.spawn(`${command} &\n${command}`, {shell: true});

      await tryUntilPasses(() => {
        const matching = childProcessHelper.getListOfRunningCommands().filter(c => c === command);
        expect(matching).toHaveLength(2);
      });

      await childProcessHelper.killProcessTree(child.pid);

      await tryUntilPasses(() => {
        expect(childProcessHelper.getListOfRunningCommands()).not.toContain(command);
      });
    });
  });

  describe('#runCommandAndWaitForPattern()', () => {
    it('should run the command and resolve on pattern', async () => {
      const command = 'sleep 1 && echo "Hello, World!"';
      const pattern = 'Hello, World';
      const {child} = await childProcessHelper.runCommandAndWaitForPattern(command, pattern);
      await childProcessHelper.killProcessTree(child.pid);
    });

    it('should run the command and resolve on timeout', async () => {
      const command = 'sleep 5 && echo "Hello, World!"';
      const pattern = 'Hello, World';
      const opts = {timeout: 1000};
      const {child} = await childProcessHelper.runCommandAndWaitForPattern(command, pattern, opts);
      await childProcessHelper.killProcessTree(child.pid);
    }, 4000);

    it('should run the command and reject on failure', async () => {
      const command = 'exit 1';
      const pattern = 'Hello, World';
      const promise = childProcessHelper.runCommandAndWaitForPattern(command, pattern);
      await expect(promise).rejects.toBeTruthy();
    });
  });
});

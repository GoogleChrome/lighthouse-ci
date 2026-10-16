/**
 * @license Copyright 2024 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/* eslint-env jest */

const {EventEmitter} = require('events');
const {PassThrough} = require('stream');
const childProcess = require('child_process');
const LighthouseRunner = require('../src/collect/node-runner.js');

describe('LighthouseRunner', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should not corrupt multi-byte UTF-8 characters split across stdout chunks', async () => {
    const lhrJson = '{"lighthouseVersion":"12.0.0","title":"スターバックス"}';
    const fullBuffer = Buffer.from(lhrJson, 'utf8');
    // 'ス' (U+30B9) is 3 bytes in UTF-8 (0xe3, 0x82, 0xb9) starting at byte offset 39.
    // Split right after the first byte of 'ス' (at byte 40).
    const splitIndex = 40;

    jest.spyOn(childProcess, 'spawn').mockImplementation(() => {
      const child = new EventEmitter();
      const stdout = new PassThrough();
      const stderr = new PassThrough();
      Object.assign(child, {stdout, stderr});

      process.nextTick(() => {
        stdout.write(fullBuffer.slice(0, splitIndex));
        stdout.write(fullBuffer.slice(splitIndex));
        stdout.end();
        stderr.end();
        child.emit('exit', 0);
      });

      return /** @type {any} */ (child);
    });

    const runner = new LighthouseRunner();
    const result = await runner.run('http://localhost:8080');

    expect(result).toBe(lhrJson);
    expect(result).not.toContain('\uFFFD');
  });

  it('should not corrupt multi-byte UTF-8 characters split across stderr chunks', async () => {
    const stderrText = 'Error on page: スターバックス';
    const fullBuffer = Buffer.from(stderrText, 'utf8');
    // 'ス' (U+30B9) is 3 bytes in UTF-8 (0xe3, 0x82, 0xb9) starting at byte offset 15.
    const splitIndex = 16;

    jest.spyOn(childProcess, 'spawn').mockImplementation(() => {
      const child = new EventEmitter();
      const stdout = new PassThrough();
      const stderr = new PassThrough();
      Object.assign(child, {stdout, stderr});

      process.nextTick(() => {
        stderr.write(fullBuffer.slice(0, splitIndex));
        stderr.write(fullBuffer.slice(splitIndex));
        stdout.end();
        stderr.end();
        child.emit('exit', 1);
      });

      return /** @type {any} */ (child);
    });

    const runner = new LighthouseRunner();
    await expect(runner.run('http://localhost:8080')).rejects.toMatchObject({
      message: 'Lighthouse failed with exit code 1',
      stderr: stderrText,
    });
  });
});

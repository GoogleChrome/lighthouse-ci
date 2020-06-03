/**
 * @license Copyright 2020 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/* eslint-env jest */

const path = require('path');
const {createServer} = require('./fixtures/psi/mock-psi-server.js');
const {runCLI} = require('./test-utils.js');

/** @typedef {ReturnType<createServer>} ServerPromise */

describe('Lighthouse CI collect CLI using PSI', () => {
  /** @type {LHCI.Unpromised<ServerPromise>} */
  let server;
  const cwd = path.join(__dirname, 'fixtures/psi');

  beforeAll(async () => {
    server = await createServer();
  });

  afterAll(async () => {
    await server.close();
  });

  it('should run lighthouse using PSI runner', async () => {
    const {stdout, stderr, status} = await runCLI(
      [
        'collect',
        '-n=1',
        '--method=psi',
        '--psi-api-key=secret-key',
        `--psi-api-endpoint=http://localhost:${server.port}/runPagespeed`,
        `--url=http://localhost:${server.port}`,
      ],
      {cwd: cwd}
    );

    expect(stdout).toMatchInlineSnapshot(`
      "Running Lighthouse 1 time(s) on http://localhost:XXXX
      Run #1...done.
      Done running Lighthouse!
      "
    `);
    expect(stderr).toMatchInlineSnapshot(`""`);
    expect(status).toEqual(0);
  }, 180000);

  it('should handle failure of lighthouse using PSI runner', async () => {
    const {stdout, stderr, status} = await runCLI(
      [
        'collect',
        '-n=1',
        '--method=psi',
        '--psi-api-key=invalid-key',
        `--psi-api-endpoint=http://localhost:${server.port}/runPagespeed`,
        `--url=http://localhost:${server.port}`,
      ],
      {cwd: cwd}
    );

    expect(stdout).toMatchInlineSnapshot(`
      "Running Lighthouse 1 time(s) on http://localhost:XXXX
      Run #1...failed!
      "
    `);
    expect(stderr).toMatchInlineSnapshot(`
      "Error: PSI Failed (UNKNOWN): Oops
          at PsiClient.run
          at process._tickCallback"
    `);
    expect(status).toEqual(1);
  }, 180000);
});

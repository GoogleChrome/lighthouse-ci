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
    console.log('starting server');
    server = await createServer();
    console.log('server up');
  });

  afterAll(async () => {
    await server.close();
  });

  it('should run lighthouse using PSI runner', async () => {
    console.log(server);
    await new Promise(r => setTimeout(r, 70000));
    const {stdout, stderr, status} = runCLI(
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
      "Started a web server with \\"node ./auth-server.js\\"...
      Running Lighthouse 1 time(s) on http://localhost:XXXX
      Run #1...done.
      Done running Lighthouse!
      "
    `);
    expect(stderr).toMatchInlineSnapshot(`
      "WARNING: collect.settings.chromeFlags option will be ignored.
      WARNING: If you want chromeFlags with puppeteerScript, use collect.puppeteerLaunchOptions.args option.
      "
    `);
    expect(status).toEqual(0);
  }, 180000);
});

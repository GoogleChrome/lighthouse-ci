/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/* eslint-env jest */

const {runCLI} = require('./test-utils.js');

describe('Lighthouse CI server CLI', () => {
  it('should print debug information when port is invalid from env', async () => {
    const {status, stderr} = await runCLI(['server'], {env: {LHCI_port: 'foo'}});
    expect(status).toEqual(1);
    expect(stderr).toMatchInlineSnapshot(`
      "Invalid port option \\"NaN\\"
      environment: LHCI_NO_LIGHTHOUSERC=\\"1\\", LHCI_port=\\"foo\\"
      process.argv: server
      simpleArgv: port=foo, p=undefined
      configFile: undefined
      "
    `);
  });

  it('should print debug information when port is invalid from args', async () => {
    const {status, stderr} = await runCLI(['server', '-p=foo']);
    expect(status).toEqual(1);
    expect(stderr).toMatchInlineSnapshot(`
      "Invalid port option \\"NaN\\"
      environment: LHCI_NO_LIGHTHOUSERC=\\"1\\"
      process.argv: server -p=foo
      simpleArgv: port=undefined, p=foo
      configFile: undefined
      "
    `);
  });

  it('should print debug information when port is invalid from config', async () => {
    const normalizePathsForWindows = stderr =>
      stderr
        .replace(__dirname, '.')
        .replace(__dirname, '.')
        .replace(/\\/g, '/');

    const {status, stderr} = await runCLI([
      'server',
      '--config',
      `${__dirname}/fixtures/lighthouserc-invalid-port.json`,
    ]);
    expect(status).toEqual(1);
    expect(normalizePathsForWindows(stderr)).toMatchInlineSnapshot(`
      "Invalid port option \\"NaN\\"
      environment: LHCI_NO_LIGHTHOUSERC=\\"1\\"
      process.argv: server --config ./fixtures/lighthouserc-invalid-port.json
      simpleArgv: port=undefined, p=undefined
      configFile: ./fixtures/lighthouserc-invalid-port.json
      "
    `);
  });
});

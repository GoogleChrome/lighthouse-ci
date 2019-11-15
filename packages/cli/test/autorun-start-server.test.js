/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

jest.retryTimes(3);

/* eslint-env jest */

const path = require('path');
const {runCLI} = require('./test-utils.js');

describe('Lighthouse CI autorun CLI with startServerCommand', () => {
  const autorunDir = path.join(__dirname, 'fixtures/autorun-start-server');

  it('should run all three steps', () => {
    const {stdout, stderr, status} = runCLI(
      [
        'autorun',
        '--collect.url=http://localhost:52425',
        '--collect.n=2',
        '--assert.assertions.viewport=error',
      ],
      {cwd: autorunDir}
    );

    expect(stdout).toMatchInlineSnapshot(`
      "✅  .lighthouseci/ directory writable
      ⚠️   Configuration file found
      Healthcheck passed!

      Started a web server with \\"node autorun-server.js\\"...
      Running Lighthouse 2 time(s) on http://localhost:XXXX
      Run #1...done.
      Run #2...done.
      Done running Lighthouse!


      "
    `);
    expect(stderr).toMatchInlineSnapshot(`
      "Checking assertions against 1 URL(s), 2 total run(s)

      1 result(s) for [1mhttp://localhost:XXXX/[0m

        [31mX[0m  [1mviewport[0m failure for [1mminScore[0m assertion
           Does not have a \`<meta name=\\"viewport\\">\` tag with \`width\` or \`initial-scale\`
           Documentation: https://web.dev/viewport

              expected: >=[32m1[0m
                 found: [31m0[0m
            [2mall values: 0, 0[0m

      Assertion failed. Exiting with status code 1.
      assert command failed. Exiting with status code 1.
      "
    `);
    expect(status).toEqual(1);
  }, 180000);
});

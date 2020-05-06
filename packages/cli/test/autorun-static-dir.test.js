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

describe('Lighthouse CI autorun CLI', () => {
  const autorunDir = path.join(__dirname, 'fixtures/autorun-static-dir');

  it('should run all three steps', () => {
    const {stdout, stderr, status} = runCLI(['autorun', '--collect.numberOfRuns=2'], {
      cwd: autorunDir,
      env: {LHCI_NO_LIGHTHOUSERC: undefined},
    });

    const stdoutClean = stdout.replace(/Open the report at.*\n/, 'Open the report at <link>\n');
    expect(stdoutClean).toMatchInlineSnapshot(`
      "✅  .lighthouseci/ directory writable
      ✅  Configuration file found
      ✅  Chrome installation found
      ⚠️   GitHub token not set
      Healthcheck passed!

      Automatically determined ./build as \`staticDistDir\`.
      Set it explicitly in lighthouserc.json if incorrect.

      Started a web server on port XXXX...
      Running Lighthouse 2 time(s) on http://localhost:XXXX/good.html
      Run #1...done.
      Run #2...done.
      Done running Lighthouse!


      Uploading median LHR of http://localhost:XXXX/good.html...success!
      Open the report at <link>
      No GitHub token set, skipping GitHub status check.

      "
    `);
    expect(stderr).toMatchInlineSnapshot(`
      "Checking assertions against 1 URL(s), 2 total run(s)

      1 result(s) for [1mhttp://localhost:XXXX/good.html[0m :

        [31mX[0m  [1mviewport[0m failure for [1mminScore[0m assertion
             Does not have a \`<meta name=\\"viewport\\">\` tag with \`width\` or \`initial-scale\`
             https://web.dev/viewport

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

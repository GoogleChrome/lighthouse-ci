/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/* eslint-env jest */

const path = require('path');
const {spawnSync} = require('child_process');
const {CLI_PATH} = require('./test-utils.js');

describe('Lighthouse CI autorun CLI', () => {
  const autorunDir = path.join(__dirname, 'fixtures/autorun');
  const rcFile = path.join(autorunDir, 'lighthouserc-autorun.json');

  it('should run all three steps', () => {
    let {stdout = '', stderr = '', status = -1} = spawnSync(
      CLI_PATH,
      ['autorun', `--rc-file=${rcFile}`],
      {cwd: autorunDir, env: {...process.env, LHCI_GITHUB_TOKEN: ''}}
    );

    stdout = stdout.toString();
    stderr = stderr.toString();
    status = status || 0;

    const stdoutClean = stdout
      .replace(/:\d{4,6}/g, ':XXXX')
      .replace(/port \d{4,6}/, 'port XXXX')
      .replace(/Open the report at.*\n/, 'Open the report at <link>\n');
    const stderrClean = stderr.replace(/:\d{4,6}/g, ':XXXX').replace(/port \d{4,6}/, 'port XXXX');
    expect(stdoutClean).toMatchInlineSnapshot(`
      "
      ✅  .lighthouseci/ directory writable
      ✅  Ancestor hash determinable
      ⚠️   GitHub token set
      Healthcheck passed!

      Automatically determined ./build as \`buildDir\`.
      Set it explicitly in lighthouserc.json if incorrect.

      Started a web server on port XXXX...
      Running Lighthouse 3 time(s) on http://localhost:XXXX/good.html
      Run #1...done.
      Run #2...done.
      Run #3...done.
      Done running Lighthouse!


      Uploading median LHR of http://localhost:XXXX/good.html...success!
      Open the report at <link>
      No GitHub token set, skipping status check.

      "
    `);
    expect(stderrClean).toMatchInlineSnapshot(`
      "
      Checking assertions against 1 URL(s), 3 total run(s)

      1 result(s) for [1mhttp://localhost:XXXX/good.html[0m

        [31m✘[0m  [1mviewport[0m failure for [1mminScore[0m assertion
           Does not have a \`<meta name=\\"viewport\\">\` tag with \`width\` or \`initial-scale\`
           Documentation: https://web.dev/viewport

              expected: >=[32m1[0m
                 found: [31m0[0m
            [2mall values: 0, 0, 0[0m

      Assertion failed. Exiting with status code 1.

      assert command failed. Exiting with status code 1.
      "
    `);
    expect(status).toEqual(1);
  }, 180000);
});

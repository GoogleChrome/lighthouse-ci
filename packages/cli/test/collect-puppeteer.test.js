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

describe('Lighthouse CI collect CLI with puppeteer', () => {
  const autorunDir = path.join(__dirname, 'fixtures/puppeteer');

  it('should run lighthouse on an auth page', () => {
    const {stdout, stderr, status} = runCLI(
      [
        'collect',
        '-n=1',
        '--url=http://localhost:52426',
        '--start-server-command=node ./auth-server.js',
        '--puppeteer-script=./auth-server-script.js',
      ],
      {cwd: autorunDir}
    );

    // The server above will return a 401 Unauthorized when the login script isn't invoked.
    // 4xx and 5xx status codes cause Lighthouse to exit with 1 and collect to fail.
    // Just succeeding here is enough to signal that our login script worked.
    expect(stdout).toMatchInlineSnapshot(`
      "Started a web server with \\"node ./auth-server.js\\"...
      Running Lighthouse 1 time(s) on http://localhost:XXXX
      Run #1...done.
      Done running Lighthouse!
      "
    `);
    expect(stderr).toMatchInlineSnapshot(`""`);
    expect(status).toEqual(0);
  }, 180000);
});

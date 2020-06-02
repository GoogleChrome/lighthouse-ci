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

describe('Lighthouse CI collect CLI', () => {
  const staticDistDir = path.join(__dirname, 'fixtures/collect-static-dir-with-urls');

  it('should collect a static dir with explicit URLs', async () => {
    const {stdout, stderr, status} = await runCLI(
      ['collect', '-n=1', '--staticDistDir=./', '--url=/child/grandchild.html'],
      {
        cwd: staticDistDir,
      }
    );

    expect(stdout).toMatchInlineSnapshot(`
      "Started a web server on port XXXX...
      Running Lighthouse 1 time(s) on http://localhost:XXXX/child/grandchild.html
      Run #1...done.
      Done running Lighthouse!
      "
    `);
    expect(stderr).toMatchInlineSnapshot(`""`);
    expect(status).toEqual(0);
  }, 180000);
});

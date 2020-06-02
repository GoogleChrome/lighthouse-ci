/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

jest.retryTimes(3);

/* eslint-env jest */

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const {runCLI} = require('./test-utils.js');

describe('Lighthouse CI collect CLI with puppeteer', () => {
  const autorunDir = path.join(__dirname, 'fixtures/puppeteer');

  it('should run lighthouse on an auth page', async () => {
    const {stdout, stderr, status} = await runCLI(
      [
        'collect',
        '-n=1',
        '--url=http://localhost:52426',
        '--start-server-command=node ./auth-server.js',
        '--settings.emulatedFormFactor=none',
        '--settings.chromeFlags="user-agent=lighthouseci"',
        '--puppeteer-script=./auth-server-script.js',
        '--puppeteer-launch-options.args=--no-sandbox',
        '--puppeteer-launch-options.args=--user-agent=lighthouseci',
      ],
      {cwd: autorunDir}
    );

    // The server above will return a 401 Unauthorized when the login script isn't invoked.
    // The server above will return a 500 Server Error when the user agent isn't passed.
    // 4xx and 5xx status codes cause Lighthouse to exit with 1 and collect to fail.
    // Just succeeding here is enough to signal that our login script worked.
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

  it('should run lighthouse using puppeteers chromium without puppeteer script', async () => {
    const {stdout, stderr, status} = await runCLI(
      [
        'collect',
        '-n=1',
        '--url=http://localhost:52426/public',
        '--start-server-command=node ./auth-server.js',
        `--chrome-path=${puppeteer.executablePath()}`,
      ],
      {cwd: autorunDir}
    );

    expect(stdout).toMatchInlineSnapshot(`
      "Started a web server with \\"node ./auth-server.js\\"...
      Running Lighthouse 1 time(s) on http://localhost:XXXX/public
      Run #1...done.
      Done running Lighthouse!
      "
    `);
    expect(stderr).toMatchInlineSnapshot(`""`);
    expect(status).toEqual(0);

    const files = fs.readdirSync(path.join(autorunDir, '.lighthouseci'));
    const report = files.find(file => /lhr.*\.json$/.test(file));
    const lhr = JSON.parse(fs.readFileSync(path.join(autorunDir, '.lighthouseci', report)));
    expect(lhr.userAgent).toContain('HeadlessChrome/77.0.3835.0'); // make sure the right chrome was used
  }, 180000);

  it('should not fail on providing defaults without Chrome installations', async () => {
    const {stdout, stderr, status} = await runCLI(['collect', '--help'], {
      cwd: autorunDir,
      env: {LHCITEST_IGNORE_CHROME_INSTALLATIONS: '1'},
    });

    // Make sure there is no default chromePath found
    const chromePathHelp = stdout.match(/--chromePath.*\n.*\n.*/);
    expect(chromePathHelp).toMatchInlineSnapshot(`
      Array [
        "--chromePath               The path to the Chrome or Chromium executable to use for collection.
        --puppeteerScript          The path to a script that manipulates the browser with puppeteer before running Lighthouse, used for auth.
        --puppeteerLaunchOptions   The object of puppeteer launch options",
      ]
    `);
    expect(stderr).toMatchInlineSnapshot(`""`);
    expect(status).toEqual(0);
  });
});

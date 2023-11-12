/**
 * @license Copyright 2021 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/* eslint-env jest */

const path = require('path');
const rimraf = require('rimraf');
const fs = require('fs');

const ApiClient = require('@lhci/utils/src/api-client.js');

const {
  createServer: createGithubServer,
} = require('./fixtures/autorun-github/mock-github-server.js');
const {runCLI, startServer, safeDeleteFile} = require('./test-utils.js');

describe('Lighthouse CI autorun CLI with GitHub status check', () => {
  const autorunDir = path.join(__dirname, 'fixtures/autorun-github');
  const lighthouseciDir = path.join(autorunDir, '.lighthouseci');

  let server;
  let serverBaseUrl;
  let apiClient;
  let project;

  let githubServer;

  beforeAll(async () => {
    if (fs.existsSync(lighthouseciDir)) rimraf.sync(lighthouseciDir);
    githubServer = await createGithubServer();

    server = await startServer();
    serverBaseUrl = `http://localhost:${server.port}/`;

    apiClient = new ApiClient({rootURL: serverBaseUrl});
    project = await apiClient.createProject({name: 'Test'});
  });

  afterAll(async () => {
    if (server) {
      server.process.kill();
      await safeDeleteFile(server.sqlFile);
    }
    if (githubServer) {
      await githubServer.close();
    }
  });

  it('should submit status check to GitHub', async () => {
    const {stdout, stderr, status} = await runCLI(
      [
        'autorun',
        '--upload.githubToken=githubToken',
        `--upload.githubApiHost=http://localhost:${githubServer.port}`,
        `--upload.serverBaseUrl=${serverBaseUrl}`,
        `--upload.token=${project.token}`,
      ],
      {
        cwd: autorunDir,
        env: {
          LHCI_BUILD_CONTEXT__CURRENT_HASH: 'hash',
          LHCI_BUILD_CONTEXT__GITHUB_REPO_SLUG: 'GoogleChrome/lighthouse-ci',
          LHCI_NO_LIGHTHOUSERC: undefined,
        },
      }
    );

    expect(stdout).toMatchInlineSnapshot(`
      "✅  .lighthouseci/ directory writable
      ✅  Configuration file found
      ✅  Chrome installation found
      ⚠️   GitHub token not set
      Healthcheck passed!

      Automatically determined ./build as \`staticDistDir\`.
      Set it explicitly in lighthouserc.json if incorrect.

      Started a web server on port XXXX...
      Running Lighthouse 1 time(s) on http://localhost:XXXX/bad.html
      Run #1...done.
      Running Lighthouse 1 time(s) on http://localhost:XXXX/good.html
      Run #1...done.
      Done running Lighthouse!


      Uploading median LHR of http://localhost:XXXX/bad.html...success!
      Open the report at https://storage.googleapis.com/lighthouse-infrastructure.appspot.com/reports/XXXX-XXXX.report.html
      Uploading median LHR of http://localhost:XXXX/good.html...success!
      Open the report at https://storage.googleapis.com/lighthouse-infrastructure.appspot.com/reports/XXXX-XXXX.report.html
      GitHub token found, attempting to set status...
      GitHub accepted "failure" status for "lhci/url/bad.html".
      GitHub accepted "success" status for "lhci/url/good.html".

      "
    `);
    expect(stderr).toMatchInlineSnapshot(`
      "Checking assertions against 2 URL(s), 2 total run(s)

      1 result(s) for [1mhttp://localhost:XXXX/bad.html[0m :

        [31mX[0m  [1mviewport[0m failure for [1mminScore[0m assertion
             Does not have a \`<meta name="viewport">\` tag with \`width\` or \`initial-scale\`
             https://developer.chrome.com/docs/lighthouse/pwa/viewport/

              expected: >=[32m0.9[0m
                 found: [31m0[0m
            [2mall values: 0[0m

      1 result(s) for [1mhttp://localhost:XXXX/good.html[0m :

        ✅  [1mviewport[0m passing for [1mminScore[0m assertion
             Has a \`<meta name="viewport">\` tag with \`width\` or \`initial-scale\`
             https://developer.chrome.com/docs/lighthouse/pwa/viewport/

              expected: >=[32m0.9[0m
                 found: [32m1[0m
            [2mall values: 1[0m

      Assertion failed. Exiting with status code 1.
      assert command failed. Exiting with status code 1.
      "
    `);
    expect(status).toEqual(1);
  }, 180000);

  it('should submit status check to GitHub with invalid token', async () => {
    const {stdout, stderr, status} = await runCLI(
      [
        'autorun',
        '--upload.githubToken=invalidToken',
        `--upload.githubApiHost=http://localhost:${githubServer.port}`,
        `--upload.serverBaseUrl=${serverBaseUrl}`,
        `--upload.token=${project.token}`,
      ],
      {
        cwd: autorunDir,
        env: {
          LHCI_BUILD_CONTEXT__CURRENT_HASH: 'hash',
          LHCI_BUILD_CONTEXT__GITHUB_REPO_SLUG: 'GoogleChrome/lighthouse-ci',
          LHCI_NO_LIGHTHOUSERC: undefined,
        },
      }
    );

    expect(stdout).toMatchInlineSnapshot(`
      "✅  .lighthouseci/ directory writable
      ✅  Configuration file found
      ✅  Chrome installation found
      ⚠️   GitHub token not set
      Healthcheck passed!

      Automatically determined ./build as \`staticDistDir\`.
      Set it explicitly in lighthouserc.json if incorrect.

      Started a web server on port XXXX...
      Running Lighthouse 1 time(s) on http://localhost:XXXX/bad.html
      Run #1...done.
      Running Lighthouse 1 time(s) on http://localhost:XXXX/good.html
      Run #1...done.
      Done running Lighthouse!


      Uploading median LHR of http://localhost:XXXX/bad.html...success!
      Open the report at https://storage.googleapis.com/lighthouse-infrastructure.appspot.com/reports/XXXX-XXXX.report.html
      Uploading median LHR of http://localhost:XXXX/good.html...success!
      Open the report at https://storage.googleapis.com/lighthouse-infrastructure.appspot.com/reports/XXXX-XXXX.report.html
      GitHub token found, attempting to set status...
      GitHub responded with 401


      GitHub responded with 401



      "
    `);
    expect(stderr).toMatchInlineSnapshot(`
      "Checking assertions against 2 URL(s), 2 total run(s)

      1 result(s) for [1mhttp://localhost:XXXX/bad.html[0m :

        [31mX[0m  [1mviewport[0m failure for [1mminScore[0m assertion
             Does not have a \`<meta name="viewport">\` tag with \`width\` or \`initial-scale\`
             https://developer.chrome.com/docs/lighthouse/pwa/viewport/

              expected: >=[32m0.9[0m
                 found: [31m0[0m
            [2mall values: 0[0m

      1 result(s) for [1mhttp://localhost:XXXX/good.html[0m :

        ✅  [1mviewport[0m passing for [1mminScore[0m assertion
             Has a \`<meta name="viewport">\` tag with \`width\` or \`initial-scale\`
             https://developer.chrome.com/docs/lighthouse/pwa/viewport/

              expected: >=[32m0.9[0m
                 found: [32m1[0m
            [2mall values: 1[0m

      Assertion failed. Exiting with status code 1.
      assert command failed. Exiting with status code 1.
      "
    `);
    expect(status).toEqual(1);
  }, 180000);
});

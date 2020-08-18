/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/* eslint-env jest */

const fs = require('fs');
const os = require('os');
const path = require('path');
const ApiClient = require('@lhci/utils/src/api-client.js');
const {runCLI, startServer, safeDeleteFile} = require('./test-utils.js');

describe('Lighthouse CI autorun CLI with startServerCommand', () => {
  const autorunDir = path.join(__dirname, 'fixtures/autorun-start-server');
  let server;
  let serverBaseUrl;
  let project;
  let tmpConfigFile;

  beforeAll(async () => {
    server = await startServer(undefined, ['--basicAuth.password=foobar']);
    serverBaseUrl = `http://localhost:${server.port}/`;
    const apiClient = new ApiClient({rootURL: serverBaseUrl, basicAuth: {password: 'foobar'}});
    project = await apiClient.createProject({name: 'Test'});

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lighthouse-ci-'));
    tmpConfigFile = path.join(tmpDir, 'config.json');
  });

  afterAll(async () => {
    await safeDeleteFile(tmpConfigFile);

    if (server) {
      await server.process.kill();
      await safeDeleteFile(server.sqlFile);
    }
  });

  it('should run all three steps', async () => {
    const {stdout, stderr, status} = await runCLI(
      [
        'autorun',
        '--collect.url=http://localhost:52425',
        '--collect.n=1',
        '--assert.assertions.viewport=error',
      ],
      {cwd: autorunDir}
    );

    expect(stdout).toMatchInlineSnapshot(`
      "✅  .lighthouseci/ directory writable
      ⚠️   Configuration file not found
      ✅  Chrome installation found
      Healthcheck passed!

      Started a web server with \\"node autorun-server.js\\"...
      Running Lighthouse 1 time(s) on http://localhost:XXXX
      Run #1...done.
      Done running Lighthouse!


      "
    `);
    expect(stderr).toMatchInlineSnapshot(`
      "Checking assertions against 1 URL(s), 1 total run(s)

      1 result(s) for [1mhttp://localhost:XXXX/[0m :

        [31mX[0m  [1mviewport[0m failure for [1mminScore[0m assertion
             Does not have a \`<meta name=\\"viewport\\">\` tag with \`width\` or \`initial-scale\`
             https://web.dev/viewport/

              expected: >=[32m0.9[0m
                 found: [31m0[0m
            [2mall values: 0[0m

      Assertion failed. Exiting with status code 1.
      assert command failed. Exiting with status code 1.
      "
    `);
    expect(status).toEqual(1);
  }, 180000);

  it('should run all three steps on an authenticated server', async () => {
    const config = {
      collect: {url: 'http://localhost:52425', numberOfRuns: 1},
      upload: {serverBaseUrl, token: project.token, basicAuth: {password: 'foobar'}},
    };

    fs.writeFileSync(tmpConfigFile, JSON.stringify({ci: config}));

    const {stdout, stderr, status} = await runCLI(['autorun', `--config=${tmpConfigFile}`], {
      cwd: autorunDir,
    });

    expect(stdout).toMatchInlineSnapshot(`
      "✅  .lighthouseci/ directory writable
      ✅  Configuration file found
      ✅  Chrome installation found
      ⚠️   GitHub token not set
      ✅  Ancestor hash determinable
      ✅  LHCI server reachable
      ✅  LHCI server API-compatible
      ✅  LHCI server token valid
      ✅  LHCI server unique build for this hash
      Healthcheck passed!

      Started a web server with \\"node autorun-server.js\\"...
      Running Lighthouse 1 time(s) on http://localhost:XXXX
      Run #1...done.
      Done running Lighthouse!

      Saving CI project Test (<UUID>)
      Saving CI build (<UUID>)
      Saved LHR to http://localhost:XXXX/ (<UUID>)
      Done saving build results to Lighthouse CI
      View build diff at http://localhost:XXXX/app/projects/test/compare/<UUID>
      No GitHub token set, skipping GitHub status check.

      Done running autorun.
      "
    `);
    expect(stderr).toMatchInlineSnapshot(`""`);
    expect(status).toEqual(0);
  }, 180000);
});

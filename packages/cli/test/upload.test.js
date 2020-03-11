/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/* eslint-env jest */

const fs = require('fs');
const path = require('path');
const rimraf = require('rimraf');
const ApiClient = require('@lhci/utils/src/api-client.js');
const fullPreset = require('@lhci/utils/src/presets/all.js');
const {runCLI, startServer, safeDeleteFile} = require('./test-utils.js');

describe('Lighthouse CI upload CLI', () => {
  const uploadDir = path.join(__dirname, 'fixtures/uploads');

  const writeLhr = () => {
    const lighthouseciDir = path.join(uploadDir, '.lighthouseci');
    if (fs.existsSync(lighthouseciDir)) rimraf.sync(lighthouseciDir);
    if (!fs.existsSync(lighthouseciDir)) fs.mkdirSync(lighthouseciDir, {recursive: true});
    const fakeLhrPath = path.join(lighthouseciDir, 'lhr-12345.json');
    const fakeLhr = {finalUrl: 'foo.com', categories: {}, audits: {}};
    fakeLhr.categories.pwa = {score: 0};
    fakeLhr.audits['performance-budget'] = {score: 0};
    for (const key of Object.keys(fullPreset.assertions)) {
      fakeLhr.audits[key] = {score: 1, details: {items: [{}]}};
    }

    fs.writeFileSync(fakeLhrPath, JSON.stringify(fakeLhr));
  };

  let server;
  let serverBaseUrl;
  let apiClient;
  let project;

  beforeAll(async () => {
    writeLhr();
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
  });

  it('should upload for a build', async () => {
    expect(await apiClient.getBuilds(project.id)).toHaveLength(0);

    const {stdout, stderr, status} = runCLI(
      ['upload', `--serverBaseUrl=${serverBaseUrl}`, `--token=${project.token}`],
      {
        cwd: uploadDir,
      }
    );

    expect(await apiClient.getBuilds(project.id)).toHaveLength(1);

    expect(stdout).toMatchInlineSnapshot(`
      "Saving CI project Test (<UUID>)
      Saving CI build (<UUID>)
      Saved LHR to http://localhost:XXXX/ (<UUID>)
      Done saving build results to Lighthouse CI
      View build diff at http://localhost:XXXX/app/projects/test/compare/<UUID>
      No GitHub token set, skipping.
      "
    `);
    expect(stderr).toMatchInlineSnapshot(`""`);
    expect(status).toEqual(0);
  }, 15000);

  it('should fail a duplicate upload for a build', async () => {
    expect(await apiClient.getBuilds(project.id)).toHaveLength(1);

    const {stdout, stderr, status} = runCLI(
      ['upload', `--serverBaseUrl=${serverBaseUrl}`, `--token=${project.token}`],
      {
        cwd: uploadDir,
      }
    );

    expect(await apiClient.getBuilds(project.id)).toHaveLength(1);

    expect(stdout).toMatchInlineSnapshot(`""`);
    expect(stderr).toMatchInlineSnapshot(`
      "Error: Unexpected status code 422
        {\\"message\\":\\"Build already exists for hash \\\\\\"<UUID>f667\\\\\\"\\"}
          at ApiClient._convertFetchResponseToReturnValue (/Users/patrick/Code/OpenSource/lighthouse-ci/packages/utils/src/api-client.js:61:21)
          at process._tickCallback (internal/process/next_tick.js:68:7)"
    `);
    expect(status).toEqual(1);
  }, 15000);

  it('should ignore a duplicate upload for a build with flag', async () => {
    expect(await apiClient.getBuilds(project.id)).toHaveLength(1);

    const {stdout, stderr, status} = runCLI(
      [
        'upload',
        `--serverBaseUrl=${serverBaseUrl}`,
        `--token=${project.token}`,
        '--ignoreDuplicateBuildFailure',
      ],
      {
        cwd: uploadDir,
      }
    );

    expect(await apiClient.getBuilds(project.id)).toHaveLength(1);

    expect(stdout).toMatchInlineSnapshot(
      `"Build already exists but ignore requested via options, skipping upload..."`
    );
    expect(stderr).toMatchInlineSnapshot(`""`);
    expect(status).toEqual(0);
  }, 15000);
});

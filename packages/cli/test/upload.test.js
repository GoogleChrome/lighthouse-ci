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
    process.env.LHCI_BUILD_CONTEXT__CURRENT_HASH = 'e7f1b0fa3aebb6ef95e44c0d0b820433ffdd2e63';
    process.env.LHCI_BUILD_CONTEXT__ANCESTOR_HASH = 'e7f1b0fa3aebb6ef95e44c0d0b820433ffdd2e63';

    writeLhr();
    server = await startServer();
    serverBaseUrl = `http://localhost:${server.port}/`;

    apiClient = new ApiClient({rootURL: serverBaseUrl});
    project = await apiClient.createProject({name: 'Test'});
  });

  afterAll(async () => {
    process.env.LHCI_BUILD_CONTEXT__CURRENT_HASH = undefined;
    process.env.LHCI_BUILD_CONTEXT__ANCESTOR_HASH = undefined;

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

    expect(stdout).toMatchInlineSnapshot(`
      "Saving CI project Test (<UUID>)
      Saving CI build (<UUID>)
      Saved LHR to http://localhost:XXXX/ (<UUID>)
      Done saving build results to Lighthouse CI
      View build diff at http://localhost:XXXX/app/projects/test/compare/<UUID>
      No GitHub token set, skipping GitHub status check.
      "
    `);
    expect(stderr).toMatchInlineSnapshot(`""`);
    expect(status).toEqual(0);

    expect(await apiClient.getBuilds(project.id)).toHaveLength(1);
  }, 15000);

  it('should fail a duplicate upload for a build', async () => {
    expect(await apiClient.getBuilds(project.id)).toHaveLength(1);

    const {stdout, stderr, status} = runCLI(
      ['upload', `--serverBaseUrl=${serverBaseUrl}`, `--token=${project.token}`],
      {
        cwd: uploadDir,
      }
    );

    expect(stdout).toMatchInlineSnapshot(`""`);
    expect(stderr).toMatch(/Build already exists for hash/);
    expect(status).toEqual(1);

    expect(await apiClient.getBuilds(project.id)).toHaveLength(1);
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

    expect(stdout).toMatchInlineSnapshot(
      `"Build already exists but ignore requested via options, skipping upload..."`
    );
    expect(stderr).toMatchInlineSnapshot(`""`);
    expect(status).toEqual(0);

    expect(await apiClient.getBuilds(project.id)).toHaveLength(1);
  }, 15000);
});

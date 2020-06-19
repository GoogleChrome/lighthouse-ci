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
  const lighthouseciDir = path.join(uploadDir, '.lighthouseci');
  const fakeLhrPath = path.join(lighthouseciDir, 'lhr-12345.json');

  const writeLhr = () => {
    const fakeLhr = {finalUrl: 'foo.com', categories: {}, audits: {}};
    fakeLhr.categories.pwa = {score: 0};
    fakeLhr.categories.performance = {score: 0};
    fakeLhr.audits['performance-budget'] = {score: 0};
    for (const key of Object.keys(fullPreset.assertions)) {
      fakeLhr.audits[key] = {score: 1, numericValue: 1000, details: {items: [{}]}};
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

    if (fs.existsSync(lighthouseciDir)) rimraf.sync(lighthouseciDir);
    if (!fs.existsSync(lighthouseciDir)) fs.mkdirSync(lighthouseciDir, {recursive: true});

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

    const {stdout, stderr, status} = await runCLI(
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

    const {stdout, stderr, status} = await runCLI(
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

    const {stdout, stderr, status} = await runCLI(
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

  it('should upload for a build with very long URL', async () => {
    const lhr = JSON.parse(fs.readFileSync(fakeLhrPath, 'utf8'));
    lhr.finalUrl = `http://localhost/reall${'l'.repeat(256)}y-long-url`;
    fs.writeFileSync(fakeLhrPath, JSON.stringify(lhr));

    expect(await apiClient.getBuilds(project.id)).toHaveLength(1);

    const {stdout, stderr, status} = await runCLI(
      ['upload', `--serverBaseUrl=${serverBaseUrl}`, `--token=${project.token}`],
      {
        cwd: uploadDir,
        env: {
          LHCI_BUILD_CONTEXT__CURRENT_HASH: 'cde4a48118a9be48e914c656591301ebed6972db',
        },
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
    expect(stderr).toMatchInlineSnapshot(
      `"WARNING: audited URL exceeds character limits, truncation possible."`
    );
    expect(status).toEqual(0);

    expect(await apiClient.getBuilds(project.id)).toHaveLength(2);
  }, 15000);

  it('should support target=filesystem', async () => {
    const lhr = JSON.parse(fs.readFileSync(fakeLhrPath, 'utf8'));
    lhr.finalUrl = `https://www.example.com/page`;
    lhr.fetchTime = '2020-05-22T22:12:01.000Z';
    lhr.audits['first-contentful-paint'].numericValue = 900;
    fs.writeFileSync(fakeLhrPath.replace(/lhr-\d+/, 'lhr-1'), JSON.stringify(lhr));
    lhr.fetchTime = '2020-05-22T22:12:02.000Z';
    lhr.audits['first-contentful-paint'].numericValue = 1100;
    fs.writeFileSync(fakeLhrPath.replace(/lhr-\d+/, 'lhr-2'), JSON.stringify(lhr));
    // This is the median run now
    lhr.fetchTime = '2020-05-22T22:12:03.000Z';
    lhr.categories.performance = {score: 0.5};
    lhr.audits['first-contentful-paint'].numericValue = 1000;
    fs.writeFileSync(fakeLhrPath.replace(/lhr-\d+/, 'lhr-3'), JSON.stringify(lhr));
    fs.unlinkSync(fakeLhrPath);

    const {stdout, stderr, status} = await runCLI(
      ['upload', `--target=filesystem`, `--outputDir=.lighthouseci/targetfs`],
      {cwd: uploadDir}
    );

    expect(stdout.replace(/at .*\.\.\./, 'at FOLDER...')).toMatchInlineSnapshot(`
      "Dumping 3 reports to disk at FOLDER...
      Done writing reports to disk.
      "
    `);
    expect(stderr).toMatchInlineSnapshot(`""`);
    expect(status).toEqual(0);

    const outputDir = path.join(uploadDir, '.lighthouseci/targetfs');
    const files = fs.readdirSync(outputDir).sort();
    expect(files).toEqual([
      'manifest.json',
      'www_example_com-_page-2020_05_22_22_12_01.report.html',
      'www_example_com-_page-2020_05_22_22_12_01.report.json',
      'www_example_com-_page-2020_05_22_22_12_02.report.html',
      'www_example_com-_page-2020_05_22_22_12_02.report.json',
      'www_example_com-_page-2020_05_22_22_12_03.report.html',
      'www_example_com-_page-2020_05_22_22_12_03.report.json',
    ]);

    const manifest = JSON.parse(fs.readFileSync(path.join(outputDir, 'manifest.json'), 'utf8'));
    expect(manifest).toEqual([
      {
        url: 'https://www.example.com/page',
        isRepresentativeRun: false,
        htmlPath: path.join(outputDir, 'www_example_com-_page-2020_05_22_22_12_01.report.html'),
        jsonPath: path.join(outputDir, 'www_example_com-_page-2020_05_22_22_12_01.report.json'),
        summary: {performance: 0, pwa: 0},
      },
      {
        url: 'https://www.example.com/page',
        isRepresentativeRun: false,
        htmlPath: path.join(outputDir, 'www_example_com-_page-2020_05_22_22_12_02.report.html'),
        jsonPath: path.join(outputDir, 'www_example_com-_page-2020_05_22_22_12_02.report.json'),
        summary: {performance: 0, pwa: 0},
      },
      {
        url: 'https://www.example.com/page',
        isRepresentativeRun: true,
        htmlPath: path.join(outputDir, 'www_example_com-_page-2020_05_22_22_12_03.report.html'),
        jsonPath: path.join(outputDir, 'www_example_com-_page-2020_05_22_22_12_03.report.json'),
        summary: {performance: 0.5, pwa: 0},
      },
    ]);
  }, 15000);
});

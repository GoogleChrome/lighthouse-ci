/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/* eslint-env jest */

const fs = require('fs');
const path = require('path');
const runServer = require('../../src/server/server.js').runCommand;
const fetch = require('isomorphic-fetch');

describe('Lighthouse CI Server', () => {
  let rootURL = '';
  let projectA;
  let projectB;
  let buildA;
  let buildB;
  let buildC;
  let runA;
  let runB;
  let runC;
  let runD;
  let closeServer;

  async function fetchJSON(url, requestBody) {
    let opts;

    if (requestBody) {
      opts = {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {'content-type': 'application/json'},
      };
    }

    const response = await fetch(`${rootURL}${url}`, opts);
    if (response.status === 204) return;
    return response.json();
  }

  const dbPath = path.join(__dirname, 'server-test.tmp.sql');

  beforeAll(async () => {
    if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);

    const {port, close} = await runServer({
      logLevel: 'silent',
      port: 0,
      storage: {
        storageMethod: 'sql',
        sqlDialect: 'sqlite',
        sqlDatabasePath: dbPath,
      },
    });

    rootURL = `http://localhost:${port}`;
    closeServer = close;
  });

  afterAll(() => {
    fs.unlinkSync(dbPath);
    closeServer();
  });

  describe('/v1/projects', () => {
    it('should create a project', async () => {
      const payload = {name: 'Lighthouse', externalUrl: 'https://github.com/lighthouse'};
      projectA = await fetchJSON('/v1/projects', payload);
      expect(projectA).toHaveProperty('id');
      expect(projectA).toMatchObject(payload);
    });

    it('should create a 2nd project', async () => {
      const payload = {name: 'Lighthouse 2', externalUrl: 'https://gitlab.com/lighthouse'};
      projectB = await fetchJSON('/v1/projects', payload);
      expect(projectB.id).not.toEqual(projectA.id);
      expect(projectB).toHaveProperty('id');
      expect(projectB).toMatchObject(payload);
    });

    it('should list projects', async () => {
      const projects = await fetchJSON('/v1/projects');
      expect(projects).toEqual([projectB, projectA]);
    });

    let projectAToken;
    it('should get a project token', async () => {
      const {token} = await fetchJSON(`/v1/projects/${projectA.id}/token`);
      expect(typeof token).toBe('string');
      projectAToken = token;
    });

    it('should fetch a project by a token', async () => {
      const project = await fetchJSON('/v1/projects/lookup', {token: projectAToken});
      expect(project).toEqual(projectA);
    });

    it('should fetch a project by ID', async () => {
      const project = await fetchJSON(`/v1/projects/${projectA.id}`);
      expect(project).toEqual(projectA);
    });
  });

  describe('/:projectId/builds', () => {
    beforeEach(() => {
      expect(projectA).toBeDefined();
      expect(projectB).toBeDefined();
    });

    it('should create a build', async () => {
      const payload = {
        hash: 'e0acdd50ed0fdcfdceb2508498be50cc55c696ef',
        branch: 'master',
        externalBuildUrl: 'http://travis-ci.org/org/repo/1',
        author: 'Patrick Hulce <patrick@example.com>',
        avatarUrl: 'https://avatars1.githubusercontent.com/u/2301202?s=460&v=4',
        commitMessage: 'feat: add some awesome features',
        ancestorHash: '0ed0fdcfdce0acdd5eb2508498be50cc55c696ea',
        runAt: new Date().toISOString(),
      };

      buildA = await fetchJSON(`/v1/projects/${projectA.id}/builds`, payload);
      expect(buildA).toHaveProperty('id');
      expect(buildA.projectId).toEqual(projectA.id);
      expect(buildA).toMatchObject(payload);
    });

    it('should create a 2nd build', async () => {
      const payload = {
        hash: 'b25084e0acdd50ed0fdcfdce98be50cc55c696ea',
        branch: 'test_branch',
        externalBuildUrl: 'http://travis-ci.org/org/repo/2',
        author: 'Paul Irish <paul@example.com>',
        avatarUrl: 'https://avatars1.githubusercontent.com/u/39191?s=460&v=4',
        commitMessage: 'feat: add some more awesome features',
        ancestorHash: 'e0acdd50ed0fdcfdceb2508498be50cc55c696ef',
        runAt: new Date().toISOString(),
      };

      buildB = await fetchJSON(`/v1/projects/${projectA.id}/builds`, payload);
      expect(buildB).toHaveProperty('id');
      expect(buildB.projectId).toEqual(projectA.id);
      expect(buildB).toMatchObject(payload);
    });

    it('should create a build in different project', async () => {
      const payload = {
        hash: '2edeb6a233aff298fbeccfbbb2d09282b21ec5ea',
        branch: 'master',
        externalBuildUrl: 'http://travis-ci.org/org/repo/1',
        author: 'Paul Irish <paul@example.com>',
        avatarUrl: 'https://avatars1.githubusercontent.com/u/39191?s=460&v=4',
        commitMessage: 'feat: initial commit',
        ancestorHash: '',
        runAt: new Date().toISOString(),
      };

      buildC = await fetchJSON(`/v1/projects/${projectB.id}/builds`, payload);
      expect(buildC).toHaveProperty('id');
      expect(buildC.projectId).toEqual(projectB.id);
      expect(buildC).toMatchObject(payload);
    });

    it('should list builds', async () => {
      const builds = await fetchJSON(`/v1/projects/${projectA.id}/builds`);
      expect(builds).toEqual([buildB, buildA]);
    });

    it('should list builds filtered by branch', async () => {
      const builds = await fetchJSON(`/v1/projects/${projectA.id}/builds?branch=master`);
      expect(builds).toEqual([buildA]);
    });

    it('should list builds filtered by branch', async () => {
      const builds = await fetchJSON(`/v1/projects/${projectA.id}/builds?hash=${buildB.hash}`);
      expect(builds).toEqual([buildB]);
    });

    it('should list builds for another project', async () => {
      const builds = await fetchJSON(`/v1/projects/${projectB.id}/builds`);
      expect(builds).toEqual([buildC]);
    });

    it('should find a specific build', async () => {
      const build = await fetchJSON(`/v1/projects/${projectA.id}/builds/${buildA.id}`);
      expect(build).toEqual(buildA);
    });
  });

  describe('/:projectId/branches', () => {
    it('should list branches', async () => {
      const branches = await fetchJSON(`/v1/projects/${projectA.id}/branches`);
      expect(branches).toEqual([{branch: 'test_branch'}, {branch: 'master'}]);
    });
  });

  describe('/:projectId/builds/:buildId/runs', () => {
    const lhr = {
      lighthouseVersion: '4.1.0',
      finalUrl: 'https://example.com/',
      audits: {
        interactive: {numericValue: 5000},
        'speed-index': {numericValue: 5000},
        'first-contentful-paint': {numericValue: 2000},
      },
      categories: {
        performance: {score: 0.5},
        pwa: {score: 0.1},
        seo: {score: 0.9},
      },
    };

    beforeEach(() => {
      expect(buildA).toBeDefined();
    });

    it('should create a run', async () => {
      const payload = {url: 'https://example.com', lhr: JSON.stringify(lhr)};

      runA = await fetchJSON(`/v1/projects/${projectA.id}/builds/${buildA.id}/runs`, payload);
      expect(runA).toHaveProperty('id');
      expect(runA.projectId).toEqual(projectA.id);
      expect(runA.buildId).toEqual(buildA.id);
      expect(runA).toMatchObject(payload);
    });

    it('should create a 2nd run', async () => {
      const payload = {
        url: 'https://example.com',
        lhr: JSON.stringify({
          ...lhr,
          lighthouseVersion: '4.2.0',
          audits: {...lhr.audits, interactive: {numericValue: 6000}},
          categories: {...lhr.categories, performance: {score: 0.4}},
        }),
      };

      runB = await fetchJSON(`/v1/projects/${projectA.id}/builds/${buildA.id}/runs`, payload);
      expect(runB).toHaveProperty('id');
      expect(runB.projectId).toEqual(projectA.id);
      expect(runB.buildId).toEqual(buildA.id);
      expect(runB).toMatchObject(payload);
    });

    it('should list runs', async () => {
      const runs = await fetchJSON(`/v1/projects/${projectA.id}/builds/${buildA.id}/runs`);
      expect(runs).toEqual([runB, runA]);
    });
  });

  describe('/:projectId/builds/:buildId/statistics', () => {
    beforeEach(() => {
      expect(buildA).toBeDefined();
      expect(runA).toBeDefined();
    });

    it('should get the statistics', async () => {
      const statistics = await fetchJSON(
        `/v1/projects/${projectA.id}/builds/${buildA.id}/statistics`
      );
      statistics.sort((a, b) => a.name.localeCompare(b.name));

      expect(statistics).toMatchObject([
        {
          url: 'https://example.com/',
          name: 'audit_first-contentful-paint_average',
          value: 2000,
        },
        {
          url: 'https://example.com/',
          name: 'audit_interactive_average',
          value: 5500,
        },
        {
          url: 'https://example.com/',
          name: 'audit_speed-index_average',
          value: 5000,
        },
        {
          url: 'https://example.com/',
          name: 'category_accessibility_average',
          value: -1,
        },
        {
          url: 'https://example.com/',
          name: 'category_best-practices_average',
          value: -1,
        },
        {
          url: 'https://example.com/',
          name: 'category_performance_average',
          value: 0.45,
        },
        {
          url: 'https://example.com/',
          name: 'category_pwa_average',
          value: 0.1,
        },
        {
          url: 'https://example.com/',
          name: 'category_seo_average',
          value: 0.9,
        },
      ]);
    });

    it('should create a 3rd run of a different url', async () => {
      const payload = {
        url: 'https://example.com/blog',
        lhr: JSON.stringify({
          finalUrl: 'https://example.com/blog',
          lighthouseVersion: '4.2.0',
          audits: {
            interactive: {numericValue: 1000},
            'speed-index': {numericValue: 1000},
            'first-contentful-paint': {numericValue: 1000},
          },
          categories: {
            performance: {score: 0.9},
            pwa: {score: 0.4},
            seo: {score: 0.7},
          },
        }),
      };

      runC = await fetchJSON(`/v1/projects/${projectA.id}/builds/${buildA.id}/runs`, payload);
      expect(runC).toHaveProperty('id');
      expect(runC.projectId).toEqual(projectA.id);
      expect(runC.buildId).toEqual(buildA.id);
      expect(runC).toMatchObject(payload);
    });

    it('should get the statistics a second time', async () => {
      const statistics = await fetchJSON(
        `/v1/projects/${projectA.id}/builds/${buildA.id}/statistics`
      );
      statistics.sort((a, b) => a.url.localeCompare(b.url) || a.name.localeCompare(b.name));

      expect(statistics).toMatchObject([
        {
          url: 'https://example.com/',
          name: 'audit_first-contentful-paint_average',
          value: 2000,
        },
        {
          url: 'https://example.com/',
          name: 'audit_interactive_average',
          value: 5500,
        },
        {
          url: 'https://example.com/',
          name: 'audit_speed-index_average',
          value: 5000,
        },
        {
          url: 'https://example.com/',
          name: 'category_accessibility_average',
          value: -1,
        },
        {
          url: 'https://example.com/',
          name: 'category_best-practices_average',
          value: -1,
        },
        {
          url: 'https://example.com/',
          name: 'category_performance_average',
          value: 0.45,
        },
        {
          url: 'https://example.com/',
          name: 'category_pwa_average',
          value: 0.1,
        },
        {
          url: 'https://example.com/',
          name: 'category_seo_average',
          value: 0.9,
        },
        {
          url: 'https://example.com/blog',
          name: 'audit_first-contentful-paint_average',
          value: 1000,
        },
        {
          url: 'https://example.com/blog',
          name: 'audit_interactive_average',
          value: 1000,
        },
        {
          url: 'https://example.com/blog',
          name: 'audit_speed-index_average',
          value: 1000,
        },
        {
          url: 'https://example.com/blog',
          name: 'category_accessibility_average',
          value: -1,
        },
        {
          url: 'https://example.com/blog',
          name: 'category_best-practices_average',
          value: -1,
        },
        {
          url: 'https://example.com/blog',
          name: 'category_performance_average',
          value: 0.9,
        },
        {
          url: 'https://example.com/blog',
          name: 'category_pwa_average',
          value: 0.4,
        },
        {
          url: 'https://example.com/blog',
          name: 'category_seo_average',
          value: 0.7,
        },
      ]);
    });
  });

  describe('/:projectId/urls', () => {
    it('should list urls', async () => {
      const urls = await fetchJSON(`/v1/projects/${projectA.id}/urls`);
      expect(urls).toEqual([{url: 'https://example.com/blog'}, {url: 'https://example.com'}]);
    });
  });

  describe('/:projectId/builds/:buildId/urls', () => {
    it('should list urls', async () => {
      const urls = await fetchJSON(`/v1/projects/${projectA.id}/builds/${buildA.id}/urls`);
      expect(urls).toEqual([{url: 'https://example.com/blog'}, {url: 'https://example.com'}]);
    });
  });

  describe('error handling', () => {
    it('should return 404 in the case of missing data', async () => {
      const response = await fetch(`${rootURL}/v1/projects/non-sense`);
      expect(response.status).toEqual(404);
    });
  });
});

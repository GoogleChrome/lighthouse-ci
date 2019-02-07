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

  const dbPath = path.join(__dirname, 'server-test.db');

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
      const project = await fetchJSON('/v1/projects/lookup', {token: projectAToken})
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
        externalBuildId: 'travis#1',
      };

      buildA = await fetchJSON(`/v1/projects/${projectA.id}/builds`, payload);
      expect(buildA).toHaveProperty('id');
      expect(buildA.projectId).toEqual(projectA.id);
      expect(buildA).toMatchObject(payload);
    });

    it('should create a 2nd build', async () => {
      const payload = {
        hash: 'e0acdd50ed0fdcfdceb2508498be50cc55c696ef',
        externalBuildId: 'travis#2',
      };

      buildB = await fetchJSON(`/v1/projects/${projectA.id}/builds`, payload);
      expect(buildB).toHaveProperty('id');
      expect(buildB.projectId).toEqual(projectA.id);
      expect(buildB).toMatchObject(payload);
    });

    it('should create a build in different project', async () => {
      const payload = {
        hash: '2edeb6a233aff298fbeccfbbb2d09282b21ec5ea',
        externalBuildId: 'travis#1',
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

    it('should list builds for another project', async () => {
      const builds = await fetchJSON(`/v1/projects/${projectB.id}/builds`);
      expect(builds).toEqual([buildC]);
    });
  });

  describe('/:projectId/builds/:buildId/runs', () => {
    beforeEach(() => {
      expect(buildA).toBeDefined();
    });

    it('should create a run', async () => {
      const payload = {lhr: JSON.stringify({lighthouseVersion: '4.1.0'})};

      runA = await fetchJSON(`/v1/projects/${projectA.id}/builds/${buildA.id}/runs`, payload);
      expect(runA).toHaveProperty('id');
      expect(runA.projectId).toEqual(projectA.id);
      expect(runA.buildId).toEqual(buildA.id);
      expect(runA).toMatchObject(payload);
    });

    it('should create a 2nd run', async () => {
      const payload = {lhr: JSON.stringify({lighthouseVersion: '4.2.0'})};

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
});

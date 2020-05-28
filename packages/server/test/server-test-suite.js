/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/* eslint-env jest */

const _ = require('@lhci/utils/src/lodash.js');
const ApiClient = require('@lhci/utils/src/api-client.js');
const fetch = require('isomorphic-fetch');

function runTests(state) {
  let rootURL = '';
  let client;
  let projectA;
  let projectB;
  let projectC;
  let buildA;
  let buildB;
  let buildC;
  let buildD;
  let runA;
  let runB;
  let runC;
  let runD;

  beforeAll(() => {
    rootURL = `http://localhost:${state.port}`;
    client = new ApiClient({rootURL, extraHeaders: state.extraHeaders});
  });

  describe('/version', () => {
    it('should return the version', async () => {
      const version = await client.getVersion();
      expect(version).toMatch(/^\d+\.\d+\.\d+/);
    });
  });

  describe('/v1/projects', () => {
    it('should create a project', async () => {
      const payload = {name: 'Lighthouse', externalUrl: 'https://github.com/lighthouse'};
      projectA = await client.createProject(payload);
      expect(projectA).toHaveProperty('id');
      expect(projectA).toHaveProperty('token');
      expect(projectA).toHaveProperty('adminToken');
      expect(projectA).toHaveProperty('baseBranch', 'master');
      expect(projectA).toHaveProperty('slug', 'lighthouse');
      expect(projectA).toMatchObject(payload);
      expect(projectA.token).toMatch(/^\w{8}-\w{4}/);
      expect(projectA.adminToken).toMatch(/^\w{40}$/);
    });

    it('should create a 2nd project', async () => {
      const payload = {
        name: 'Lighthouse 2',
        externalUrl: 'https://gitlab.com/lighthouse',
        baseBranch: '',
      };
      projectB = await client.createProject(payload);
      expect(projectB.id).not.toEqual(projectA.id);
      expect(projectB).toHaveProperty('id');
      expect(projectB).toHaveProperty('slug', 'lighthouse-2');
      expect(projectB).toMatchObject({...payload, baseBranch: 'master'});
    });

    it('should create a 3rd project', async () => {
      const payload = {
        name: 'Lighthouse 3',
        externalUrl: 'https://gitlab.com/lighthouse',
        baseBranch: 'dev',
      };
      projectC = await client.createProject(payload);
      expect(projectC.id).not.toEqual(projectA.id);
      expect(projectC).toHaveProperty('id');
      expect(projectC).toHaveProperty('slug', 'lighthouse-3');
      expect(projectC).toMatchObject(payload);
    });

    it('should list projects', async () => {
      const projects = await client.getProjects();
      expect(projects).toEqual([
        {...projectC, adminToken: '', token: ''},
        {...projectB, adminToken: '', token: ''},
        {...projectA, adminToken: '', token: ''},
      ]);
    });

    it('should fetch a project by a token', async () => {
      const project = await client.findProjectByToken(projectA.token);
      expect(project).toEqual({...projectA, adminToken: ''});
    });

    it('should fetch a project by ID', async () => {
      const project = await client.findProjectById(projectA.id);
      expect(project).toEqual({...projectA, adminToken: '', token: ''});
    });

    it('should fetch a project by slug', async () => {
      const project = await client.findProjectBySlug('lighthouse');
      expect(project).toEqual({...projectA, adminToken: '', token: ''});
    });

    it('should update a project', async () => {
      client.setAdminToken(projectC.adminToken);
      await client.updateProject({
        id: projectC.id,
        name: 'Updated',
        externalUrl: 'https://updated.example.com',
        baseBranch: 'updated-dev',
        adminToken: 'haxx',
        slug: 'ignored',
      });

      const project = await client.findProjectById(projectC.id);
      expect(project).toEqual({
        ...projectC,
        updatedAt: project.updatedAt,
        name: 'Updated',
        externalUrl: 'https://updated.example.com',
        baseBranch: 'updated-dev',
        adminToken: '',
        token: '',
      });

      expect(new Date(project.updatedAt).getTime()).toBeGreaterThan(
        new Date(projectC.updatedAt).getTime()
      );

      await client.updateProject({
        id: projectC.id,
        name: 'Updated Back',
        adminToken: 'haxx',
      });

      expect(await client.findProjectById(projectC.id)).toHaveProperty('name', 'Updated Back');
      client.setAdminToken('haxx');
      await expect(client.updateProject(projectC)).rejects.toMatchObject({status: 403});
    });

    describe('slugs', () => {
      it('should create lots of unique slugs', async () => {
        const payload = {name: 'Lighthouse', externalUrl: 'https://github.com/lighthouse'};
        const slugs = new Set([projectA.slug]);
        for (let i = 0; i < 50; i++) {
          const project = await client.createProject(payload);
          expect(project).toHaveProperty('slug');
          expect(slugs).not.toContain(project.slug);
          expect(await client.findProjectBySlug(project.slug)).toEqual({
            ...project,
            adminToken: '',
            token: '',
          });
          slugs.add(project.slug);
        }
      });
    });
  });

  describe('/:projectId/builds', () => {
    beforeEach(() => {
      expect(projectA).toBeDefined();
      expect(projectB).toBeDefined();
    });

    it('should create a build', async () => {
      const payload = {
        projectId: projectA.id,
        lifecycle: 'unsealed',
        hash: 'e0acdd50ed0fdcfdceb2508498be50cc55c696ef',
        branch: 'master',
        externalBuildUrl: 'http://travis-ci.org/org/repo/1',
        author: 'Patrick Hulce <patrick@example.com>',
        avatarUrl: 'https://avatars1.githubusercontent.com/u/2301202?s=460&v=4',
        commitMessage: 'feat: add some awesome features',
        ancestorHash: '0ed0fdcfdce0acdd5eb2508498be50cc55c696ea',
        runAt: new Date().toISOString(),
        committedAt: new Date().toISOString(),
        ancestorCommittedAt: new Date().toISOString(),
      };

      client.setBuildToken(projectA.token);
      buildA = await client.createBuild(payload);
      expect(buildA).toHaveProperty('id');
      expect(buildA.projectId).toEqual(projectA.id);
      expect(buildA).toMatchObject(payload);
    });

    it('should create a 2nd build', async () => {
      const payload = {
        projectId: projectA.id,
        lifecycle: 'unsealed',
        hash: 'b25084e0acdd50ed0fdcfdce98be50cc55c696ea',
        branch: 'test_branch',
        externalBuildUrl: 'http://travis-ci.org/org/repo/2',
        author: 'Paul Irish <paul@example.com>',
        avatarUrl: 'https://avatars1.githubusercontent.com/u/39191?s=460&v=4',
        commitMessage: 'feat: add some more awesome features',
        ancestorHash: buildA.hash,
        runAt: new Date().toISOString(),
        committedAt: new Date().toISOString(),
        ancestorCommittedAt: new Date().toISOString(),
      };

      client.setBuildToken(projectA.token);
      buildB = await client.createBuild(payload);
      expect(buildB).toHaveProperty('id');
      expect(buildB.projectId).toEqual(projectA.id);
      expect(buildB).toMatchObject(payload);
    });

    it('should create a 3rd build (w/o an ancestor)', async () => {
      const payload = {
        projectId: projectA.id,
        lifecycle: 'unsealed',
        hash: '50cc55c696eb25084ebe0acdd50ed0fdcfdce98a',
        branch: 'other_branch',
        externalBuildUrl: 'http://travis-ci.org/org/repo/2',
        author: 'Paul Irish <paul@example.com>',
        avatarUrl: 'https://avatars1.githubusercontent.com/u/39191?s=460&v=4',
        commitMessage: 'feat: a branch without an ancestor',
        ancestorHash: '',
        runAt: new Date().toISOString(),
        committedAt: new Date().toISOString(),
        ancestorCommittedAt: new Date().toISOString(),
      };

      client.setBuildToken(projectA.token);
      buildC = await client.createBuild(payload);
      expect(buildC).toHaveProperty('id');
      expect(buildC.projectId).toEqual(projectA.id);
      expect(buildC).toMatchObject(payload);
    });

    it('should create a build in different project', async () => {
      const payload = {
        projectId: projectB.id,
        lifecycle: 'unsealed',
        hash: '2edeb6a233aff298fbeccfbbb2d09282b21ec5ea',
        branch: 'master',
        externalBuildUrl: 'http://travis-ci.org/org/repo/1',
        author: 'Paul Irish <paul@example.com>',
        avatarUrl: 'https://avatars1.githubusercontent.com/u/39191?s=460&v=4',
        commitMessage: 'feat: initial commit',
        ancestorHash: '',
        runAt: new Date().toISOString(),
        committedAt: new Date().toISOString(),
        ancestorCommittedAt: new Date().toISOString(),
      };

      client.setBuildToken(projectB.token);
      buildD = await client.createBuild(payload);
      expect(buildD).toHaveProperty('id');
      expect(buildD.projectId).toEqual(projectB.id);
      expect(buildD).toMatchObject(payload);
    });

    it('should list builds', async () => {
      const builds = await client.getBuilds(projectA.id);
      expect(builds).toEqual([buildC, buildB, buildA]);
    });

    it('should list builds with limit', async () => {
      const builds = await client.getBuilds(projectA.id, {limit: 1});
      expect(builds).toEqual([buildC]);
    });

    it('should list builds filtered by branch', async () => {
      const builds = await client.getBuilds(projectA.id, {branch: 'master'});
      expect(builds).toEqual([buildA]);
    });

    it('should list builds filtered by hash', async () => {
      const builds = await client.getBuilds(projectA.id, {hash: buildB.hash});
      expect(builds).toEqual([buildB]);
    });

    it('should list builds filtered by lifecycle', async () => {
      const builds = await client.getBuilds(projectA.id, {lifecycle: 'sealed'});
      expect(builds).toEqual([]);
    });

    it('should list builds for another project', async () => {
      const builds = await client.getBuilds(projectB.id);
      expect(builds).toEqual([buildD]);
    });

    it('should list builds for missing project', async () => {
      const builds = await client.getBuilds('MISSING');
      expect(builds).toEqual([]);
    });

    it('should find a specific build by full id', async () => {
      const build = await client.findBuildById(buildA.projectId, buildA.id);
      expect(build).toEqual(buildA);
    });

    it('should find a specific build by partial id', async () => {
      const build = await client.findBuildById(buildA.projectId, _.shortId(buildA.id));
      expect(build).toEqual(buildA);
    });

    it('should not find a missing build', async () => {
      const build = await client.findBuildById('MISSING', 'MISSING');
      expect(build).toEqual(undefined);
    });

    it('should handle partial id ambiguity', async () => {
      const dummyProject = await client.createProject({name: 'dummy', externalUrl: ''});
      const builds = [];
      const findAmbiguity = () => {
        for (const a of builds) {
          for (const b of builds) {
            if (a === b) continue;
            if (a.id[0] === b.id[0]) return a.id[0];
          }
        }
      };

      while (!findAmbiguity()) {
        client.setBuildToken(dummyProject.token);
        builds.push(
          await client.createBuild({
            ...buildA,
            hash: Math.random().toString(),
            projectId: dummyProject.id,
          })
        );
      }

      const ambiguousPrefix = findAmbiguity();
      const buildWithAmbiguousPrefix = builds.find(b => b.id.startsWith(ambiguousPrefix));
      expect(await client.findBuildById(dummyProject.id, ambiguousPrefix)).toEqual(undefined);
      expect(await client.findBuildById(dummyProject.id, buildWithAmbiguousPrefix.id)).toEqual(
        buildWithAmbiguousPrefix
      );
    });

    it('should handle partial id ambiguity when there is one 0 and one 00 build', async () => {
      const dummyProject = await client.createProject({name: 'dummy', externalUrl: ''});
      const builds = [];
      const findAmbiguity = () => {
        for (const a of builds) {
          for (const b of builds) {
            if (a === b) continue;

            if (a.id.startsWith('0') && !a.id.startsWith('00') && b.id.startsWith('00')) {
              return true;
            }
          }
        }
      };

      while (!findAmbiguity()) {
        client.setBuildToken(dummyProject.token);
        builds.push(
          await client.createBuild({
            ...buildA,
            hash: Math.random().toString(),
            projectId: dummyProject.id,
          })
        );
      }

      const buildsWithAmbiguousPrefix = builds.filter(b => b.id.startsWith('0'));
      const doubleZeroBuild = buildsWithAmbiguousPrefix.find(b => b.id.startsWith('00'));
      const singleZeroBuild = buildsWithAmbiguousPrefix.find(b => !b.id.startsWith('00'));

      const ambiguousQueryResult = await client.findBuildById(dummyProject.id, '0');
      const doubleZeroResult = await client.findBuildById(dummyProject.id, doubleZeroBuild.id);
      const singleZeroResult = await client.findBuildById(dummyProject.id, singleZeroBuild.id);

      expect([ambiguousQueryResult, doubleZeroResult, singleZeroResult]).toEqual([
        undefined,
        doubleZeroBuild,
        singleZeroBuild,
      ]);
    }, 600e3); // this can take a really long time in CI, 00 = 1/256 chance, 0 = 1/16 chance

    it('should handle UUIDs that start with 0', async () => {
      const dummyProject = await client.createProject({name: 'dummy', externalUrl: ''});
      const builds = [];
      const findBuildWith0 = () => {
        return builds.find(build => build.id.startsWith('0'));
      };

      while (!findBuildWith0()) {
        client.setBuildToken(dummyProject.token);
        builds.push(
          await client.createBuild({
            ...buildA,
            hash: Math.random().toString(),
            projectId: dummyProject.id,
          })
        );
      }

      const build = findBuildWith0();
      const buildPrefix = _.shortId(build.id);
      expect(await client.findBuildById(dummyProject.id, buildPrefix)).toEqual(build);
    });
  });

  describe('/:projectId/branches', () => {
    it('should list branches', async () => {
      const branches = await client.getBranches(projectA.id);
      expect(branches).toEqual([
        {branch: 'test_branch'},
        {branch: 'other_branch'},
        {branch: 'master'},
      ]);
    });

    it('should handle missing ids', async () => {
      const branches = await client.getBranches('MISSING');
      expect(branches).toEqual([]);
    });
  });

  describe('/:projectId/builds/:buildId/ancestor', () => {
    it('should not find a build with no ancestor', async () => {
      const build = await client.findAncestorBuildById(buildA.projectId, buildA.id);
      expect(build).toEqual(undefined);
    });

    it('should find a build with an explicit ancestor', async () => {
      const build = await client.findAncestorBuildById(buildB.projectId, buildB.id);
      expect(build).toEqual(buildA);
    });

    it('should find a build with an implicit prior ancestor', async () => {
      const build = await client.findAncestorBuildById(buildC.projectId, buildC.id);
      expect(build).toEqual(buildA);
    });

    it('should find a build with complicated ancestor', async () => {
      const project = await client.createProject(projectA);
      client.setBuildToken(project.token);
      const buildWithoutAncestor = await client.createBuild({
        ...buildC,
        hash: Math.random().toString(),
        commitMessage: 'buildWithoutAncestor',
        projectId: project.id,
        branch: 'feature_branch',
        runAt: new Date('2019-09-01').toISOString(),
      });

      let ancestor = await client.findAncestorBuildById(project.id, buildWithoutAncestor.id);
      expect(ancestor).toEqual(undefined);

      const implicitPriorAncestorBuild = await client.createBuild({
        ...buildA,
        hash: Math.random().toString(),
        commitMessage: 'implicitPriorAncestorBuild',
        projectId: project.id,
        branch: 'master',
        runAt: new Date('2019-01-01').toISOString(),
      });
      ancestor = await client.findAncestorBuildById(project.id, buildWithoutAncestor.id);
      expect(ancestor).toEqual(implicitPriorAncestorBuild);
      ancestor = await client.findAncestorBuildById(project.id, implicitPriorAncestorBuild.id);
      expect(ancestor).toEqual(undefined);

      const implicitFutureAncestorBuild = await client.createBuild({
        ...buildA,
        hash: Math.random().toString(),
        commitMessage: 'implicitFutureAncestorBuild',
        projectId: project.id,
        branch: 'master',
        runAt: new Date('2019-09-02').toISOString(),
      });

      ancestor = await client.findAncestorBuildById(project.id, buildWithoutAncestor.id);
      expect(ancestor).toEqual(implicitFutureAncestorBuild);
      ancestor = await client.findAncestorBuildById(project.id, implicitFutureAncestorBuild.id);
      expect(ancestor).toEqual(implicitPriorAncestorBuild);
      ancestor = await client.findAncestorBuildById(project.id, implicitPriorAncestorBuild.id);
      expect(ancestor).toEqual(undefined);

      const implicit2ndFutureAncestorBuild = await client.createBuild({
        ...buildA,
        hash: Math.random().toString(),
        commitMessage: 'implicit2ndFutureAncestorBuild',
        projectId: project.id,
        branch: 'master',
        runAt: new Date('2019-09-03').toISOString(),
      });

      ancestor = await client.findAncestorBuildById(project.id, buildWithoutAncestor.id);
      expect(ancestor).toEqual(implicitFutureAncestorBuild);
      ancestor = await client.findAncestorBuildById(project.id, implicit2ndFutureAncestorBuild.id);
      expect(ancestor).toEqual(implicitFutureAncestorBuild);
      ancestor = await client.findAncestorBuildById(project.id, implicitFutureAncestorBuild.id);
      expect(ancestor).toEqual(implicitPriorAncestorBuild);
      ancestor = await client.findAncestorBuildById(project.id, implicitPriorAncestorBuild.id);
      expect(ancestor).toEqual(undefined);
    });

    it('should find a build with an ancestor hash duplicate of branch hash', async () => {
      const project = await client.createProject(projectA);
      client.setBuildToken(project.token);
      const branchBuild = await client.createBuild({
        ...buildA,
        hash: 'hash-1',
        commitMessage: 'Merge commit - branch PR build',
        projectId: project.id,
        branch: 'feature_branch',
        runAt: new Date('2019-09-02').toISOString(),
      });
      const masterBuild = await client.createBuild({
        ...buildA,
        hash: 'hash-1',
        commitMessage: 'Merge commit - master build',
        projectId: project.id,
        branch: 'master',
        runAt: new Date('2019-09-01').toISOString(),
      });
      const newBranchBuild = await client.createBuild({
        ...buildA,
        hash: 'hash-2',
        ancestorHash: 'hash-1',
        commitMessage: 'Branch commit',
        projectId: project.id,
        branch: 'feature_branch_2',
        runAt: new Date('2019-09-03').toISOString(),
      });

      let ancestor = await client.findAncestorBuildById(project.id, branchBuild.id);
      expect(ancestor).toEqual(masterBuild);
      ancestor = await client.findAncestorBuildById(project.id, masterBuild.id);
      expect(ancestor).toEqual(undefined);
      ancestor = await client.findAncestorBuildById(project.id, newBranchBuild.id);
      expect(ancestor).toEqual(masterBuild);
    });

    it('should find a build with an ancestor hash of non-master base', async () => {
      const project = await client.createProject({...projectA, baseBranch: 'dev'});
      client.setBuildToken(project.token);
      const branchBuild = await client.createBuild({
        ...buildA,
        hash: 'hash-1',
        commitMessage: 'Merge commit - branch PR build',
        projectId: project.id,
        branch: 'feature_branch',
        runAt: new Date('2019-09-02').toISOString(),
      });
      const baseBuild = await client.createBuild({
        ...buildA,
        hash: 'hash-1',
        commitMessage: 'Merge commit - base build',
        projectId: project.id,
        branch: 'dev',
        runAt: new Date('2019-09-01').toISOString(),
      });
      const masterBuild = await client.createBuild({
        ...buildA,
        hash: 'hash-1',
        commitMessage: 'Merge commit - master build',
        projectId: project.id,
        branch: 'master',
        runAt: new Date('2019-09-01').toISOString(),
      });
      const newBranchBuild = await client.createBuild({
        ...buildA,
        hash: 'hash-2',
        ancestorHash: 'hash-1',
        commitMessage: 'Branch commit',
        projectId: project.id,
        branch: 'feature_branch_2',
        runAt: new Date('2019-09-03').toISOString(),
      });

      let ancestor = await client.findAncestorBuildById(project.id, branchBuild.id);
      expect(ancestor).toEqual(baseBuild);
      ancestor = await client.findAncestorBuildById(project.id, baseBuild.id);
      expect(ancestor).toEqual(undefined);
      ancestor = await client.findAncestorBuildById(project.id, masterBuild.id);
      expect(ancestor).toEqual(baseBuild);
      ancestor = await client.findAncestorBuildById(project.id, newBranchBuild.id);
      expect(ancestor).toEqual(baseBuild);
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
        'a11y-audit-na': {score: null, scoreDisplayMode: 'notApplicable'},
        'a11y-audit-pass': {score: 1, scoreDisplayMode: 'binary'},
        'a11y-audit-fail': {score: 0, scoreDisplayMode: 'binary'},
      },
      categories: {
        performance: {score: 0.5},
        pwa: {score: 0.1},
        seo: {score: 0.9},
        a11y: {
          score: 0.5,
          auditRefs: [
            // Best practices is 1-1-1
            {id: 'a11y-audit-pass', group: 'a11y-best-practices'},
            {id: 'a11y-audit-fail', group: 'a11y-best-practices'},
            {id: 'a11y-audit-na', group: 'a11y-best-practices'},
            // Language is 2-1-0
            {id: 'a11y-audit-pass', group: 'a11y-language'},
            {id: 'a11y-audit-pass', group: 'a11y-language'},
            {id: 'a11y-audit-fail', group: 'a11y-language'},
            // Aria is 0-2-1
            {id: 'a11y-audit-fail', group: 'a11y-aria'},
            {id: 'a11y-audit-fail', group: 'a11y-aria'},
            {id: 'a11y-audit-na', group: 'a11y-aria'},
          ],
        },
      },
    };

    beforeEach(() => {
      expect(buildA).toBeDefined();
    });

    it('should create a run', async () => {
      const payload = {
        projectId: projectA.id,
        buildId: buildA.id,
        url: 'https://example.com:PORT/',
        lhr: JSON.stringify(lhr),
      };

      client.setBuildToken(projectA.token);
      runA = await client.createRun(payload);
      expect(runA).toHaveProperty('id');
      expect(runA.projectId).toEqual(projectA.id);
      expect(runA.buildId).toEqual(buildA.id);
      expect(runA).toMatchObject(payload);
    });

    it('should create a 2nd run', async () => {
      const payload = {
        projectId: projectA.id,
        buildId: buildA.id,
        url: 'https://example.com:PORT/',
        lhr: JSON.stringify({
          ...lhr,
          lighthouseVersion: '4.2.0',
          audits: {...lhr.audits, interactive: {numericValue: 5500}},
          categories: {...lhr.categories, performance: {score: 0.45}},
        }),
      };

      client.setBuildToken(projectA.token);
      runB = await client.createRun(payload);
      expect(runB).toHaveProperty('id');
      expect(runB.projectId).toEqual(projectA.id);
      expect(runB.buildId).toEqual(buildA.id);
      expect(runB).toMatchObject(payload);
    });

    it('should create a 3rd run', async () => {
      const payload = {
        projectId: projectA.id,
        buildId: buildA.id,
        url: 'https://example.com:PORT/',
        lhr: JSON.stringify({
          ...lhr,
          lighthouseVersion: '4.2.0',
          audits: {...lhr.audits, interactive: {numericValue: 6000}},
          categories: {...lhr.categories, performance: {score: 0.4}},
        }),
      };

      client.setBuildToken(projectA.token);
      runC = await client.createRun(payload);
      expect(runC).toHaveProperty('id');
      expect(runC.projectId).toEqual(projectA.id);
      expect(runC.buildId).toEqual(buildA.id);
      expect(runC).toMatchObject(payload);
    });

    it('should create a 4th run of a different url', async () => {
      const payload = {
        projectId: projectA.id,
        buildId: buildA.id,
        url: 'https://example.com:PORT/blog',
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

      client.setBuildToken(projectA.token);
      runD = await client.createRun(payload);
      expect(runD).toHaveProperty('id');
      expect(runD.projectId).toEqual(projectA.id);
      expect(runD.buildId).toEqual(buildA.id);
      expect(runD).toMatchObject(payload);
    });

    it('should list runs', async () => {
      const runs = await client.getRuns(projectA.id, buildA.id);
      expect(runs).toEqual([runD, runC, runB, runA]);
    });

    it('should list runs by url', async () => {
      const runs = await client.getRuns(projectA.id, buildA.id, {url: runD.url});
      expect(runs).toEqual([runD]);
    });

    it('should handle listing nonexistent builds', async () => {
      const runs = await client.getRuns('MISSING', 'MISSING');
      expect(runs).toEqual([]);
    });
  });

  describe('/:projectId/builds/:buildId/statistics', () => {
    beforeEach(() => {
      expect(buildA).toBeDefined();
      expect(buildB).toBeDefined();
      expect(runA).toBeDefined();
    });

    it('should get empty data for unsealed build', async () => {
      const statistics = await client.getStatistics(projectA.id, buildA.id);

      expect(statistics).toEqual([]);
    });

    it('should seal the build', async () => {
      client.setBuildToken(projectA.token);
      await client.sealBuild(projectA.id, buildA.id);

      // Build should now be sealed
      const updatedBuild = await client.findBuildById(projectA.id, buildA.id);
      expect(updatedBuild).toHaveProperty('lifecycle', 'sealed');

      // Querying for build by sealed lifecycle should now work
      expect(await client.getBuilds(projectA.id, {lifecycle: 'sealed'})).toEqual([updatedBuild]);

      // Runs should have been marked representative
      expect(await client.getRuns(projectA.id, buildA.id)).toMatchObject([
        {id: runD.id, representative: true},
        {id: runC.id, representative: false},
        {id: runB.id, representative: true},
        {id: runA.id, representative: false},
      ]);
    });

    it('should get representative runs', async () => {
      expect(await client.getRuns(projectA.id, buildA.id, {representative: true})).toMatchObject([
        {id: runD.id, representative: true},
        {id: runB.id, representative: true},
      ]);

      expect(await client.getRuns(projectA.id, buildA.id, {representative: false})).toMatchObject([
        {id: runC.id, representative: false},
        {id: runA.id, representative: false},
      ]);
    });

    it('should get the statistics', async () => {
      const statistics = await client.getStatistics(projectA.id, buildA.id);
      statistics.forEach(stat => (stat.value = Math.round(stat.value * 1000) / 1000));

      const urlRootStats = statistics.filter(stat => stat.url === 'https://example.com:PORT/');
      const urlBlogStats = statistics.filter(stat => stat.url === 'https://example.com:PORT/blog');

      expect(urlRootStats.length).toBeGreaterThan(60);
      expect(urlBlogStats).toHaveLength(urlRootStats.length);

      const fcpMedian = urlRootStats.find(s => s.name === 'audit_first-contentful-paint_median');
      const a11yMedian = urlRootStats.find(s => s.name === 'category_accessibility_median');
      const a11yMin = urlRootStats.find(s => s.name === 'category_accessibility_min');
      const perfMedian = urlRootStats.find(s => s.name === 'category_performance_median');
      const perfMin = urlRootStats.find(s => s.name === 'category_performance_min');
      const perfMax = urlRootStats.find(s => s.name === 'category_performance_max');

      expect(fcpMedian).toMatchObject({
        url: 'https://example.com:PORT/',
        name: 'audit_first-contentful-paint_median',
        value: 2000,
      });
      expect(a11yMedian).toMatchObject({
        url: 'https://example.com:PORT/',
        name: 'category_accessibility_median',
        value: -1,
      });
      expect(a11yMin).toMatchObject({
        url: 'https://example.com:PORT/',
        name: 'category_accessibility_min',
        value: -1,
      });
      expect(perfMedian).toMatchObject({
        url: 'https://example.com:PORT/',
        name: 'category_performance_median',
        value: 0.45,
      });
      expect(perfMin).toMatchObject({
        url: 'https://example.com:PORT/',
        name: 'category_performance_min',
        value: 0.4,
      });
      expect(perfMax).toMatchObject({
        url: 'https://example.com:PORT/',
        name: 'category_performance_max',
        value: 0.5,
      });

      // prettier-ignore
      const auditGroupAPass = urlRootStats.find(s => s.name === 'auditgroup_a11y-best-practices_pass');
      // prettier-ignore
      const auditGroupAFail = urlRootStats.find(s => s.name === 'auditgroup_a11y-best-practices_fail');
      const auditGroupANa = urlRootStats.find(s => s.name === 'auditgroup_a11y-best-practices_na');
      const auditGroupBPass = urlRootStats.find(s => s.name === 'auditgroup_a11y-language_pass');
      const auditGroupBFail = urlRootStats.find(s => s.name === 'auditgroup_a11y-language_fail');
      const auditGroupBNa = urlRootStats.find(s => s.name === 'auditgroup_a11y-language_na');
      const auditGroupCPass = urlRootStats.find(s => s.name === 'auditgroup_a11y-aria_pass');
      const auditGroupCFail = urlRootStats.find(s => s.name === 'auditgroup_a11y-aria_fail');
      const auditGroupCNa = urlRootStats.find(s => s.name === 'auditgroup_a11y-aria_na');
      const auditGroupDPass = urlRootStats.find(s => s.name === 'auditgroup_a11y-navigation_pass');
      const auditGroupDFail = urlRootStats.find(s => s.name === 'auditgroup_a11y-navigation_fail');
      const auditGroupDNa = urlRootStats.find(s => s.name === 'auditgroup_a11y-navigation_na');

      expect(auditGroupAPass.value).toEqual(1);
      expect(auditGroupAFail.value).toEqual(1);
      expect(auditGroupANa.value).toEqual(1);
      expect(auditGroupBPass.value).toEqual(2);
      expect(auditGroupBFail.value).toEqual(1);
      expect(auditGroupBNa.value).toEqual(0);
      expect(auditGroupCPass.value).toEqual(0);
      expect(auditGroupCFail.value).toEqual(2);
      expect(auditGroupCNa.value).toEqual(1);
      expect(auditGroupDPass.value).toEqual(-1);
      expect(auditGroupDFail.value).toEqual(-1);
      expect(auditGroupDNa.value).toEqual(-1);
    });

    it('should not recompute on every call', async () => {
      const stat1 = await client.getStatistics(projectA.id, buildA.id);
      const stat2 = await client.getStatistics(projectA.id, buildA.id);

      for (const pre of stat1) {
        const post = stat2.find(stat => stat.url === pre.url && stat.name === pre.name);
        expect(post).toEqual(pre); // ensure that updatedAt has not changed
      }
    });

    it('should invalidate statistics and get updated statistics', async () => {
      const preInvalidated = await client.getStatistics(projectA.id, buildA.id);
      await state.storageMethod._invalidateStatistics(projectA.id, buildA.id);
      const postInvalidated = await client.getStatistics(projectA.id, buildA.id);

      for (const pre of preInvalidated) {
        const post = postInvalidated.find(stat => stat.url === pre.url && stat.name === pre.name);
        expect({...post, updatedAt: ''}).toEqual({...pre, updatedAt: ''});
        expect(new Date(post.updatedAt).getTime()).toBeGreaterThan(
          new Date(pre.updatedAt).getTime()
        );
      }
    });
  });

  describe('/:projectId/urls', () => {
    it('should list urls', async () => {
      const urls = await client.getUrls(projectA.id);
      expect(urls).toEqual([
        {url: 'https://example.com:PORT/blog'},
        {url: 'https://example.com:PORT/'},
      ]);
    });
  });

  describe('/:projectId/builds/:buildId/urls', () => {
    it('should list urls', async () => {
      const urls = await client.getUrls(projectA.id, buildA.id);
      expect(urls).toEqual([
        {url: 'https://example.com:PORT/blog'},
        {url: 'https://example.com:PORT/'},
      ]);
    });
  });

  describe('error handling', () => {
    // Defer the use of `state.extraHeaders` because they're initialized in a `beforeAll` block
    const fetchOptions = () => ({headers: state.extraHeaders});

    it('should return 404 in the case of missing data by id', async () => {
      const response = await fetch(`${rootURL}/v1/projects/missing`, fetchOptions());
      expect(response.status).toEqual(404);
    });

    it('should return 404 in the case of missing data by slug', async () => {
      const response = await fetch(`${rootURL}/v1/projects/slug:missing`, fetchOptions());
      expect(response.status).toEqual(404);
    });

    it('should return undefined to the client', async () => {
      expect(await client.findProjectById('missing')).toBeUndefined();
      expect(await client.findProjectBySlug('missing')).toBeUndefined();
      expect(await client.findProjectByToken('missing')).toBeUndefined();
      expect(await client.findBuildById('missing', 'missing')).toBeUndefined();
    });

    it('should fail to create a project with empty', async () => {
      const payload = {name: '', externalUrl: ''};
      await expect(client.createProject(payload)).rejects.toMatchObject({
        status: 422,
        body: '{"message":"Project name too short"}',
      });
    });

    it('should fail to create a sealed build', async () => {
      const payload = {...buildA, lifecycle: 'sealed', id: undefined};
      client.setBuildToken(projectA.token);
      await expect(client.createBuild(payload)).rejects.toMatchObject({
        status: 422,
        body: '{"message":"Invalid lifecycle value"}',
      });
    });

    it('should fail to create a build with same hash', async () => {
      const payload = {...buildA, id: undefined};
      client.setBuildToken(projectA.token);
      await expect(client.createBuild(payload)).rejects.toMatchObject({
        status: 422,
        body:
          '{"message":"Build already exists for hash \\"e0acdd50ed0fdcfdceb2508498be50cc55c696ef\\""}',
      });
    });

    it('should fail to create a build without a build token', async () => {
      const payload = {...buildA, hash: 'newhash', id: undefined};
      client.setBuildToken(undefined);
      await expect(client.createBuild(payload)).rejects.toMatchObject({
        status: 403,
        body: '{"message":"Invalid token"}',
      });
    });

    it('should fail to create a run without a build token', async () => {
      client.setBuildToken(undefined);
      await expect(client.createRun({...runA, buildId: buildB.id})).rejects.toMatchObject({
        status: 403,
        body: '{"message":"Invalid token"}',
      });
    });

    it('should reject new runs after sealing', async () => {
      client.setBuildToken(projectA.token);
      await expect(client.createRun(runA)).rejects.toMatchObject({
        status: 422,
        body: '{"message":"Invalid build"}',
      });
    });

    it('should reject runs with representative flag', async () => {
      client.setBuildToken(projectA.token);
      await expect(
        client.createRun({...runA, buildId: buildB.id, representative: true})
      ).rejects.toMatchObject({
        status: 422,
        body: '{"message":"Invalid representative value"}',
      });
    });

    it('should reject runs with invalid LHR', async () => {
      client.setBuildToken(projectA.token);
      await expect(
        client.createRun({...runA, buildId: buildB.id, lhr: null})
      ).rejects.toMatchObject({
        status: 422,
        body: '{"message":"Invalid LHR"}',
      });
    });

    it('should fail to seal a build without a build token', async () => {
      client.setBuildToken(undefined);
      await expect(client.sealBuild(buildB.projectId, buildB.id)).rejects.toMatchObject({
        status: 403,
        body: '{"message":"Invalid token"}',
      });
    });

    // TODO: make this consistent behavior with runs which returns []
    it('should fail to create statistics on non-existent build', async () => {
      await expect(client.getStatistics(projectA.id, 'MISSING')).rejects.toMatchObject({
        status: 404,
        body: '{"message":"No build with that ID"}',
      });
    });

    it('should fail to take privileged actions without a token', async () => {
      await expect(client.deleteBuild(projectA.id, buildA.id)).rejects.toMatchObject({
        status: 403,
        body: '{"message":"Invalid token"}',
      });

      expect(await client.findBuildById(projectA.id, buildA.id)).toBeDefined();
    });

    it('should fail to take privileged actions with an invalid token', async () => {
      client.setAdminToken(projectB.adminToken);
      await expect(client.deleteBuild(projectA.id, buildA.id)).rejects.toMatchObject({
        status: 403,
        body: '{"message":"Invalid token"}',
      });

      expect(await client.findBuildById(projectA.id, buildA.id)).toBeDefined();
    });

    it('should fail to take update actions with a token for another project', async () => {
      client.setAdminToken(projectB.adminToken);
      await expect(client.updateProject({...projectA, name: 'Haxxx'})).rejects.toMatchObject({
        status: 403,
        body: '{"message":"Invalid token"}',
      });

      expect(await client.findProjectById(projectA.id)).toHaveProperty('name', projectA.name);
    });
  });

  describe('cleanup', () => {
    it('should delete a build', async () => {
      client.setAdminToken(projectA.adminToken);
      await client.deleteBuild(buildA.projectId, buildA.id);

      const build = await client.findBuildById(projectA.id, buildA.id);
      expect(build).toEqual(undefined);

      const runs = await client.getRuns(buildA.projectId, buildA.id);
      expect(runs).toEqual([]);
    });

    it('should delete a project', async () => {
      client.setAdminToken(projectA.adminToken);
      await client.deleteProject(buildA.projectId);

      const project = await client.findProjectById(projectA.id);
      expect(project).toEqual(undefined);

      const buildsA = await client.getBuilds(projectA.id);
      expect(buildsA).toEqual([]);

      const buildsB = await client.getBuilds(projectB.id);
      expect(buildsB).toHaveLength(1);
    });
  });
}

module.exports = {runTests};

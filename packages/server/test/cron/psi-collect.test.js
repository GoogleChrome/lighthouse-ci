/**
 * @license Copyright 2020 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/* eslint-env jest */

/** @type {jest.MockInstance} */
let cronJob = jest.fn().mockReturnValue({start: () => {}});
jest.mock('cron', () => ({
  CronJob: function(...args) {
    // use this indirection because we have to invoke it with `new` and it's harder to mock assertions
    return cronJob(...args);
  },
}));
const {psiCollectForProject, startPsiCollectCron} = require('../../src/cron/psi-collect.js');

describe('cron/psi-collect', () => {
  /** @type {{findProjectBySlug: jest.MockInstance, createBuild: jest.MockInstance, createRun: jest.MockInstance, sealBuild: jest.MockInstance}} */
  let storageMethod;

  beforeEach(() => {
    storageMethod = {
      findProjectBySlug: jest.fn().mockResolvedValue({id: 1, baseBranch: 'main'}),
      createBuild: jest.fn().mockResolvedValue({id: 2}),
      sealBuild: jest.fn().mockResolvedValue({}),
      createRun: jest.fn().mockResolvedValue({id: 3}),
    };

    cronJob = jest.fn().mockReturnValue({start: () => {}});
  });

  describe('.psiCollectForProject()', () => {
    /** @type {{runUntilSuccess: jest.MockInstance}} */
    let psi;

    beforeEach(() => {
      psi = {
        CACHEBUST_TIMEOUT: 0,
        runUntilSuccess: jest.fn().mockResolvedValue('{"lhr": true}'),
      };
    });

    it('should throw for invalid tokens', async () => {
      storageMethod.findProjectBySlug.mockResolvedValue(undefined);
      const site = {projectSlug: 'invalid'};
      await expect(psiCollectForProject(storageMethod, psi, site)).rejects.toMatchObject({
        message: 'Invalid project slug "invalid"',
      });
    });

    it('should throw when urls are not set', async () => {
      const site = {};
      await expect(psiCollectForProject(storageMethod, psi, site)).rejects.toMatchObject({
        message: 'No URLs set',
      });
    });

    it('should throw when PSI fails', async () => {
      psi.runUntilSuccess.mockRejectedValue(new Error('PSI failure'));
      const site = {urls: ['http://example.com']};
      await expect(psiCollectForProject(storageMethod, psi, site)).rejects.toMatchObject({
        message: 'PSI failure',
      });
    });

    it('should collect PSI results for site', async () => {
      const site = {urls: ['http://example.com']};
      await psiCollectForProject(storageMethod, psi, site);
      expect(storageMethod.createBuild.mock.calls).toMatchObject([
        [{projectId: 1, branch: 'main'}],
      ]);
      expect(storageMethod.createRun.mock.calls).toMatchObject([
        [{projectId: 1, buildId: 2, url: 'http://example.com', lhr: '{"lhr": true}'}],
        [{projectId: 1, buildId: 2, url: 'http://example.com', lhr: '{"lhr": true}'}],
        [{projectId: 1, buildId: 2, url: 'http://example.com', lhr: '{"lhr": true}'}],
        [{projectId: 1, buildId: 2, url: 'http://example.com', lhr: '{"lhr": true}'}],
        [{projectId: 1, buildId: 2, url: 'http://example.com', lhr: '{"lhr": true}'}],
      ]);
      expect(storageMethod.sealBuild).toHaveBeenCalled();
    });

    it('should fill in all the branch requests', async () => {
      const site = {urls: ['http://example.com']};
      await psiCollectForProject(storageMethod, psi, site);

      expect(storageMethod.createBuild).toHaveBeenCalled();
      const buildArgument = storageMethod.createBuild.mock.calls[0][0];
      expect(buildArgument.hash).toMatch(/^[a-f0-9]+$/);
      buildArgument.hash = '<HASH>';
      buildArgument.commitMessage = buildArgument.commitMessage.replace(/at.*/, 'at <DATE>');
      buildArgument.runAt = buildArgument.runAt.replace(/.*/, '<DATE>');
      buildArgument.committedAt = buildArgument.committedAt.replace(/.*/, '<DATE>');
      expect(buildArgument).toMatchInlineSnapshot(`
        Object {
          "author": "Lighthouse CI Server <no-reply@example.com>",
          "avatarUrl": "https://www.gravatar.com/avatar/f52a99e6bec57a971cbe232b7c5cc49f.jpg?d=identicon",
          "branch": "main",
          "commitMessage": "Autocollected at <DATE>",
          "committedAt": "<DATE>",
          "externalBuildUrl": "http://example.com",
          "hash": "<HASH>",
          "lifecycle": "unsealed",
          "projectId": 1,
          "runAt": "<DATE>",
        }
      `);
    });

    it('should respect the branch setting', async () => {
      const site = {urls: ['http://example.com'], branch: 'dev'};
      await psiCollectForProject(storageMethod, psi, site);
      expect(storageMethod.createBuild.mock.calls).toMatchObject([[{projectId: 1, branch: 'dev'}]]);
    });

    it('should respect number of runs', async () => {
      const site = {urls: ['http://example.com'], numberOfRuns: 4};
      await psiCollectForProject(storageMethod, psi, site);
      expect(storageMethod.createRun.mock.calls).toMatchObject([
        [{projectId: 1, buildId: 2, url: 'http://example.com', lhr: '{"lhr": true}'}],
        [{projectId: 1, buildId: 2, url: 'http://example.com', lhr: '{"lhr": true}'}],
        [{projectId: 1, buildId: 2, url: 'http://example.com', lhr: '{"lhr": true}'}],
        [{projectId: 1, buildId: 2, url: 'http://example.com', lhr: '{"lhr": true}'}],
      ]);
    });

    it('should collect all urls', async () => {
      const site = {urls: ['http://example.com/1', 'http://example.com/2'], numberOfRuns: 2};
      await psiCollectForProject(storageMethod, psi, site);
      expect(storageMethod.createRun.mock.calls).toMatchObject([
        [{projectId: 1, buildId: 2, url: 'http://example.com/1', lhr: '{"lhr": true}'}],
        [{projectId: 1, buildId: 2, url: 'http://example.com/2', lhr: '{"lhr": true}'}],
        [{projectId: 1, buildId: 2, url: 'http://example.com/1', lhr: '{"lhr": true}'}],
        [{projectId: 1, buildId: 2, url: 'http://example.com/2', lhr: '{"lhr": true}'}],
      ]);
    });
  });

  describe('.startPsiCollectCron()', () => {
    const logLevel = 'silent';

    it('should schedule a cron job per site', () => {
      const psiCollectCron = {
        sites: [
          {schedule: '0 * * * *', urls: ['http://example.com'], projectSlug: 'a'},
          {schedule: '0 * * * *', urls: ['http://other-example.com'], projectSlug: 'b'},
        ],
      };

      startPsiCollectCron(storageMethod, {logLevel, psiCollectCron});
      expect(cronJob).toHaveBeenCalledTimes(2);
    });

    it('should validate uniqueness', () => {
      const psiCollectCron = {
        sites: [
          {schedule: '0 * * * *', urls: ['http://example.com']},
          {schedule: '0 * * * *', urls: ['http://other-example.com']},
        ],
      };

      expect(() => startPsiCollectCron(storageMethod, {logLevel, psiCollectCron})).toThrow(
        /more than one/
      );
    });

    it('should validate cron job', () => {
      const psiCollectCron = {
        sites: [{schedule: '* * * * *', urls: ['http://example.com']}],
      };

      expect(() => startPsiCollectCron(storageMethod, {logLevel, psiCollectCron})).toThrow(
        /too frequent/
      );
    });

    it('should validate invalid format', () => {
      const psiCollectCron = {
        sites: [{schedule: '* * *', urls: ['http://example.com']}],
      };

      expect(() => startPsiCollectCron(storageMethod, {logLevel, psiCollectCron})).toThrow(
        /Invalid cron format/
      );
    });
  });
});

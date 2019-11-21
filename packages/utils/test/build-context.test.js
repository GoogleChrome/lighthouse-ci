/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/* eslint-env jest */

const buildContext = require('../src/build-context.js');

describe('build-context.js', () => {
  let envBefore;

  beforeEach(() => {
    envBefore = process.env;
    process.env = {};
    for (const [key, value] of Object.entries(envBefore)) {
      if (key.startsWith('LHCI')) continue;
      if (key.startsWith('TRAVIS')) continue;
      if (key.startsWith('GITHUB')) continue;
      if (key.startsWith('CI')) continue;
      process.env[key] = value;
    }
  });

  afterEach(() => {
    process.env = envBefore;
  });

  // commit e7f1b0fa3aebb6ef95e44c0d0b820433ffdd2e63
  // Author: Patrick Hulce <patrick.hulce@gmail.com>
  // Date:   Tue Oct 29 16:43:39 2019 -0500
  //
  //   feat(server): add version endpoint
  //
  const hash = 'e7f1b0fa3aebb6ef95e44c0d0b820433ffdd2e63';

  describe('#getCurrentHash()', () => {
    it('should work', () => {
      expect(buildContext.getCurrentHash()).toMatch(/^[a-f0-9]{40}$/);
    });

    it('should respect env override', () => {
      process.env.LHCI_BUILD_CONTEXT__CURRENT_HASH = 'face1235';
      expect(buildContext.getCurrentHash()).toEqual('face1235');
    });
  });

  describe('#getCommitTime()', () => {
    it('should work', () => {
      expect(buildContext.getCommitTime(hash)).toEqual('2019-10-29T16:43:39-05:00');
    });
  });

  describe('#getCurrentBranch()', () => {
    it('should not throw', () => {
      buildContext.getCurrentBranch(hash);
    });

    it('should respect env override', () => {
      process.env.LHCI_BUILD_CONTEXT__CURRENT_BRANCH = 'foobar-nonsense';
      expect(buildContext.getCurrentBranch(hash)).toEqual('foobar-nonsense');
    });
  });

  describe('#getCommitMessage()', () => {
    it('should work', () => {
      expect(buildContext.getCommitMessage(hash)).toEqual('feat(server): add version endpoint');
    });
  });

  describe('#getAuthor()', () => {
    it('should work', () => {
      expect(buildContext.getAuthor(hash)).toEqual('Patrick Hulce <patrick.hulce@gmail.com>');
    });
  });

  describe('#getAvatarUrl()', () => {
    it('should work', () => {
      expect(buildContext.getAvatarUrl(hash)).toEqual(
        'https://www.gravatar.com/avatar/78bafdcaf40e20b90bb76b9aa5834e11.jpg?d=identicon'
      );
    });
  });

  describe('#getAncestorHashForMaster()', () => {
    it('should work', () => {
      expect(buildContext.getAncestorHashForMaster(hash)).toEqual(
        'ec95bc8ad992c9d68845040d612fbbbe94ad7f13'
      );
    });

    it('should return empty string when it fails', () => {
      expect(buildContext.getAncestorHashForMaster('random' + Math.random())).toEqual('');
    });
  });

  describe('#getAncestorHashForBranch()', () => {
    it('should work', () => {
      // the merge-base of master with itself is just itself.
      expect(buildContext.getAncestorHashForBranch(hash)).toEqual(hash);
    });

    it('should return empty string when it fails', () => {
      expect(buildContext.getAncestorHashForMaster('random' + Math.random())).toEqual('');
    });
  });

  describe('#getExternalBuildUrl()', () => {
    it('should respect env override', () => {
      process.env.LHCI_BUILD_CONTEXT__EXTERNAL_BUILD_URL = 'http://lhci.example.com/build/1';
      expect(buildContext.getExternalBuildUrl()).toEqual('http://lhci.example.com/build/1');
    });
  });

  describe('#getGitHubRepoSlug', () => {
    it('should work for circle CI', () => {
      process.env.CIRCLE_PROJECT_USERNAME = 'SuperLighthouse';
      process.env.CIRCLE_PROJECT_REPONAME = 'lhci';
      expect(buildContext.getGitHubRepoSlug()).toEqual('SuperLighthouse/lhci');
    });

    it('should respect env override', () => {
      process.env.LHCI_BUILD_CONTEXT__GITHUB_REPO_SLUG = 'SuperLighthouse/manual';
      expect(buildContext.getGitHubRepoSlug()).toEqual('SuperLighthouse/manual');
    });
  });
});

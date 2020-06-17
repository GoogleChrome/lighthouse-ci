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
      if (key.startsWith('LHCI_')) continue;
      if (key.startsWith('TRAVIS_')) continue;
      if (key.startsWith('GITHUB_')) continue;
      if (key.startsWith('CI_')) continue;
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
  // commit aebce298f6727ab942b065d72a60534802a15295 (tag: v0.3.12)
  // Author: Patrick Hulce <patrick.hulce@gmail.com>
  // Date:   Thu Mar 19 22:37:31 2020 -0500
  //
  //   fix(cli): revert to lhci github status context (#249)
  //
  const versionHash = 'aebce298f6727ab942b065d72a60534802a15295';

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

    it('should respect env override', () => {
      process.env.LHCI_BUILD_CONTEXT__COMMIT_TIME = '2019-12-11T16:54:32.000Z';
      expect(buildContext.getCommitTime(hash)).toEqual('2019-12-11T16:54:32.000Z');
    });
  });

  describe('#getCurrentBranch()', () => {
    it('should not throw', () => {
      if (process.env.CI) return; // CI-based runs rely on the env overrides
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

    it('should respect env override', () => {
      process.env.LHCI_BUILD_CONTEXT__COMMIT_MESSAGE = 'Daily run';
      expect(buildContext.getCommitMessage(hash)).toEqual('Daily run');
    });
  });

  describe('#getAuthor()', () => {
    it('should work', () => {
      expect(buildContext.getAuthor(hash)).toEqual('Patrick Hulce <patrick.hulce@gmail.com>');
    });

    it('should respect env override', () => {
      process.env.LHCI_BUILD_CONTEXT__AUTHOR = 'Paul Irish <paulirish@google.com>';
      expect(buildContext.getAuthor(hash)).toEqual('Paul Irish <paulirish@google.com>');
    });
  });

  describe('#getAvatarUrl()', () => {
    it('should work', () => {
      expect(buildContext.getAvatarUrl(hash)).toEqual(
        'https://www.gravatar.com/avatar/78bafdcaf40e20b90bb76b9aa5834e11.jpg?d=identicon'
      );
    });

    it('should respect env override', () => {
      process.env.LHCI_BUILD_CONTEXT__AVATAR_URL = 'http://localhost:1234/profile.jpg';
      expect(buildContext.getAvatarUrl(hash)).toEqual('http://localhost:1234/profile.jpg');
    });
  });

  describe('#getGravatarUrlFromEmail()', () => {
    it('should work', () => {
      expect(buildContext.getGravatarUrlFromEmail('patrick.hulce@gmail.com')).toEqual(
        'https://www.gravatar.com/avatar/78bafdcaf40e20b90bb76b9aa5834e11.jpg?d=identicon'
      );
    });
  });

  describe('#getAncestorHashForBase()', () => {
    it('should work', () => {
      expect(buildContext.getAncestorHashForBase(hash)).toEqual(
        'ec95bc8ad992c9d68845040d612fbbbe94ad7f13'
      );
    });

    it('should return empty string when it fails', () => {
      expect(buildContext.getAncestorHashForBase('random' + Math.random())).toEqual('');
    });

    it('should respect env override', () => {
      process.env.LHCI_BUILD_CONTEXT__ANCESTOR_HASH = '123456789';
      expect(buildContext.getAncestorHash(hash)).toEqual('123456789');
    });
  });

  describe('#getAncestorHashForBranch()', () => {
    it('should work', () => {
      // the merge-base of master with itself is just itself.
      expect(buildContext.getAncestorHashForBranch(hash)).toEqual(hash);
    });

    it('should work for alternate branches', () => {
      // the merge-base of master with itself is just itself.
      expect(buildContext.getAncestorHashForBranch('HEAD', 'v0.3.12')).toEqual(versionHash);
    });

    it('should return empty string when it fails', () => {
      expect(buildContext.getAncestorHashForBase('random' + Math.random())).toEqual('');
    });
  });

  describe('#getExternalBuildUrl()', () => {
    it('should respect env override', () => {
      process.env.LHCI_BUILD_CONTEXT__EXTERNAL_BUILD_URL = 'http://lhci.example.com/build/1';
      expect(buildContext.getExternalBuildUrl()).toEqual('http://lhci.example.com/build/1');
    });
  });

  describe('#getGitRemote', () => {
    it('should find the origin', () => {
      expect(buildContext.getGitRemote()).toContain('lighthouse-ci');
    });

    it('should respect env override', () => {
      process.env.LHCI_BUILD_CONTEXT__GIT_REMOTE = 'git@github.com:patrickhulce/lighthouse-ci.git';
      expect(buildContext.getGitRemote()).toEqual('git@github.com:patrickhulce/lighthouse-ci.git');
    });
  });

  describe('#getGitHubRepoSlug', () => {
    const DEFAULT_API_HOST = 'https://api.github.com';

    it('should return undefined when there is no valid slug on github', () => {
      process.env.LHCI_BUILD_CONTEXT__GIT_REMOTE = `${DEFAULT_API_HOST}/broken/url/repo`;
      expect(buildContext.getGitHubRepoSlug()).toEqual(undefined);
    });

    it('should return undefined when there is no valid slug on custom', () => {
      const apiHost = 'https://github.example.com';
      process.env.LHCI_BUILD_CONTEXT__GIT_REMOTE = `${apiHost}/broken/url/repo`;
      expect(buildContext.getGitHubRepoSlug(apiHost)).toEqual(undefined);
    });

    it('should return undefined when there is no valid URL on custom', () => {
      const apiHost = 'https://github.example.com';
      process.env.LHCI_BUILD_CONTEXT__GIT_REMOTE = `random/broken/url/repo`;
      expect(buildContext.getGitHubRepoSlug(apiHost)).toEqual(undefined);
    });

    it('should work for circle CI', () => {
      process.env.CIRCLE_PROJECT_USERNAME = 'SuperLighthouse';
      process.env.CIRCLE_PROJECT_REPONAME = 'lhci';
      expect(buildContext.getGitHubRepoSlug()).toEqual('SuperLighthouse/lhci');
    });

    it('should respect env override', () => {
      process.env.LHCI_BUILD_CONTEXT__GITHUB_REPO_SLUG = 'SuperLighthouse/manual';
      expect(buildContext.getGitHubRepoSlug()).toEqual('SuperLighthouse/manual');
    });

    it('should work when enterprise API host is provided with ssh remote', () => {
      const apiHost = 'https://github.example.com';
      process.env.LHCI_BUILD_CONTEXT__GIT_REMOTE = 'git@github.example.com:corp/repo.git';
      expect(buildContext.getGitHubRepoSlug(apiHost)).toEqual('corp/repo');
    });

    it('should work when enterprise API host is provided with https remote', () => {
      const apiHost = 'https://github.example.com';
      process.env.LHCI_BUILD_CONTEXT__GIT_REMOTE = `${apiHost}/corp/repo.git`;
      expect(buildContext.getGitHubRepoSlug(apiHost)).toEqual('corp/repo');
    });

    it('should work when default API host is provided', () => {
      expect(buildContext.getGitHubRepoSlug(DEFAULT_API_HOST)).toEqual(
        'GoogleChrome/lighthouse-ci'
      );
    });

    it('should work when git remote does not end in .git', () => {
      process.env.LHCI_BUILD_CONTEXT__GIT_REMOTE = 'https://github.com/GoogleChrome/lighthouse';
      expect(buildContext.getGitHubRepoSlug()).toEqual('GoogleChrome/lighthouse');
    });

    it('should work when git remote does end in .git', () => {
      process.env.LHCI_BUILD_CONTEXT__GIT_REMOTE = 'git@github.com:example/repo.git';
      expect(buildContext.getGitHubRepoSlug()).toEqual('example/repo');
    });

    it('should fallback to getGitRemote result', () => {
      expect(buildContext.getGitHubRepoSlug()).toEqual('GoogleChrome/lighthouse-ci');
    });
  });
});

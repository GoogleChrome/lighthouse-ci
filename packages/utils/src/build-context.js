/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const crypto = require('crypto');
const childProcess = require('child_process');

const envVars = process.env;

/**
 * @return {string}
 */
function getCurrentHash() {
  if (envVars.TRAVIS_PULL_REQUEST_SHA) return envVars.TRAVIS_PULL_REQUEST_SHA;
  if (envVars.TRAVIS_COMMIT) return envVars.TRAVIS_COMMIT;

  const result = childProcess.spawnSync('git', ['rev-list', '--no-merges', '-n1', 'HEAD'], {
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    throw new Error('Unable to determine current hash with `git rev-parse HEAD`');
  }

  return result.stdout.trim();
}

/**
 * @param {string} hash
 * @return {string}
 */
function getCommitTime(hash) {
  const result = childProcess.spawnSync('git', ['log', '-n1', '--pretty=%cI', hash], {
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    throw new Error('Unable to retrieve committer timestamp from commit');
  }

  return result.stdout.trim();
}

/**
 * @return {string}
 */
function getCurrentBranch() {
  if (envVars.TRAVIS_PULL_REQUEST_BRANCH) return envVars.TRAVIS_PULL_REQUEST_BRANCH.slice(0, 40);
  if (envVars.TRAVIS_BRANCH) return envVars.TRAVIS_BRANCH.slice(0, 40);

  const result = childProcess.spawnSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    throw new Error('Unable to determine current branch with `git rev-parse --abbrev-ref HEAD`');
  }

  return result.stdout.trim().slice(0, 40);
}

/**
 * @return {string}
 */
function getExternalBuildUrl() {
  return envVars.TRAVIS_BUILD_WEB_URL || '';
}

/**
 * @param {string} hash
 * @return {string}
 */
function getCommitMessage(hash = 'HEAD') {
  const result = childProcess.spawnSync('git', ['log', '--format=%s', '-n', '1', hash], {
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    throw new Error('Unable to determine commit message with `git log --format=%s -n 1`');
  }

  return result.stdout.trim().slice(0, 80);
}

/**
 * @param {string} hash
 * @return {string}
 */
function getAuthor(hash = 'HEAD') {
  const result = childProcess.spawnSync('git', ['log', '--format=%aN <%aE>', '-n', '1', hash], {
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    throw new Error('Unable to determine commit author with `git log --format=%aN <%aE> -n 1`');
  }

  return result.stdout.trim().slice(0, 256);
}

/**
 * @param {string} hash
 * @return {string}
 */
function getAvatarUrl(hash = 'HEAD') {
  const result = childProcess.spawnSync('git', ['log', '--format=%aE', '-n', '1', hash], {
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    throw new Error('Unable to determine commit email with `git log --format=%aE -n 1`');
  }

  // Use default gravatar image, see https://en.gravatar.com/site/implement/images/.
  const md5 = crypto.createHash('md5');
  md5.update(result.stdout.trim().toLowerCase());
  return `https://www.gravatar.com/avatar/${md5.digest('hex')}.jpg?d=identicon`;
}

/**
 * @param {string} [hash]
 * @return {string}
 */
function getAncestorHashForMaster(hash = 'HEAD') {
  const result = childProcess.spawnSync('git', ['rev-parse', `${hash}^`], {encoding: 'utf8'});
  // Ancestor hash is optional, so do not throw if it can't be computed.
  // See https://github.com/GoogleChrome/lighthouse-ci/issues/36
  if (result.status !== 0) return '';

  return result.stdout.trim();
}

/**
 * @param {string} [hash]
 * @return {string}
 */
function getAncestorHashForBranch(hash = 'HEAD') {
  const result = childProcess.spawnSync('git', ['merge-base', hash, 'master'], {
    encoding: 'utf8',
  });

  // Ancestor hash is optional, so do not throw if it can't be computed.
  // See https://github.com/GoogleChrome/lighthouse-ci/issues/36
  if (result.status !== 0) return '';

  return result.stdout.trim();
}

/**
 * @param {string} [hash]
 * @return {string}
 */
function getAncestorHash(hash = 'HEAD') {
  return getCurrentBranch() === 'master'
    ? getAncestorHashForMaster(hash)
    : getAncestorHashForBranch(hash);
}

function getRepoSlug() {
  if (envVars.TRAVIS_PULL_REQUEST_SLUG) return envVars.TRAVIS_PULL_REQUEST_SLUG;
  if (envVars.TRAVIS_REPO_SLUG) return envVars.TRAVIS_REPO_SLUG;
}

module.exports = {
  getCurrentHash,
  getCommitTime,
  getCurrentBranch,
  getExternalBuildUrl,
  getCommitMessage,
  getAuthor,
  getAvatarUrl,
  getAncestorHash,
  getAncestorHashForMaster,
  getAncestorHashForBranch,
  getRepoSlug,
};

/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const crypto = require('crypto');
const childProcess = require('child_process');

/** @param {Array<string>} namesInPriorityOrder @return {string|undefined} */
function getEnvVarIfSet(namesInPriorityOrder) {
  for (const name of namesInPriorityOrder) {
    if (process.env[name]) return process.env[name];
  }
}

/**
 * @param {Array<[string, ReadonlyArray<string>]>} commands
 * @return {import('child_process').SpawnSyncReturns<string>}
 */
function runCommandsUntilFirstSuccess(commands) {
  /** @type {import('child_process').SpawnSyncReturns<string>|undefined} */
  let result;

  for (const [command, args] of commands) {
    result = childProcess.spawnSync(command, args, {encoding: 'utf8'});
    if (result.status === 0) break;
  }

  if (!result) throw new Error('Must specify at least one command');
  return result;
}

/**
 * @return {string}
 */
function getCurrentHash() {
  const envHash = getEnvVarIfSet([
    // Manual override
    'LHCI_BUILD_CONTEXT__CURRENT_HASH',
    // Travis CI
    'TRAVIS_PULL_REQUEST_SHA',
    'TRAVIS_COMMIT',
    // Circle CI
    'CIRCLE_SHA1',
  ]);
  if (envHash) return envHash;

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
function getCurrentBranchRaw_() {
  const envBranch = getEnvVarIfSet([
    // Manual override
    'LHCI_BUILD_CONTEXT__CURRENT_BRANCH',
    // Travis CI
    'TRAVIS_PULL_REQUEST_BRANCH',
    'TRAVIS_BRANCH',
    // GitHub Actions, see https://github.com/GoogleChrome/lighthouse-ci/issues/43#issuecomment-551174778
    'GITHUB_HEAD_REF',
    'GITHUB_REF',
    // Circle CI
    'CIRCLE_BRANCH',
    // Gitlab CI, see https://docs.gitlab.com/ee/ci/variables/predefined_variables.html
    'CI_EXTERNAL_PULL_REQUEST_SOURCE_BRANCH_NAME',
    'CI_MERGE_REQUEST_SOURCE_BRANCH_NAME',
    'CI_COMMIT_REF_NAME',
  ]);
  if (envBranch) return envBranch;

  const result = childProcess.spawnSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
    encoding: 'utf8',
  });

  const branch = result.stdout.trim();
  if (result.status !== 0 || branch === 'HEAD') {
    throw new Error('Unable to determine current branch with `git rev-parse --abbrev-ref HEAD`');
  }

  return branch;
}

/**
 * @return {string}
 */
function getCurrentBranch() {
  const branch = getCurrentBranchRaw_();
  if (branch === 'HEAD') throw new Error('Unable to determine current branch');
  return branch.replace('refs/heads/', '').slice(0, 40);
}

/**
 * @return {string}
 */
function getExternalBuildUrl() {
  const envUrl = getEnvVarIfSet([
    // Manual override
    'LHCI_BUILD_CONTEXT__EXTERNAL_BUILD_URL',
    // Travis CI
    'TRAVIS_BUILD_WEB_URL',
    // Circle CI
    'CIRCLE_BUILD_URL',
    // Gitlab CI
    'CI_JOB_URL',
  ]);

  return envUrl || '';
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
  const result = runCommandsUntilFirstSuccess([
    ['git', ['merge-base', hash, 'origin/master']],
    ['git', ['merge-base', hash, 'master']],
  ]);

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

function getGitHubRepoSlug() {
  const envSlug = getEnvVarIfSet([
    // Manual override
    'LHCI_BUILD_CONTEXT__GITHUB_REPO_SLUG',
    // Travis CI
    'TRAVIS_PULL_REQUEST_SLUG',
    'TRAVIS_REPO_SLUG',
    // GitHub Actions
    'GITHUB_REPOSITORY',
  ]);
  if (envSlug) return envSlug;

  // Support CircleCI
  if (process.env.CIRCLE_PROJECT_USERNAME && process.env.CIRCLE_PROJECT_REPONAME) {
    return `${process.env.CIRCLE_PROJECT_USERNAME}/${process.env.CIRCLE_PROJECT_REPONAME}`;
  }
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
  getGitHubRepoSlug,
};

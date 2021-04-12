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

/** @return {string|undefined} */
function getGitRemote() {
  const envHash = getEnvVarIfSet([
    // Manual override
    'LHCI_BUILD_CONTEXT__GIT_REMOTE',
    // GitLab CI
    'CI_REPOSITORY_URL',
  ]);
  if (envHash) return envHash;

  const result = childProcess.spawnSync('git', ['remote', '-v'], {encoding: 'utf8'});
  if (result.status !== 0) return undefined;

  const originLine = result.stdout.split('\n').find(l => l.startsWith('origin'));
  if (!originLine) return undefined;
  const matches = originLine.match(/^origin\s+(\S+)\s+/);
  if (!matches) return undefined;
  return matches[1];
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
    // GitLab CI
    'CI_COMMIT_SHA',
    // Drone CI
    'DRONE_COMMIT_SHA',
  ]);
  if (envHash) return envHash;

  const result = childProcess.spawnSync('git', ['rev-list', '--no-merges', '-n1', 'HEAD'], {
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    throw new Error(
      'Unable to determine current hash with `git rev-parse HEAD`. ' +
        'This can be overridden with setting LHCI_BUILD_CONTEXT__CURRENT_HASH env.'
    );
  }

  return result.stdout.trim();
}

/**
 * @param {string} hash
 * @return {string}
 */
function getCommitTime(hash) {
  const envHash = getEnvVarIfSet([
    // Manual override
    'LHCI_BUILD_CONTEXT__COMMIT_TIME',
    // GitLab CI
    'CI_COMMIT_TIMESTAMP',
  ]);
  if (envHash) return envHash;

  const result = childProcess.spawnSync('git', ['log', '-n1', '--pretty=%cI', hash], {
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    throw new Error(
      'Unable to retrieve committer timestamp from commit. ' +
        'This can be overridden with setting LHCI_BUILD_CONTEXT__COMMIT_TIME env.'
    );
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
    // Drone CI, see https://docs.drone.io/pipeline/environment/reference/
    'DRONE_BRANCH',
  ]);
  if (envBranch) return envBranch;

  const result = childProcess.spawnSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
    encoding: 'utf8',
  });

  const branch = typeof result.stdout === 'string' && result.stdout.trim();
  if (result.status !== 0 || !branch || branch === 'HEAD') {
    throw new Error(
      'Unable to determine current branch with `git rev-parse --abbrev-ref HEAD`. ' +
        'This can be overridden with setting LHCI_BUILD_CONTEXT__CURRENT_BRANCH env.'
    );
  }

  return branch;
}

/**
 * Returns the current branch name. Throws if it could not be determined.
 * @return {string}
 */
function getCurrentBranch() {
  const branch = getCurrentBranchRaw_();
  if (branch === 'HEAD') throw new Error('Unable to determine current branch');
  return branch.replace('refs/heads/', '').slice(0, 40);
}

/**
 * Returns the current branch name. Returns `undefined` if it could not be determined.
 * @return {string|undefined}
 */
function getCurrentBranchSafe() {
  try {
    return getCurrentBranch();
  } catch (err) {
    return undefined;
  }
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
  const envHash = getEnvVarIfSet([
    // Manual override
    'LHCI_BUILD_CONTEXT__COMMIT_MESSAGE',
    // GitLab CI
    'CI_COMMIT_MESSAGE',
  ]);
  if (envHash) return envHash.trim().slice(0, 80);

  const result = childProcess.spawnSync('git', ['log', '--format=%s', '-n', '1', hash], {
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    throw new Error(
      'Unable to determine commit message with `git log --format=%s -n 1`. ' +
        'This can be overridden with setting LHCI_BUILD_CONTEXT__COMMIT_MESSAGE env.'
    );
  }

  return result.stdout.trim().slice(0, 80);
}

/**
 * @param {string} hash
 * @return {string}
 */
function getAuthor(hash = 'HEAD') {
  const envHash = getEnvVarIfSet([
    // Manual override
    'LHCI_BUILD_CONTEXT__AUTHOR',
    // GitLab CI: https://gitlab.com/gitlab-org/gitlab/-/issues/284079
    'CI_COMMIT_AUTHOR',
  ]);
  if (envHash) return envHash.trim().slice(0, 256);

  const result = childProcess.spawnSync('git', ['log', '--format=%aN <%aE>', '-n', '1', hash], {
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    throw new Error(
      'Unable to determine commit author with `git log --format=%aN <%aE> -n 1`. ' +
        'This can be overridden with setting LHCI_BUILD_CONTEXT__AUTHOR env.'
    );
  }

  return result.stdout.trim().slice(0, 256);
}

/**
 * @param {string} author
 * @return {string | null}
 */
function getEmailFromAuthor(author) {
  const emailRegex = new RegExp(/ <(\S+@\S+)>$/);
  const emailMatch = author.match(emailRegex);
  if (!emailMatch) return null;
  return emailMatch[1];
}

/**
 * @param {string} hash
 * @return {string}
 */
function getAvatarUrl(hash = 'HEAD') {
  const envHash = getEnvVarIfSet([
    // Manual override
    'LHCI_BUILD_CONTEXT__AVATAR_URL',
  ]);
  if (envHash) return envHash;

  // Next try to parse the email from the complete author.
  const author = getAuthor(hash);
  const email = getEmailFromAuthor(author);
  if (email) return getGravatarUrlFromEmail(email);

  // Finally fallback to git again if we couldn't parse the email out of the author.
  const result = childProcess.spawnSync('git', ['log', '--format=%aE', '-n', '1', hash], {
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    throw new Error(
      "Unable to determine commit author's avatar URL because `git log --format=%aE -n 1` failed to provide author's email. " +
        'This can be overridden with setting LHCI_BUILD_CONTEXT__AVATAR_URL env.'
    );
  }

  return getGravatarUrlFromEmail(result.stdout);
}

/**
 * @param {string} email
 * @return {string}
 */
function getGravatarUrlFromEmail(email) {
  // Use default gravatar image, see https://en.gravatar.com/site/implement/images/.
  const md5 = crypto.createHash('md5');
  md5.update(email.trim().toLowerCase());
  return `https://www.gravatar.com/avatar/${md5.digest('hex')}.jpg?d=identicon`;
}

/**
 * @param {string} hash
 * @return {string}
 */
function getAncestorHashForBase(hash) {
  const result = childProcess.spawnSync('git', ['rev-parse', `${hash}^`], {encoding: 'utf8'});
  // Ancestor hash is optional, so do not throw if it can't be computed.
  // See https://github.com/GoogleChrome/lighthouse-ci/issues/36
  if (result.status !== 0) return '';

  return result.stdout.trim();
}

/**
 * @param {string} hash
 * @param {string} baseBranch
 * @return {string}
 */
function getAncestorHashForBranch(hash, baseBranch) {
  const result = runCommandsUntilFirstSuccess([
    ['git', ['merge-base', hash, `origin/${baseBranch}`]],
    ['git', ['merge-base', hash, baseBranch]],
  ]);

  // Ancestor hash is optional, so do not throw if it can't be computed.
  // See https://github.com/GoogleChrome/lighthouse-ci/issues/36
  if (result.status !== 0) return '';

  return result.stdout.trim();
}

/**
 * @param {string} hash
 * @param {string} baseBranch
 * @return {string}
 */
function getAncestorHash(hash, baseBranch) {
  const envHash = getEnvVarIfSet([
    // Manual override
    'LHCI_BUILD_CONTEXT__ANCESTOR_HASH',
    // GitLab CI
    'CI_COMMIT_BEFORE_SHA',
  ]);
  if (envHash && envHash !== '0000000000000000000000000000000000000000') return envHash;

  return getCurrentBranch() === baseBranch
    ? getAncestorHashForBase(hash)
    : getAncestorHashForBranch(hash, baseBranch);
}

/** @param {string|undefined} apiHost */
function getGitHubRepoSlug(apiHost = undefined) {
  const envSlug = getEnvVarIfSet([
    // Manual override
    'LHCI_BUILD_CONTEXT__GITHUB_REPO_SLUG',
    // Travis CI
    'TRAVIS_PULL_REQUEST_SLUG',
    'TRAVIS_REPO_SLUG',
    // GitHub Actions
    'GITHUB_REPOSITORY',
    // Drone CI
    'DRONE_REPO',
  ]);
  if (envSlug) return envSlug;

  // Support CircleCI
  if (process.env.CIRCLE_PROJECT_USERNAME && process.env.CIRCLE_PROJECT_REPONAME) {
    return `${process.env.CIRCLE_PROJECT_USERNAME}/${process.env.CIRCLE_PROJECT_REPONAME}`;
  }

  const remote = getGitRemote();
  if (remote && remote.includes('github.com')) {
    const remoteMatch = remote.match(/github\.com.([^/]+\/[^/]+?)(\.git|$)/);
    if (remoteMatch) return remoteMatch[1];
  }

  if (remote && apiHost && !apiHost.includes('github.com')) {
    const hostMatch = apiHost.match(/:\/\/(.*?)(\/|$)/);
    if (!hostMatch) return undefined;
    const remoteRegex = new RegExp(`${hostMatch[1]}(:|\\/)([^/]+\\/.+)\\.git`);
    const remoteMatch = remote.match(remoteRegex);
    if (remoteMatch) return remoteMatch[2];
  }
}

module.exports = {
  getCurrentHash,
  getCommitTime,
  getCurrentBranch,
  getCurrentBranchSafe,
  getExternalBuildUrl,
  getCommitMessage,
  getAuthor,
  getEmailFromAuthor,
  getAvatarUrl,
  getGravatarUrlFromEmail,
  getAncestorHash,
  getAncestorHashForBase,
  getAncestorHashForBranch,
  getGitRemote,
  getGitHubRepoSlug,
};

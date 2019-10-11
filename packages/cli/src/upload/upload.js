/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const URL = require('url').URL;
const crypto = require('crypto');
const fetch = require('isomorphic-fetch');
const childProcess = require('child_process');
const _ = require('@lhci/utils/src/lodash.js');
const ApiClient = require('@lhci/utils/src/api-client.js');
const {computeRepresentativeRuns} = require('@lhci/utils/src/representative-runs.js');
const {
  loadSavedLHRs,
  loadAssertionResults,
  replaceUrlPatterns,
  getHTMLReportForLHR,
} = require('@lhci/utils/src/saved-reports.js');

const envVars = process.env;

/** @param {string} message */
const print = message => {
  process.stdout.write(message);
};

const TEMPORARY_PUBLIC_STORAGE_URL =
  'https://us-central1-lighthouse-infrastructure.cloudfunctions.net/saveHtmlReport';

/**
 * @param {import('yargs').Argv} yargs
 */
function buildCommand(yargs) {
  return yargs.options({
    target: {
      type: 'string',
      default: 'lhci',
      choices: ['lhci', 'temporary-public-storage'],
      description:
        'The type of target to upload the data to. If set to anything other than "lhci", ' +
        'some of the options will not apply.',
    },
    token: {
      type: 'string',
      description: 'The Lighthouse CI server token for the project, only applies to `lhci` target.',
    },
    githubToken: {
      type: 'string',
      description: 'The GitHub token to use to apply a status check.',
    },
    serverBaseUrl: {
      description: 'The base URL of the server where results will be saved.',
      default: 'http://localhost:9001/',
    },
    urlReplacementPatterns: {
      type: 'array',
      description: 'sed-like replacement patterns to mask non-deterministic URL substrings.',
      default: [
        's#:[0-9]{3,5}/#:PORT/#', // replace ports
        's/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/UUID/ig', // replace UUIDs
      ],
    },
  });
}

/**
 * @return {string}
 */
function getCurrentHash() {
  if (envVars.TRAVIS_PULL_REQUEST_SHA) return envVars.TRAVIS_PULL_REQUEST_SHA;
  if (envVars.TRAVIS_COMMIT) return envVars.TRAVIS_COMMIT;

  const result = childProcess.spawnSync('git', ['rev-list', '--no-merges', '-n', '1', 'HEAD'], {
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    throw new Error('Unable to determine current hash with `git rev-parse HEAD`');
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
 * @return {string}
 */
function getAncestorHashForMaster() {
  const result = childProcess.spawnSync('git', ['rev-parse', 'HEAD^'], {encoding: 'utf8'});
  if (result.status !== 0) {
    throw new Error('Unable to determine previous hash with `git rev-parse HEAD^`');
  }

  return result.stdout.trim();
}

/**
 * @return {string}
 */
function getAncestorHashForBranch() {
  const result = childProcess.spawnSync('git', ['merge-base', 'HEAD', 'master'], {
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    throw new Error('Unable to determine current hash with `git merge-base HEAD master`');
  }

  return result.stdout.trim();
}

function getRepoSlug() {
  if (envVars.TRAVIS_PULL_REQUEST_SLUG) return envVars.TRAVIS_PULL_REQUEST_SLUG;
  if (envVars.TRAVIS_REPO_SLUG) return envVars.TRAVIS_REPO_SLUG;
}

/**
 * @param {{slug: string, hash: string, state: 'failure'|'success', targetUrl: string, description: string, context: string, token: string}} options
 */
async function postStatusToGitHub(options) {
  const {slug, hash, state, targetUrl, context, description, token} = options;
  const url = `https://api.github.com/repos/${slug}/statuses/${hash}`;
  const payload = {state, context, description, target_url: targetUrl};
  const response = await fetch(url, {
    method: 'POST',
    headers: {'Content-Type': 'application/json', Authorization: `token ${token}`},
    body: JSON.stringify(payload),
  });

  if (response.status === 201) {
    print(`GitHub accepted "${state}" status for "${context}".\n`);
  } else {
    print(`GitHub responded with ${response.status}\n${await response.text()}\n\n`);
  }
}

/**
 * @param {LHCI.UploadCommand.Options} options
 * @param {Map<string, string>} targetUrlMap
 * @return {Promise<void>}
 */
async function runGithubStatusCheck(options, targetUrlMap) {
  const hash = getCurrentHash();
  const slug = getRepoSlug();

  if (!options.githubToken) return print('No GitHub token set, skipping status check.\n');
  print('GitHub token found, attempting to set status...\n');
  if (!slug || !slug.includes('/')) return print(`Invalid repo slug "${slug}", skipping.\n`);
  if (!hash) return print(`Invalid hash "${hash}"\n, skipping.`);

  const assertionResults = loadAssertionResults();
  const groupedResults = _.groupBy(assertionResults, result => result.url).sort(
    (a, b) => a[0].url.length - b[0].url.length
  );

  let index = 0;
  for (const group of groupedResults) {
    index++;
    const rawUrl = group[0].url;
    const url = replaceUrlPatterns(rawUrl, options.urlReplacementPatterns);
    const failedResults = group.filter(result => result.level === 'error');
    const warnResults = group.filter(result => result.level === 'warn');
    const state = failedResults.length ? 'failure' : 'success';
    const context = `lhci/url-${index}`;
    const warningsLabel = warnResults.length ? ` with ${warnResults.length} warning(s)` : '';
    const description = failedResults.length
      ? `${url} failed ${failedResults.length} Lighthouse assertion(s)`
      : `${url} passed${warningsLabel}`;
    const targetUrl = targetUrlMap.get(rawUrl) || rawUrl;

    await postStatusToGitHub({
      slug,
      hash,
      state,
      context,
      description,
      targetUrl,
      token: options.githubToken,
    });
  }
}

/**
 * @param {LHCI.UploadCommand.Options} options
 * @return {Promise<void>}
 */
async function runLHCITarget(options) {
  if (!options.token) throw new Error('Must provide token for LHCI target');

  const api = new ApiClient({rootURL: options.serverBaseUrl});

  const project = await api.findProjectByToken(options.token);
  if (!project) {
    throw new Error('Could not find active project with provided token');
  }

  const hash = getCurrentHash();
  const branch = getCurrentBranch();

  const build = await api.createBuild({
    projectId: project.id,
    lifecycle: 'unsealed',
    hash,
    branch,
    commitMessage: getCommitMessage(hash),
    author: getAuthor(hash),
    avatarUrl: getAvatarUrl(hash),
    ancestorHash: branch === 'master' ? getAncestorHashForMaster() : getAncestorHashForBranch(),
    externalBuildUrl: getExternalBuildUrl(),
    runAt: new Date().toISOString(),
  });

  print(`Saving CI project ${project.name} (${project.id})\n`);
  print(`Saving CI build (${build.id})\n`);

  const lhrs = loadSavedLHRs();
  const urlReplacementPatterns = options.urlReplacementPatterns.filter(Boolean);
  const targetUrlMap = new Map();

  const buildViewUrl = new URL(
    `/app/projects/${build.projectId}/builds/${build.id}`,
    options.serverBaseUrl
  );

  for (const lhr of lhrs) {
    const parsedLHR = JSON.parse(lhr);
    const url = replaceUrlPatterns(parsedLHR.finalUrl, urlReplacementPatterns);
    const run = await api.createRun({
      projectId: project.id,
      buildId: build.id,
      representative: false,
      url,
      lhr,
    });

    buildViewUrl.searchParams.set('compareUrl', url);
    targetUrlMap.set(parsedLHR.finalUrl, buildViewUrl.href);
    print(`Saved LHR to ${options.serverBaseUrl} (${run.id})\n`);
  }

  buildViewUrl.searchParams.delete('compareUrl');
  await api.sealBuild(build.projectId, build.id);
  print(`Done saving build results to Lighthouse CI\n`);
  print(`View build diff at ${buildViewUrl.href}\n`);

  await runGithubStatusCheck(options, targetUrlMap);
}

/**
 * @param {LHCI.UploadCommand.Options} options
 * @return {Promise<void>}
 */
async function runTemporaryPublicStorageTarget(options) {
  /** @type {Array<LH.Result>} */
  const lhrs = loadSavedLHRs().map(lhr => JSON.parse(lhr));
  /** @type {Array<Array<[LH.Result, LH.Result]>>} */
  const lhrsByUrl = _.groupBy(lhrs, lhr => lhr.finalUrl).map(lhrs => lhrs.map(lhr => [lhr, lhr]));
  const representativeLhrs = computeRepresentativeRuns(lhrsByUrl);
  const targetUrlMap = new Map();

  for (const lhr of representativeLhrs) {
    const urlAudited = lhr.finalUrl;
    print(`Uploading median LHR of ${urlAudited}...`);

    try {
      const response = await fetch(TEMPORARY_PUBLIC_STORAGE_URL, {
        method: 'POST',
        headers: {'content-type': 'text/html'},
        body: getHTMLReportForLHR(lhr),
      });

      const {success, url} = await response.json();
      if (success && url) {
        print(`success!\nOpen the report at ${url}\n`);
        targetUrlMap.set(urlAudited, url);
      } else {
        print(`failed!\n`);
      }
    } catch (err) {
      print(`failed!\n`);
      process.stderr.write(err.stack + '\n');
    }
  }

  await runGithubStatusCheck(options, targetUrlMap);
}

/**
 * @param {LHCI.UploadCommand.Options} options
 * @return {Promise<void>}
 */
async function runCommand(options) {
  switch (options.target) {
    case 'lhci':
      return runLHCITarget(options);
    case 'temporary-public-storage':
      return runTemporaryPublicStorageTarget(options);
    default:
      throw new Error(`Unrecognized target "${options.target}"`);
  }
}

module.exports = {buildCommand, runCommand};

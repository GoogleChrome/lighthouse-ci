/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const URL = require('url').URL;
const fetch = require('isomorphic-fetch');
const _ = require('@lhci/utils/src/lodash.js');
const ApiClient = require('@lhci/utils/src/api-client.js');
const {computeRepresentativeRuns} = require('@lhci/utils/src/representative-runs.js');
const {
  loadSavedLHRs,
  loadAssertionResults,
  replaceUrlPatterns,
  getHTMLReportForLHR,
} = require('@lhci/utils/src/saved-reports.js');
const {
  getCurrentHash,
  getCommitTime,
  getCurrentBranch,
  getExternalBuildUrl,
  getCommitMessage,
  getAuthor,
  getAvatarUrl,
  getAncestorHashForMaster,
  getAncestorHashForBranch,
  getGitHubRepoSlug,
} = require('@lhci/utils/src/build-context.js');

/** @param {string} message */
const print = message => {
  process.stdout.write(message);
};

const TEMPORARY_PUBLIC_STORAGE_URL =
  'https://us-central1-lighthouse-infrastructure.cloudfunctions.net/saveHtmlReport';
const GITHUB_APP_STATUS_CHECK_URL =
  'https://us-central1-lighthouse-infrastructure.cloudfunctions.net/githubAppPostStatusCheck';

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
      description: '[lhci only] The Lighthouse CI server token for the project.',
    },
    githubToken: {
      type: 'string',
      description: 'The GitHub token to use to apply a status check.',
    },
    githubAppToken: {
      type: 'string',
      description: 'The LHCI GitHub App token to use to apply a status check.',
    },
    extraHeaders: {
      description: '[lhci only] Extra headers to use when making API requests to the LHCI server.',
    },
    serverBaseUrl: {
      description: '[lhci only] The base URL of the LHCI server where results will be saved.',
      default: 'http://localhost:9001/',
    },
    urlReplacementPatterns: {
      type: 'array',
      description:
        '[lhci only] sed-like replacement patterns to mask non-deterministic URL substrings.',
      default: [
        's#:[0-9]{3,5}/#:PORT/#', // replace ports
        's/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/UUID/ig', // replace UUIDs
      ],
    },
  });
}

/**
 * @param {{slug: string, hash: string, state: 'failure'|'success', targetUrl: string, description: string, context: string, githubToken?: string, githubAppToken?: string}} options
 */
async function postStatusToGitHub(options) {
  const {slug, hash, state, targetUrl, context, description, githubToken, githubAppToken} = options;

  let response;
  if (githubAppToken) {
    const url = GITHUB_APP_STATUS_CHECK_URL;
    const payload = {...options, token: githubAppToken};
    response = await fetch(url, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(payload),
    });
  } else {
    const url = `https://api.github.com/repos/${slug}/statuses/${hash}`;
    const payload = {state, context, description, target_url: targetUrl};
    response = await fetch(url, {
      method: 'POST',
      headers: {'Content-Type': 'application/json', Authorization: `token ${githubToken}`},
      body: JSON.stringify(payload),
    });
  }

  if (response.status === 201) {
    print(`GitHub accepted "${state}" status for "${context}".\n`);
  } else {
    print(`GitHub responded with ${response.status}\n${await response.text()}\n\n`);
  }
}

/**
 *
 * @param {string} rawUrl
 * @param {LHCI.UploadCommand.Options} options
 */
function getUrlLabelForGithub(rawUrl, options) {
  try {
    const url = new URL(rawUrl);
    return replaceUrlPatterns(url.pathname, options.urlReplacementPatterns);
  } catch (_) {
    return replaceUrlPatterns(rawUrl, options.urlReplacementPatterns);
  }
}

/**
 * @param {LHCI.UploadCommand.Options} options
 * @param {Map<string, string>} targetUrlMap
 * @return {Promise<void>}
 */
async function runGithubStatusCheck(options, targetUrlMap) {
  const hash = getCurrentHash();
  const slug = getGitHubRepoSlug();
  const {githubToken, githubAppToken} = options;

  if (!githubToken && !githubAppToken) return print('No GitHub token set, skipping.\n');
  print('GitHub token found, attempting to set status...\n');
  if (!slug) return print(`No GitHub remote found, skipping.\n`);
  if (!slug.includes('/')) return print(`Invalid repo slug "${slug}", skipping.\n`);
  if (!hash) return print(`Invalid hash "${hash}"\n, skipping.`);

  const assertionResults = loadAssertionResults();
  const groupedResults = _.groupBy(assertionResults, result => result.url).sort(
    (a, b) => a[0].url.length - b[0].url.length
  );

  if (groupedResults.length) {
    for (const group of groupedResults) {
      const rawUrl = group[0].url;
      const urlLabel = getUrlLabelForGithub(rawUrl, options);
      const failedResults = group.filter(result => result.level === 'error');
      const warnResults = group.filter(result => result.level === 'warn');
      const state = failedResults.length ? 'failure' : 'success';
      const context = `lhci/url${urlLabel}`;
      const warningsLabel = warnResults.length ? ` with ${warnResults.length} warning(s)` : '';
      const description = failedResults.length
        ? `Failed ${failedResults.length} assertion(s)`
        : `Passed${warningsLabel}`;
      const targetUrl = targetUrlMap.get(rawUrl) || rawUrl;

      await postStatusToGitHub({
        slug,
        hash,
        state,
        context,
        description,
        targetUrl,
        githubToken,
        githubAppToken,
      });
    }
  } else {
    /** @type {Array<LH.Result>} */
    const lhrs = loadSavedLHRs().map(lhr => JSON.parse(lhr));
    /** @type {Array<Array<[LH.Result, LH.Result]>>} */
    const lhrsByUrl = _.groupBy(lhrs, lhr => lhr.finalUrl).map(lhrs => lhrs.map(lhr => [lhr, lhr]));
    const representativeLhrs = computeRepresentativeRuns(lhrsByUrl);

    if (!representativeLhrs.length) return print('No LHRs for status check, skipping.\n');

    for (const lhr of representativeLhrs) {
      const rawUrl = lhr.finalUrl;
      const urlLabel = getUrlLabelForGithub(rawUrl, options);
      const state = 'success';
      const context = `lhci/url${urlLabel}`;
      const categoriesDescription = Object.values(lhr.categories)
        .map(category => `${category.title}: ${Math.round(category.score * 100)}`)
        .join(', ');
      const description = `${categoriesDescription}`;
      const targetUrl = targetUrlMap.get(rawUrl) || rawUrl;

      await postStatusToGitHub({
        slug,
        hash,
        state,
        context,
        description,
        targetUrl,
        githubToken,
        githubAppToken,
      });
    }
  }
}

/**
 * @param {LHCI.UploadCommand.Options} options
 * @return {Promise<void>}
 */
async function runLHCITarget(options) {
  if (!options.token) throw new Error('Must provide token for LHCI target');

  const api = new ApiClient({rootURL: options.serverBaseUrl, extraHeaders: options.extraHeaders});

  const project = await api.findProjectByToken(options.token);
  if (!project) {
    throw new Error('Could not find active project with provided token');
  }

  const hash = getCurrentHash();
  const branch = getCurrentBranch();
  const ancestorHash =
    branch === 'master' ? getAncestorHashForMaster() : getAncestorHashForBranch();

  const build = await api.createBuild({
    projectId: project.id,
    lifecycle: 'unsealed',
    hash,
    branch,
    ancestorHash,
    commitMessage: getCommitMessage(hash),
    author: getAuthor(hash),
    avatarUrl: getAvatarUrl(hash),
    externalBuildUrl: getExternalBuildUrl(),
    runAt: new Date().toISOString(),
    committedAt: getCommitTime(hash),
    ancestorCommittedAt: ancestorHash ? getCommitTime(ancestorHash) : undefined,
  });

  print(`Saving CI project ${project.name} (${project.id})\n`);
  print(`Saving CI build (${build.id})\n`);

  const lhrs = loadSavedLHRs();
  const urlReplacementPatterns = options.urlReplacementPatterns.filter(Boolean);
  const targetUrlMap = new Map();

  const buildViewUrl = new URL(
    `/app/projects/${project.slug}/compare/${build.id}`,
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

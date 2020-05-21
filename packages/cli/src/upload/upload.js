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
const {writeUrlMapToFile} = require('@lhci/utils/src/saved-reports.js');
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
  getAncestorHashForBase,
  getAncestorHashForBranch,
  getGitHubRepoSlug,
} = require('@lhci/utils/src/build-context.js');

/** @param {string} message */
const print = message => {
  process.stdout.write(message);
};

const DEFAULT_GITHUB_API_HOST = 'https://api.github.com';
const DIFF_VIEWER_URL = 'https://googlechrome.github.io/lighthouse-ci/viewer/';
const TEMPORARY_PUBLIC_STORAGE_URL =
  'https://us-central1-lighthouse-infrastructure.cloudfunctions.net/saveHtmlReport';
const GET_URL_MAP_URL =
  'https://us-central1-lighthouse-infrastructure.cloudfunctions.net/getUrlMap';
const SAVE_URL_MAP_URL =
  'https://us-central1-lighthouse-infrastructure.cloudfunctions.net/saveUrlMap';
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
    ignoreDuplicateBuildFailure: {
      type: 'boolean',
      description:
        '[lhci only] Whether to ignore failures (still exit with code 0) caused by uploads of a duplicate build.',
    },
    githubToken: {
      type: 'string',
      description: 'The GitHub token to use to apply a status check.',
    },
    githubApiHost: {
      type: 'string',
      default: DEFAULT_GITHUB_API_HOST,
      description:
        'The GitHub host to use for the status check API request. Modify this when using on a GitHub Enterprise server.',
    },
    githubAppToken: {
      type: 'string',
      description: 'The LHCI GitHub App token to use to apply a status check.',
    },
    githubStatusContextSuffix: {
      type: 'string',
      description: 'The suffix of the GitHub status check context label.',
    },
    extraHeaders: {
      description: '[lhci only] Extra headers to use when making API requests to the LHCI server.',
    },
    'basicAuth.username': {
      type: 'string',
      description:
        '[lhci only] The username to use on a server protected with HTTP Basic Authentication.',
    },
    'basicAuth.password': {
      type: 'string',
      description:
        '[lhci only] The password to use on a server protected with HTTP Basic Authentication.',
    },
    serverBaseUrl: {
      description: '[lhci only] The base URL of the LHCI server where results will be saved.',
      default: 'http://localhost:9001/',
    },
    uploadUrlMap: {
      type: 'boolean',
      description:
        '[temporary-public-storage only] Whether to post links to historical base results to storage or not. Defaults to true only on master branch.',
      default: getCurrentBranch() === 'master',
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
 * @param {{slug: string, hash: string, state: 'failure'|'success', targetUrl: string, description: string, context: string, githubToken?: string, githubAppToken?: string, githubApiHost?: string}} options
 */
async function postStatusToGitHub(options) {
  const {
    slug,
    hash,
    state,
    targetUrl,
    context,
    description,
    githubToken,
    githubAppToken,
    githubApiHost = DEFAULT_GITHUB_API_HOST,
  } = options;

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
    const url = `${githubApiHost}/repos/${slug}/statuses/${hash}`;
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
 *
 * @param {string} rawUrl
 * @param {LHCI.UploadCommand.Options} options
 */
function getUrlForLhciTarget(rawUrl, options) {
  let url = replaceUrlPatterns(rawUrl, options.urlReplacementPatterns);
  if (url.length > 256) {
    process.stderr.write('WARNING: audited URL exceeds character limits, truncation possible.');
    url = url.slice(0, 256);
  }

  return url;
}

/**
 * @param {string} urlLabel
 * @param {LHCI.UploadCommand.Options} options
 */
function getGitHubContext(urlLabel, options) {
  const prefix = options.githubStatusContextSuffix
    ? `lhci${options.githubStatusContextSuffix}`
    : 'lhci';
  return `${prefix}/url${urlLabel}`;
}

/**
 * @param {LHCI.UploadCommand.Options} options
 * @param {Map<string, string>} targetUrlMap
 * @return {Promise<void>}
 */
async function runGithubStatusCheck(options, targetUrlMap) {
  const {githubToken, githubAppToken, githubApiHost} = options;
  const hash = getCurrentHash();
  const slug = getGitHubRepoSlug(githubApiHost);

  if (!githubToken && !githubAppToken) {
    return print('No GitHub token set, skipping GitHub status check.\n');
  }

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
      const context = getGitHubContext(urlLabel, options);
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
        githubApiHost,
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
      const context = getGitHubContext(urlLabel, options);
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
        githubApiHost,
      });
    }
  }
}

/**
 * Fetches the last public URL mapping from master if it exists.
 *
 * @param {LHCI.UploadCommand.Options} options
 * @return {Promise<Map<string, string>>}
 */
async function getPreviousUrlMap(options) {
  const slug = getGitHubRepoSlug();
  if (!slug) return new Map();

  try {
    const fetchUrl = new URL(GET_URL_MAP_URL);
    fetchUrl.searchParams.set('slug', slug);
    const apiResponse = await fetch(fetchUrl.href);
    const {success, url} = await apiResponse.json();
    if (!success) return new Map();
    const mapResponse = await fetch(url);
    if (mapResponse.status !== 200) return new Map();
    const entries = Object.entries(await mapResponse.json());
    return new Map(
      entries.map(([k, v]) => [replaceUrlPatterns(k, options.urlReplacementPatterns), v])
    );
  } catch (err) {
    print(`Error while fetching previous urlMap: ${err.message}`);
    return new Map();
  }
}

/**
 * Saves the provided URL map to temporary public storage.
 *
 * @param {Map<string, string>} urlMap
 * @return {Promise<void>}
 */
async function writeUrlMapToApi(urlMap) {
  const slug = getGitHubRepoSlug();
  if (!slug) return;

  try {
    /** @type {Record<string, string>} */
    const payload = {slug};
    Array.from(urlMap.entries()).forEach(([k, v]) => (payload[k] = v));
    await fetch(SAVE_URL_MAP_URL, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {'content-type': 'application/json'},
    });
  } catch (err) {
    print(`Failed to save urlMap: ${err.message}`);
  }
}

/**
 * @param {string} compareUrl
 * @param {string} urlAudited
 * @param {Map<string, string>} previousUrlMap
 * @return {string}
 */
function buildTemporaryStorageLink(compareUrl, urlAudited, previousUrlMap) {
  const baseUrl = previousUrlMap.get(urlAudited);
  if (!baseUrl) return compareUrl;
  const linkUrl = new URL(DIFF_VIEWER_URL);
  linkUrl.searchParams.set('baseReport', baseUrl);
  linkUrl.searchParams.set('compareReport', compareUrl);
  return linkUrl.href;
}

/**
 * @param {LHCI.UploadCommand.Options} options
 * @return {Promise<void>}
 */
async function runLHCITarget(options) {
  if (!options.token) throw new Error('Must provide token for LHCI target');

  const api = new ApiClient({...options, rootURL: options.serverBaseUrl});

  api.setBuildToken(options.token);
  const project = await api.findProjectByToken(options.token);
  if (!project) {
    throw new Error('Could not find active project with provided token');
  }

  const baseBranch = project.baseBranch || 'master';
  const hash = getCurrentHash();
  const branch = getCurrentBranch();
  const ancestorHash =
    branch === baseBranch ? getAncestorHashForBase() : getAncestorHashForBranch('HEAD', baseBranch);

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
  const targetUrlMap = new Map();

  const buildViewUrl = new URL(
    `/app/projects/${project.slug}/compare/${build.id}`,
    options.serverBaseUrl
  );

  for (const lhr of lhrs) {
    const parsedLHR = JSON.parse(lhr);
    const url = getUrlForLhciTarget(parsedLHR.finalUrl, options);
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

  writeUrlMapToFile(targetUrlMap);
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

  const previousUrlMap = await getPreviousUrlMap(options);

  for (const lhr of representativeLhrs) {
    print(`Uploading median LHR of ${lhr.finalUrl}...`);

    try {
      const response = await fetch(TEMPORARY_PUBLIC_STORAGE_URL, {
        method: 'POST',
        headers: {'content-type': 'text/html'},
        body: getHTMLReportForLHR(lhr),
      });

      const {success, url} = await response.json();
      if (success && url) {
        const urlReplaced = replaceUrlPatterns(lhr.finalUrl, options.urlReplacementPatterns);
        const urlToLinkTo = buildTemporaryStorageLink(url, urlReplaced, previousUrlMap);
        print(`success!\nOpen the report at ${urlToLinkTo}\n`);
        targetUrlMap.set(lhr.finalUrl, urlToLinkTo);
      } else {
        print(`failed!\n`);
      }
    } catch (err) {
      print(`failed!\n`);
      process.stderr.write(err.stack + '\n');
    }
  }

  writeUrlMapToFile(targetUrlMap);
  if (options.uploadUrlMap) await writeUrlMapToApi(targetUrlMap);
  await runGithubStatusCheck(options, targetUrlMap);
}

/**
 * @param {LHCI.UploadCommand.Options} options
 * @return {Promise<void>}
 */
async function runCommand(options) {
  options.urlReplacementPatterns = options.urlReplacementPatterns.filter(Boolean);

  switch (options.target) {
    case 'lhci':
      try {
        return await runLHCITarget(options);
      } catch (err) {
        if (options.ignoreDuplicateBuildFailure && /Build already exists/.test(err.message)) {
          print('Build already exists but ignore requested via options, skipping upload...');
          return;
        }

        throw err;
      }
    case 'temporary-public-storage':
      return runTemporaryPublicStorageTarget(options);
    default:
      throw new Error(`Unrecognized target "${options.target}"`);
  }
}

module.exports = {buildCommand, runCommand};

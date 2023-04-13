/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const URL = require('url').URL;
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
  getGitHubRepoSlug,
  getCurrentBranchSafe,
  getAncestorHash,
} = require('@lhci/utils/src/build-context.js');
const fetch = require('../fetch.js');

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
      choices: ['lhci', 'temporary-public-storage', 'filesystem'],
      description:
        'The type of target to upload the data to. Some options will only apply to particular targets',
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
      default: getCurrentBranchSafe() === 'master',
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
    outputDir: {
      type: 'string',
      description: '[filesystem only] The directory in which to dump Lighthouse results.',
    },
    reportFilenamePattern: {
      type: 'string',
      description: '[filesystem only] The pattern to use for naming Lighthouse reports.',
      default: '%%HOSTNAME%%-%%PATHNAME%%-%%DATETIME%%.report.%%EXTENSION%%',
    },
    githubAppUrl: {
      type: 'string',
      default: GITHUB_APP_STATUS_CHECK_URL,
      description:
        "The URL of the GitHub app where PR status checks are POST'd. Defaults to the publicly hosted app. Most users will not need to change this.",
    },
  });
}

/**
 * @param {{slug: string, hash: string, state: 'failure'|'success', targetUrl: string, description: string, context: string, githubToken?: string, githubAppToken?: string, githubApiHost?: string, githubAppUrl?: string}} options
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
    githubAppUrl = GITHUB_APP_STATUS_CHECK_URL,
  } = options;

  let response;
  if (githubAppToken) {
    const payload = {...options, token: githubAppToken};
    response = await fetch(githubAppUrl, {
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
  const {githubToken, githubAppToken, githubApiHost, githubAppUrl} = options;
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
      const failedResults = group.filter(result => result.level === 'error' && !result.passed);
      const warnResults = group.filter(result => result.level === 'warn' && !result.passed);
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
        githubAppUrl,
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
        githubAppUrl,
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
    if (!apiResponse.ok) return new Map();
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

  if (!slug) {
    print(`No GitHub repository slug found, skipping URL map upload.\n`);
    return;
  }
  print(`Saving URL map for GitHub repository ${slug}...`);

  try {
    /** @type {Record<string, string>} */
    const payload = {slug};
    Array.from(urlMap.entries()).forEach(([k, v]) => (payload[k] = v));

    const response = await fetch(SAVE_URL_MAP_URL, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {'content-type': 'application/json'},
    });

    if (response.ok) {
      print(`success!\n`);
    } else {
      print(`failed!\n`);
    }
  } catch (err) {
    print(`Failed to save URL map: ${err.message}\n`);
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

  const api = new ApiClient({fetch, ...options, rootURL: options.serverBaseUrl});

  api.setBuildToken(options.token);
  const project = await api.findProjectByToken(options.token);
  if (!project) {
    throw new Error('Could not find active project with provided token');
  }

  const baseBranch = project.baseBranch || 'master';
  const hash = getCurrentHash();
  const branch = getCurrentBranch();
  const ancestorHash = getAncestorHash('HEAD', baseBranch);

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
        body: await getHTMLReportForLHR(lhr),
      });

      const {success, url} = await response.json();
      if (success && url) {
        const urlReplaced = replaceUrlPatterns(lhr.finalUrl, options.urlReplacementPatterns);
        const urlToLinkTo = buildTemporaryStorageLink(url, urlReplaced, previousUrlMap);
        print(`success!\nOpen the report at ${urlToLinkTo}\n`);
        targetUrlMap.set(lhr.finalUrl, url);
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
 *
 * @param {string} pattern
 * @param {Record<string, string>} context
 */
function getFileOutputPath(pattern, context) {
  let filename = pattern;
  const matches = pattern.match(/%%([a-z]+)%%/gi) || [];
  for (const match of matches) {
    const name = match.slice(2, -2).toLowerCase();
    const value = context[name] || 'unknown';
    const sanitizedValue = value.replace(/[^a-z0-9]+/gi, '_');
    filename = filename.replace(match, sanitizedValue);
  }

  return filename;
}

/**
 * @param {LHCI.UploadCommand.Options} options
 * @return {Promise<void>}
 */
async function runFilesystemTarget(options) {
  /** @type {Array<LH.Result>} */
  const lhrs = loadSavedLHRs().map(lhr => JSON.parse(lhr));
  /** @type {Array<Array<[LH.Result, LH.Result]>>} */
  const lhrsByUrl = _.groupBy(lhrs, lhr => lhr.requestedUrl).map(lhrs =>
    lhrs.map(lhr => [lhr, lhr])
  );
  const representativeLhrs = computeRepresentativeRuns(lhrsByUrl);

  const targetDir = path.resolve(process.cwd(), options.outputDir || '');
  if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, {recursive: true});

  print(`Dumping ${lhrs.length} reports to disk at ${targetDir}...\n`);
  /** @type {Array<LHCI.UploadCommand.ManifestEntry>} */
  const manifest = [];
  // Process the median LHRs last so duplicate filenames will be overwritten by the median run
  for (const lhr of _.sortBy(lhrs, lhr => (representativeLhrs.includes(lhr) ? 10 : 1))) {
    const url = new URL(lhr.requestedUrl);
    const fetchTimeDate = new Date(new Date(lhr.fetchTime).getTime() || Date.now());
    const context = {
      hostname: url.hostname,
      pathname: url.pathname,
      hash: url.hash,
      date: fetchTimeDate.toISOString().replace(/T.*/, ''),
      datetime: fetchTimeDate
        .toISOString()
        .replace(/\.\d{3}Z/, '')
        .replace('T', ' '),
    };

    const filePattern = options.reportFilenamePattern;
    const htmlPath = getFileOutputPath(filePattern, {...context, extension: 'html'});
    const jsonPath = getFileOutputPath(filePattern, {...context, extension: 'json'});

    /** @type {LHCI.UploadCommand.ManifestEntry} */
    const entry = {
      url: lhr.requestedUrl,
      isRepresentativeRun: representativeLhrs.includes(lhr),
      htmlPath: path.join(targetDir, htmlPath),
      jsonPath: path.join(targetDir, jsonPath),
      summary: Object.keys(lhr.categories).reduce((summary, key) => {
        summary[key] = lhr.categories[key].score;
        return summary;
      }, /** @type {Record<string, number>} */ ({})),
    };

    fs.writeFileSync(entry.htmlPath, await getHTMLReportForLHR(lhr));
    fs.writeFileSync(entry.jsonPath, JSON.stringify(lhr));
    manifest.push(entry);
  }

  const manifestPath = path.join(targetDir, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  print('Done writing reports to disk.\n');
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
    case 'filesystem':
      return runFilesystemTarget(options);
    default:
      throw new Error(`Unrecognized target "${options.target}"`);
  }
}

module.exports = {buildCommand, runCommand};

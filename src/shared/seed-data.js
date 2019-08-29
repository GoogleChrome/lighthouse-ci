/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const _ = require('./lodash.js');

const LOREM_IPSUM =
  // eslint-disable-next-line max-len
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin urna nunc, molestie sed hendrerit et, vulputate vitae mauris. Sed tempor vitae risus vel hendrerit. Nulla vestibulum malesuada erat vitae laoreet. Phasellus sodales vehicula dolor, dictum ullamcorper metus aliquam id. Nullam porttitor posuere purus id rhoncus. Sed et mi ligula. Donec imperdiet nulla sit amet justo cursus, id tempus ex accumsan. Maecenas ultricies elit eget lectus posuere vestibulum. Cras vestibulum neque nec justo congue feugiat non id dui. Pellentesque dapibus ac orci sed malesuada. Sed rhoncus vitae lorem eget facilisis. Donec auctor tortor a tortor egestas, vel condimentum lacus auctor.';

/** @typedef {import('../server/api/client.js')} ApiClient */

/** @type {Array<LHCI.ServerCommand.Project>} */
const PROJECTS = [
  {id: '', name: 'Lighthouse Viewer', externalUrl: 'https://travis-ci.org/GoogleChrome/lighthouse'},
  {
    id: '',
    name: 'Lighthouse Dashboard',
    externalUrl: 'https://travis-ci.org/GoogleChrome/lighthouse-ci',
  },
];

/** @type {Array<LHCI.ServerCommand.Build>} */
const BUILDS = [
  {
    id: '',
    projectId: '0',
    lifecycle: 'unsealed',
    branch: 'master',
    hash: '6e0d172cbf4ce1252fce0b2297c7a1c2b5646ce0',
    externalBuildUrl: 'http://travis-ci.org/org/repo/1020',
    commitMessage: 'feat: initial commit',
    author: 'Patrick Hulce <patrick@example.com>',
    avatarUrl: 'https://avatars1.githubusercontent.com/u/2301202?s=460&v=4',
    ancestorHash: '',
    runAt: '2019-08-05T20:25:28.904Z',
  },
  {
    id: '',
    projectId: '0',
    lifecycle: 'unsealed',
    branch: 'master',
    hash: '30cf658d9d72669af568d37ea60d945bfb3b0fc3',
    externalBuildUrl: 'http://travis-ci.org/org/repo/1021',
    author: 'Paul Irish <paul@example.com>',
    avatarUrl: 'https://avatars1.githubusercontent.com/u/39191?s=460&v=4',
    commitMessage: 'feat: add some more awesome features',
    ancestorHash: '',
    runAt: '2019-08-05T22:45:28.904Z',
  },
  {
    id: '',
    projectId: '0',
    lifecycle: 'unsealed',
    branch: 'master',
    hash: 'ac839abb9aa3c1ea447b8c3c9ba5b0ad9f6824d2',
    externalBuildUrl: 'http://travis-ci.org/org/repo/1022',
    commitMessage: 'feat: add a redesigned dashboard',
    author: 'Patrick Hulce <patrick@example.com>',
    avatarUrl: 'https://avatars1.githubusercontent.com/u/2301202?s=460&v=4',
    ancestorHash: '',
    runAt: '2019-08-06T22:13:28.904Z',
  },
  {
    id: '',
    projectId: '0',
    lifecycle: 'unsealed',
    branch: 'master',
    hash: 'bb9aa3c1ea447b8c3c9ba5b0adac839a9f6824d2',
    externalBuildUrl: 'http://travis-ci.org/org/repo/1023',
    author: 'Paul Irish <paul@example.com>',
    avatarUrl: 'https://avatars1.githubusercontent.com/u/39191?s=460&v=4',
    commitMessage: 'perf: TTI improvements',
    ancestorHash: '',
    runAt: '2019-08-07T20:51:28.904Z',
  },
  {
    id: '',
    projectId: '0',
    lifecycle: 'unsealed',
    branch: 'test_0',
    hash: 'aaa5b0a3c1ea447b8c3c9bac839abb9d9f6824d2',
    externalBuildUrl: 'http://travis-ci.org/org/repo/1024',
    commitMessage: 'feat: test out a risky change',
    author: 'Patrick Hulce <patrick@example.com>',
    avatarUrl: 'https://avatars1.githubusercontent.com/u/2301202?s=460&v=4',
    ancestorHash: 'ac839abb9aa3c1ea447b8c3c9ba5b0ad9f6824d2',
    runAt: '2019-08-09T20:15:28.904Z',
  },
  {
    id: '',
    projectId: '0',
    lifecycle: 'unsealed',
    branch: 'test_1',
    hash: 'c1ea447b8c3c9ba5b0ad9f6824d2ac839abb9aa3',
    externalBuildUrl: 'http://travis-ci.org/org/repo/1025',
    commitMessage: 'feat: test out a different risky change',
    author: 'Patrick Hulce <patrick@example.com>',
    avatarUrl: 'https://avatars1.githubusercontent.com/u/2301202?s=460&v=4',
    ancestorHash: '30cf658d9d72669af568d37ea60d945bfb3b0fc3',
    runAt: '2019-08-09T23:15:28.904Z',
  },
];

/** @typedef {{url?: string, inclusionRate?: number, averageWastedMs?: number, averageTotalBytes?: number, averageWastedBytes?: number}} ItemGenDef */
/** @typedef {{auditId: string, passRate?: number, averageNumericValue?: number, averageWastedMs?: number, items?: ItemGenDef[]}} AuditGenDef */

/** @param {string} auditId */
function getCategoryForAuditId(auditId) {
  if (auditId.startsWith('a11y')) return 'accessibility';
  if (auditId.startsWith('seo')) return 'seo';
  if (auditId.startsWith('best-practices')) return 'best-practices';
  if (auditId.startsWith('pwa')) return 'pwa';
  return 'performance';
}

/** @param {string} auditId */
function getGroupForAuditId(auditId) {
  if (auditId === 'first-contentful-paint') return 'metrics';
  if (auditId === 'first-meaningful-paint') return 'metrics';
  if (auditId === 'speed-index') return 'metrics';
  if (auditId === 'interactive') return 'metrics';
  if (auditId.startsWith('diagnostic-')) return 'diagnostics';
  if (auditId.startsWith('uses-')) return 'load-opportunities';
  if (auditId.startsWith('a11y')) return 'accessibility';
  if (auditId.startsWith('seo')) return 'seo';
  if (auditId.startsWith('best-practices')) return 'best-practices';
  if (auditId.startsWith('pwa')) return 'pwa';
}

/** @param {number} average */
function generateNumericValue(average) {
  const maxDeltaAsPercent = 0.1;
  const maxDelta = average * maxDeltaAsPercent;
  const percentile = Math.random();
  return (percentile - 0.5) * 2 * maxDelta + average;
}

/**
 *
 * @param {string} pageUrl
 * @param {Array<AuditGenDef>} auditDefs
 * @return {LH.Result}
 */
function createLHR(pageUrl, auditDefs) {
  /** @type {LH.Result['audits']} */
  const audits = {};

  const loremIpsumTokens = LOREM_IPSUM.split(' ');
  for (const auditDef of auditDefs) {
    const {auditId, averageNumericValue, averageWastedMs} = auditDef;
    if (typeof averageNumericValue === 'number') {
      const numericValue = generateNumericValue(averageNumericValue);
      // score of 100 = <1000
      // score of 0 = >10000
      const score = 1 - Math.min(1, Math.max((numericValue - 1000) / 9000, 0));
      audits[auditId] = {score, numericValue, scoreDisplayMode: 'numeric'};
    } else if (typeof averageWastedMs === 'number') {
      const wastedMs = generateNumericValue(averageWastedMs);
      // score of 100 = <100
      // score of 0 = >1000
      const score = 1 - Math.min(1, Math.max((wastedMs - 100) / 900, 0));
      audits[auditId] = {
        score,
        scoreDisplayMode: 'numeric',
        details: {type: 'opportunity', overallSavingsMs: wastedMs, items: []},
      };
    } else {
      const {passRate = 1} = auditDef;
      audits[auditId] = {score: Math.random() <= passRate ? 1 : 0, scoreDisplayMode: 'binary'};
    }

    /** @type {Record<string, any>} */
    const headersAsObject = {};
    if (auditDef.items) {
      const items = [];
      for (const {url, inclusionRate = 1, ...rest} of auditDef.items) {
        if (Math.random() > inclusionRate) continue;
        /** @type {any} */
        const item = {};
        if (url) {
          if (url.includes('lorempixel')) {
            headersAsObject.thumbnail = {key: 'url', valueType: 'thumbnail'};
          }

          headersAsObject.url = {key: 'url', valueType: 'url', label: 'URL'};
          item.url = new URL(url, pageUrl);
        }

        for (const key of Object.keys(rest)) {
          const dataKey = key.replace('average', '').replace(/^\w/, v => v.toLowerCase());
          const valueType = key.endsWith('Ms') ? 'timespanMs' : 'bytes';
          headersAsObject[dataKey] = {key: dataKey, valueType, label: _.startCase(dataKey)};
          // @ts-ignore - tsc can't understand Object.keys
          item[dataKey] = generateNumericValue(rest[key]);
        }

        items.push(item);
      }

      const opportunityDetails = audits[auditId].details;
      const opportunityMs = opportunityDetails && opportunityDetails.overallSavingsMs;
      audits[auditId].details = {
        type: opportunityMs ? 'opportunity' : 'table',
        overallSavingsMs: opportunityMs,
        headings: Object.values(headersAsObject).map(header => {
          // Do the inverse of _getCanonicalizedTableHeadings
          if (opportunityMs) return header;
          return {...header, itemType: header.valueType, text: header.label};
        }),
        items,
      };
    }

    audits[auditId].title = _.startCase(auditId);
    audits[auditId].description = `Help text for ${_.startCase(auditId)}. ${loremIpsumTokens
      .slice(0, Math.round(auditId.length * 1.5))
      .join(' ')}.`;
  }

  /** @type {LH.Result['categories']} */
  const categories = {};

  const auditsGroupedByCategory = _.groupBy(Object.entries(audits), pair =>
    getCategoryForAuditId(pair[0])
  );
  for (const audits of auditsGroupedByCategory) {
    const category = getCategoryForAuditId(audits[0][0]);
    const sum = audits.reduce((sum, next) => sum + (next[1].score || 0), 0);
    categories[category] = {
      id: category,
      title: category.toUpperCase(),
      score: sum / audits.length,
      auditRefs: audits.map(([id]) => ({id, weight: 0, group: getGroupForAuditId(id)})),
    };
  }

  return {
    requestedUrl: pageUrl,
    finalUrl: pageUrl,
    categories,
    audits,

    fetchTime: new Date().toISOString(),
    lighthouseVersion: '5.2.0',
    configSettings: {channel: 'cli'},
    categoryGroups: {
      metrics: {title: 'Metrics'},
      'load-opportunities': {title: 'Opportunities'},
      diagnostics: {title: 'Diagnostics'},
      accessibility: {title: 'Accessibility'},
      seo: {title: 'SEO'},
      'best-practices': {title: 'Best Practices'},
      pwa: {title: 'PWA'},
    },
    runWarnings: [],
    userAgent: 'Chrome!',
    environment: {hostUserAgent: '', networkUserAgent: '', benchmarkIndex: 500},
    timing: {total: 1, entries: []},
    i18n: {rendererFormattedStrings: {}, icuMessagePaths: {}},
  };
}

/**
 * @param {Pick<LHCI.ServerCommand.Run, 'projectId'|'buildId'|'url'>} run
 * @param {Record<string, StrictOmit<AuditGenDef, 'auditId'>>} audits
 * @param {number} [numberOfRuns]
 * @return {Array<LHCI.ServerCommand.Run>}
 */
function createRuns(run, audits, numberOfRuns = 5) {
  const auditDefs = Object.keys(audits).map(auditId => ({auditId, ...audits[auditId]}));

  /** @type {Array<LHCI.ServerCommand.Run>} */
  const runs = [];

  for (let i = 0; i < numberOfRuns; i++) {
    runs.push({
      ...run,
      representative: false,
      id: '',
      lhr: JSON.stringify(createLHR(run.url, auditDefs)),
    });
  }

  return runs;
}

const fiftyFiftyImages = [
  {
    inclusionRate: 0.5,
    url: 'http://lorempixel.com/200/200/sports/2',
    averageTotalBytes: 100 * 1024,
    averageWastedBytes: 50 * 1024,
  },
  {
    inclusionRate: 0.5,
    url: 'http://lorempixel.com/200/200/sports/3',
    averageTotalBytes: 80 * 1024,
    averageWastedBytes: 20 * 1024,
  },
  {
    inclusionRate: 0.5,
    url: 'http://lorempixel.com/200/200/sports/4',
    averageTotalBytes: 200 * 1024,
    averageWastedBytes: 10 * 1024,
  },
  {
    inclusionRate: 0.5,
    url: 'http://lorempixel.com/200/200/sports/5',
    averageTotalBytes: 150 * 1024,
    averageWastedBytes: 20 * 1024,
  },
  {
    inclusionRate: 0.5,
    url: 'http://lorempixel.com/200/200/sports/6',
    averageTotalBytes: 75 * 1024,
    averageWastedBytes: 10 * 1024,
  },
  {
    inclusionRate: 0.5,
    url: 'http://lorempixel.com/200/200/sports/7',
    averageTotalBytes: 500 * 1024,
    averageWastedBytes: 200 * 1024,
  },
  {
    inclusionRate: 0.5,
    url: 'http://lorempixel.com/200/200/sports/8',
    averageTotalBytes: 25 * 1024,
    averageWastedBytes: 5 * 1024,
  },
];

const permanentScripts = [
  {
    url: '/js/app.js',
    averageWastedMs: 3000,
    averageTotalBytes: 1000 * 1024,
  },
  {
    url: '/js/vendor.js',
    averageWastedMs: 500,
    averageTotalBytes: 5000 * 1024,
  },
  {
    url: 'https://www.google-analytics.com/ga.js',
    averageWastedMs: 200,
    averageTotalBytes: 50 * 1024,
  },
];

const auditsToFake = {
  'first-contentful-paint': {averageNumericValue: 1000},
  'first-meaningful-paint': {averageNumericValue: 1000},
  'first-cpu-idle': {averageNumericValue: 3000},
  'speed-index': {averageNumericValue: 3000},
  interactive: {averageNumericValue: 5000},
  'max-potential-fid': {averageNumericValue: 250},

  'uses-responsive-images': {averageWastedMs: 400, items: fiftyFiftyImages},
  'uses-minified-files': {averageWastedMs: 800, items: fiftyFiftyImages},
  'uses-optimized-images': {averageWastedMs: 1400, items: fiftyFiftyImages},
  'diagnostic-bootup-time': {passRate: 0.5, items: permanentScripts},
  'diagnostic-main-thread-time': {averageNumericValue: 5000, items: permanentScripts},
  'diagnostic-cache-headers': {passRate: 0.5, items: permanentScripts},

  'a11y-color-contrast': {passRate: 0.5},
  'a11y-labels': {passRate: 0.5},
  'a11y-duplicate-id': {passRate: 0.5},
  'a11y-alt-text': {passRate: 0.5},

  'pwa-https': {passRate: 0.8},
  'pwa-manifest': {passRate: 0.4},
  'pwa-service-worker': {passRate: 0.2},
  'pwa-start-url': {passRate: 0.2},
  'pwa-offline': {passRate: 0.2},

  'best-practices-console-errors': {passRate: 0.2},
  'best-practices-rel-noopener': {passRate: 0.8},
  'best-practices-password-paste': {passRate: 0.9},

  'seo-font-size': {passRate: 0.5},
  'seo-indexable': {passRate: 0.9},
  'seo-title': {passRate: 0.9},
};

/** @type {Array<LHCI.ServerCommand.Run>} */
const RUNS = [
  ...createRuns(
    {projectId: '0', buildId: '0', url: 'http://localhost:1234/viewer/#home'},
    auditsToFake
  ),
  ...createRuns(
    {projectId: '0', buildId: '1', url: 'http://localhost:1234/viewer/#home'},
    auditsToFake
  ),
  ...createRuns(
    {projectId: '0', buildId: '2', url: 'http://localhost:1234/viewer/#home'},
    auditsToFake
  ),
  ...createRuns(
    {projectId: '0', buildId: '0', url: 'http://localhost:1234/viewer/#checkout'},
    auditsToFake
  ),
  ...createRuns(
    {projectId: '0', buildId: '1', url: 'http://localhost:1234/viewer/#checkout'},
    auditsToFake
  ),
  ...createRuns(
    {projectId: '0', buildId: '2', url: 'http://localhost:1234/viewer/#checkout'},
    auditsToFake
  ),
  ...createRuns(
    {projectId: '0', buildId: '3', url: 'http://localhost:1234/viewer/#home'},
    {...auditsToFake, interactive: {averageNumericValue: 4000}}
  ),
  ...createRuns(
    // this build is a branch that regresses metrics
    {projectId: '0', buildId: '4', url: 'http://localhost:1234/viewer/#home'},
    {
      ...auditsToFake,
      interactive: {averageNumericValue: 7000},
      'diagnostic-main-thread-time': {
        averageNumericValue: 6000,
        items: permanentScripts.map(item =>
          item.url.includes('app') ? {...item, averageWastedMs: item.averageWastedMs + 1000} : item
        ),
      },
    }
  ),
  ...createRuns(
    // this build is a branch that improves metrics
    {projectId: '0', buildId: '5', url: 'http://localhost:1234/viewer/#home'},
    {
      ...auditsToFake,
      interactive: {averageNumericValue: 3000},
      'diagnostic-main-thread-time': {
        averageNumericValue: 2000,
        items: permanentScripts.map(item =>
          item.url.includes('app') ? {...item, averageWastedMs: item.averageWastedMs - 1000} : item
        ),
      },
    }
  ),
];

/**
 * @param {ApiClient} client
 * @param {{projects: LHCI.ServerCommand.Project[], builds: LHCI.ServerCommand.Build[], runs: LHCI.ServerCommand.Run[]}} [data]
 */
async function writeSeedDataToApi(client, data) {
  data = data || {projects: PROJECTS, builds: BUILDS, runs: RUNS};
  data = JSON.parse(JSON.stringify(data));
  if (!data) throw new Error('TS cannot infer truth');

  /** @type {Array<LHCI.ServerCommand.Project>} */
  const projects = [];
  for (const project of data.projects) {
    delete project.id;
    projects.push(await client.createProject(project));
  }

  /** @type {Array<LHCI.ServerCommand.Build>} */
  const builds = [];
  for (const build of data.builds) {
    delete build.id;
    build.projectId = projects[Number(build.projectId)].id;
    builds.push(await client.createBuild(build));
  }

  for (const run of data.runs) {
    delete run.id;
    run.projectId = projects[Number(run.projectId)].id;
    run.buildId = builds[Number(run.buildId)].id;
    await client.createRun(run);
  }

  for (const build of builds) {
    await client.sealBuild(build.projectId, build.id);
  }
}

module.exports = {PROJECTS, BUILDS, RUNS, writeSeedDataToApi};

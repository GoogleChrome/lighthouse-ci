/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const _ = require('./lodash.js');

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
    branch: 'master',
    hash: '6e0d172cbf4ce1252fce0b2297c7a1c2b5646ce0',
    externalBuildUrl: 'http://travis-ci.org/org/repo/1020',
  },
  {
    id: '',
    projectId: '0',
    branch: 'master',
    hash: '30cf658d9d72669af568d37ea60d945bfb3b0fc3',
    externalBuildUrl: 'http://travis-ci.org/org/repo/1021',
  },
  {
    id: '',
    projectId: '0',
    branch: 'master',
    hash: 'ac839abb9aa3c1ea447b8c3c9ba5b0ad9f6824d2',
    externalBuildUrl: 'http://travis-ci.org/org/repo/1022',
  },
  {
    id: '',
    projectId: '0',
    branch: 'master',
    hash: 'bb9aa3c1ea447b8c3c9ba5b0adac839a9f6824d2',
    externalBuildUrl: 'http://travis-ci.org/org/repo/1023',
  },
  {
    id: '',
    projectId: '0',
    branch: 'test_0',
    hash: 'aaa5b0a3c1ea447b8c3c9bac839abb9d9f6824d2',
    externalBuildUrl: 'http://travis-ci.org/org/repo/1024',
  },
  {
    id: '',
    projectId: '0',
    branch: 'test_1',
    hash: 'c1ea447b8c3c9ba5b0ad9f6824d2ac839abb9aa3',
    externalBuildUrl: 'http://travis-ci.org/org/repo/1025',
  },
];

/** @typedef {{auditId: string, passRate?: number, averageNumericValue?: number, averageWastedMs?: number}} AuditGenDef */

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
  if (auditId === 'uses-responsive-images') return 'load-opportunities';
  if (auditId === 'bootup-time') return 'diagnostics';
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
 * @param {string} url
 * @param {Array<AuditGenDef>} auditDefs
 * @return {LH.Result}
 */
function createLHR(url, auditDefs) {
  /** @type {LH.Result['audits']} */
  const audits = {};

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

    audits[auditId].title = auditId.toUpperCase();
    audits[auditId].description = 'Help text for ' + auditId.toUpperCase();
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
    requestedUrl: url,
    finalUrl: url,
    categories,
    audits,

    fetchTime: new Date().toISOString(),
    lighthouseVersion: '5.2.0',
    configSettings: {channel: 'cli'},
    categoryGroups: {
      metrics: {title: 'Metrics'},
      'load-opportunities': {title: 'Opportunities'},
      diagnostics: {title: 'Diagnostics'},
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
    runs.push({...run, id: '', lhr: JSON.stringify(createLHR(run.url, auditDefs))});
  }

  return runs;
}

const auditsToFake = {
  'first-contentful-paint': {averageNumericValue: 1000},
  'first-meaningful-paint': {averageNumericValue: 1000},
  'first-cpu-idle': {averageNumericValue: 3000},
  'speed-index': {averageNumericValue: 3000},
  interactive: {averageNumericValue: 5000},
  'max-potential-fid': {averageNumericValue: 250},

  'uses-responsive-images': {averageWastedMs: 400},
  'bootup-time': {passRate: 0.5},

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
    {projectId: '0', buildId: '4', url: 'http://localhost:1234/viewer/#home'},
    {...auditsToFake, interactive: {averageNumericValue: 7000}}
  ),
  ...createRuns(
    {projectId: '0', buildId: '5', url: 'http://localhost:1234/viewer/#home'},
    {...auditsToFake, interactive: {averageNumericValue: 6000}}
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

  const projects = await Promise.all(
    data.projects.map(project => {
      delete project.id;
      return client.createProject(project);
    })
  );

  const builds = await Promise.all(
    data.builds.map(build => {
      delete build.id;
      build.projectId = projects[Number(build.projectId)].id;
      return client.createBuild(build);
    })
  );

  await Promise.all(
    data.runs.map(run => {
      delete run.id;
      run.projectId = projects[Number(run.projectId)].id;
      run.buildId = builds[Number(run.buildId)].id;
      return client.createRun(run);
    })
  );
}

module.exports = {PROJECTS, BUILDS, RUNS, writeSeedDataToApi};

/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

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
    hash: '6e0d172cbf4ce1252fce0b2297c7a1c2b5646ce0',
    externalBuildId: '1020',
  },
  {
    id: '',
    projectId: '0',
    hash: '30cf658d9d72669af568d37ea60d945bfb3b0fc3',
    externalBuildId: '1021',
  },
  {
    id: '',
    projectId: '0',
    hash: 'ac839abb9aa3c1ea447b8c3c9ba5b0ad9f6824d2',
    externalBuildId: '1022',
  },
  {
    id: '',
    projectId: '0',
    hash: 'bb9aa3c1ea447b8c3c9ba5b0adac839a9f6824d2',
    externalBuildId: '1023',
  },
  {
    id: '',
    projectId: '0',
    hash: 'aaa5b0a3c1ea447b8c3c9bac839abb9d9f6824d2',
    externalBuildId: '1024',
  },
  {
    id: '',
    projectId: '0',
    hash: 'c1ea447b8c3c9ba5b0ad9f6824d2ac839abb9aa3',
    externalBuildId: '1025',
  },
];

/** @typedef {{auditId: string, passRate?: number, averageNumericValue?: number}} AuditGenDef */

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
    const {auditId, averageNumericValue} = auditDef;
    if (typeof averageNumericValue === 'number') {
      const maxDeltaAsPercent = 0.1;
      const maxDelta = averageNumericValue * maxDeltaAsPercent;
      const percentile = Math.random();
      const numericValue = (percentile - 0.5) * 2 * maxDelta + averageNumericValue;
      // score of 100 = <1000
      // score of 0 = >10000
      const score = 1 - Math.min(1, Math.max((numericValue - 1000) / 9000, 0));
      audits[auditId] = {score, numericValue};
    } else {
      const {passRate = 1} = auditDef;
      audits[auditId] = {score: Math.random() <= passRate ? 1 : 0};
    }
  }

  return {
    finalUrl: url,
    audits,
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
 */
async function writeSeedData(client) {
  const projects = await Promise.all(
    PROJECTS.map(project => {
      delete project.id;
      return client.createProject(project);
    })
  );

  const builds = await Promise.all(
    BUILDS.map(build => {
      delete build.id;
      build.projectId = projects[Number(build.projectId)].id;
      return client.createBuild(build);
    })
  );

  await Promise.all(
    RUNS.map(run => {
      delete run.id;
      run.projectId = projects[Number(run.projectId)].id;
      run.buildId = builds[Number(run.buildId)].id;
      return client.createRun(run);
    })
  );
}

module.exports = {PROJECTS, BUILDS, RUNS, writeSeedData};

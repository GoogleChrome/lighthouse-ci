/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const _ = require('@lhci/utils/src/lodash.js');
const PRandom = require('@lhci/utils/src/seed-data/prandom.js');
const {computeRepresentativeRuns} = require('@lhci/utils/src/representative-runs.js');
const {
  definitions: statisticDefinitions,
  VERSION: STATISTIC_VERSION,
} = require('../statistic-definitions.js');
const {E404} = require('../express-utils.js');

class StorageMethod {
  /**
   * @param {LHCI.ServerCommand.StorageOptions} options
   * @return {Promise<void>}
   */
  // eslint-disable-next-line no-unused-vars
  async initialize(options) {
    throw new Error('Unimplemented');
  }

  /** @return {Promise<void>} */
  async close() {
    throw new Error('Unimplemented');
  }

  /**
   * @return {Promise<Array<LHCI.ServerCommand.Project>>}
   */
  async getProjects() {
    throw new Error('Unimplemented');
  }

  /**
   * @param {string} projectId
   * @return {Promise<void>}
   */
  // eslint-disable-next-line no-unused-vars
  async deleteProject(projectId) {
    throw new Error('Unimplemented');
  }

  /**
   * @param {string} token
   * @return {Promise<LHCI.ServerCommand.Project | undefined>}
   */
  // eslint-disable-next-line no-unused-vars
  async findProjectByToken(token) {
    throw new Error('Unimplemented');
  }

  /**
   * @param {string} projectId
   * @return {Promise<LHCI.ServerCommand.Project | undefined>}
   */
  // eslint-disable-next-line no-unused-vars
  async findProjectById(projectId) {
    throw new Error('Unimplemented');
  }

  /**
   * @param {string} slug
   * @return {Promise<LHCI.ServerCommand.Project | undefined>}
   */
  // eslint-disable-next-line no-unused-vars
  async findProjectBySlug(slug) {
    throw new Error('Unimplemented');
  }

  /**
   * @param {StrictOmit<LHCI.ServerCommand.Project, 'id'|'token'|'adminToken'>} project
   * @return {Promise<LHCI.ServerCommand.Project>}
   */
  // eslint-disable-next-line no-unused-vars
  async createProject(project) {
    throw new Error('Unimplemented');
  }

  /**
   * @param {Pick<LHCI.ServerCommand.Project, 'id'|'baseBranch'|'externalUrl'|'name'>} project
   * @return {Promise<void>}
   */
  // eslint-disable-next-line no-unused-vars
  async updateProject(project) {
    throw new Error('Unimplemented');
  }

  /**
   * @param {string} projectId
   * @param {LHCI.ServerCommand.GetBuildsOptions} [options]
   * @return {Promise<LHCI.ServerCommand.Build[]>}
   */
  // eslint-disable-next-line no-unused-vars
  async getBuilds(projectId, options = {}) {
    throw new Error('Unimplemented');
  }

  /**
   * @param {string} projectId
   * @return {Promise<Array<{branch: string}>>}
   */
  // eslint-disable-next-line no-unused-vars
  async getBranches(projectId) {
    throw new Error('Unimplemented');
  }

  /**
   * @param {string} projectId
   * @param {string} buildId
   * @return {Promise<LHCI.ServerCommand.Build | undefined>}
   */
  // eslint-disable-next-line no-unused-vars
  async findBuildById(projectId, buildId) {
    throw new Error('Unimplemented');
  }

  /**
   * @param {string} projectId
   * @param {string} buildId
   * @return {Promise<LHCI.ServerCommand.Build | undefined>}
   */
  // eslint-disable-next-line no-unused-vars
  async findAncestorBuildById(projectId, buildId) {
    throw new Error('Unimplemented');
  }

  /**
   * @param {StrictOmit<LHCI.ServerCommand.Build, 'id'>} unsavedBuild
   * @return {Promise<LHCI.ServerCommand.Build>}
   */
  // eslint-disable-next-line no-unused-vars
  async createBuild(unsavedBuild) {
    throw new Error('Unimplemented');
  }

  /**
   * @param {string} projectId
   * @param {string} buildId
   * @return {Promise<void>}
   */
  // eslint-disable-next-line no-unused-vars
  async sealBuild(projectId, buildId) {
    throw new Error('Unimplemented');
  }

  /**
   * @param {string} projectId
   * @param {string} buildId
   * @return {Promise<void>}
   */
  // eslint-disable-next-line no-unused-vars
  async deleteBuild(projectId, buildId) {
    throw new Error('Unimplemented');
  }

  /**
   * @param {string} projectId
   * @param {string} buildId
   * @param {LHCI.ServerCommand.GetRunsOptions} [options]
   * @return {Promise<LHCI.ServerCommand.Run[]>}
   */
  // eslint-disable-next-line no-unused-vars
  async getRuns(projectId, buildId, options) {
    throw new Error('Unimplemented');
  }

  /**
   * @param {string} projectId
   * @param {string} [buildId]
   * @return {Promise<Array<{url: string}>>}
   */
  // eslint-disable-next-line no-unused-vars
  async getUrls(projectId, buildId) {
    throw new Error('Unimplemented');
  }

  /**
   * @param {StrictOmit<LHCI.ServerCommand.Run, 'id'>} unsavedRun
   * @return {Promise<LHCI.ServerCommand.Run>}
   */
  // eslint-disable-next-line no-unused-vars
  async createRun(unsavedRun) {
    throw new Error('Unimplemented');
  }

  /**
   * @param {string} projectId
   * @param {string} buildId
   * @return {Promise<Array<LHCI.ServerCommand.Statistic>>}
   */
  // eslint-disable-next-line no-unused-vars
  async getStatistics(projectId, buildId) {
    throw new Error('Unimplemented');
  }

  /**
   * @param {string} projectId
   * @return {Promise<string>}
   */
  // eslint-disable-next-line no-unused-vars
  async _resetAdminToken(projectId) {
    throw new Error('Unimplemented');
  }

  /**
   * @param {string} projectId
   * @return {Promise<string>}
   */
  // eslint-disable-next-line no-unused-vars
  async _resetProjectToken(projectId) {
    throw new Error('Unimplemented');
  }

  /**
   * @param {StrictOmit<LHCI.ServerCommand.Project, 'id'|'token'|'adminToken'>} project
   * @return {Promise<LHCI.ServerCommand.Project>}
   */
  // eslint-disable-next-line no-unused-vars
  async _createProject(project) {
    throw new Error('Unimplemented');
  }

  /**
   * @param {StrictOmit<LHCI.ServerCommand.Statistic, 'id'>} unsavedStatistic
   * @param {*} [extras]
   * @return {Promise<LHCI.ServerCommand.Statistic>}
   */
  // eslint-disable-next-line no-unused-vars
  async _createOrUpdateStatistic(unsavedStatistic, extras) {
    throw new Error('Unimplemented');
  }

  /**
   * @param {string} projectId
   * @param {string} buildId
   * @return {Promise<Array<LHCI.ServerCommand.Statistic>>}
   */
  // eslint-disable-next-line no-unused-vars
  async _getStatistics(projectId, buildId) {
    throw new Error('Unimplemented');
  }

  /**
   * @param {string} projectId
   * @param {string} buildId
   * @return {Promise<void>}
   */
  // eslint-disable-next-line no-unused-vars
  async _invalidateStatistics(projectId, buildId) {
    throw new Error('Unimplemented');
  }

  /**
   * @param {StorageMethod} storageMethod
   * @param {string} projectId
   * @param {string} buildId
   * @return {Promise<Array<LHCI.ServerCommand.Statistic>>}
   */
  static async getOrCreateStatistics(storageMethod, projectId, buildId) {
    const build = await storageMethod.findBuildById(projectId, buildId);
    if (!build) throw new E404('No build with that ID');
    // If the build hasn't been sealed yet then we can't compute statistics for it yet.
    if (build.lifecycle !== 'sealed') return [];

    const urls = await storageMethod.getUrls(projectId, buildId);
    const statisicDefinitionEntries = Object.entries(statisticDefinitions);
    const existingStatistics = await storageMethod._getStatistics(projectId, buildId);
    if (
      existingStatistics.length === urls.length * statisicDefinitionEntries.length &&
      existingStatistics.every(stat => stat.version === STATISTIC_VERSION)
    ) {
      return existingStatistics;
    }

    const {statistics} = await this.createStatistics(storageMethod, build, {existingStatistics});
    return statistics;
  }

  /**
   * @template TTransactionHandle
   * @param {StorageMethod} storageMethod
   * @param {LHCI.ServerCommand.Build} build
   * @param {{transaction?: TTransactionHandle, existingStatistics?: Array<LHCI.ServerCommand.Statistic>}} context
   * @return {Promise<{statistics: Array<LHCI.ServerCommand.Statistic>, representativeRuns: Array<LHCI.ServerCommand.Run>}>}
   */
  static async createStatistics(storageMethod, build, context) {
    const {id: buildId, projectId, lifecycle} = build;
    if (lifecycle !== 'sealed') throw new Error('Cannot create statistics for unsealed build');

    const runs = await storageMethod.getRuns(projectId, buildId);
    /** @type {Array<Array<[LHCI.ServerCommand.Run, LH.Result]>>} */
    const runsByUrl = _.groupBy(runs.map(run => [run, JSON.parse(run.lhr)]), ([run, _]) => run.url);

    const statisicDefinitionEntries = Object.entries(statisticDefinitions);
    const existingStatistics = context.existingStatistics || [];

    const statistics = await Promise.all(
      statisicDefinitionEntries.map(([key, fn]) => {
        const name = /** @type {LHCI.ServerCommand.StatisticName} */ (key);
        return Promise.all(
          runsByUrl.map(runs => {
            const url = runs[0][0].url;
            const {value} = fn(runs.map(([_, lhr]) => lhr));
            const existing = existingStatistics.find(
              s => s.name === name && s.value === value && s.url === url
            );
            if (existing && existing.version === STATISTIC_VERSION) return existing;

            return storageMethod._createOrUpdateStatistic(
              {
                projectId,
                buildId,
                url,
                version: STATISTIC_VERSION,
                name,
                value,
              },
              context
            );
          })
        );
      })
    );

    return {
      statistics: statistics.reduce((a, b) => a.concat(b)),
      representativeRuns: computeRepresentativeRuns(runsByUrl),
    };
  }

  /**
   * @param {string} base
   * @param {{randomLength?: number, maxLength?: number, prandom?: import('@lhci/utils/src/seed-data/prandom')}} [options]
   */
  static generateSlug(base, options = {}) {
    const {maxLength = 40, randomLength = 0, prandom} = options;
    if (maxLength <= randomLength + 1) throw new Error('Random length is too long');

    let slug = base
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9.]+/g, '-');
    const baseLength = randomLength ? maxLength - randomLength - 1 : maxLength;
    slug = slug.slice(0, baseLength);

    if (randomLength) slug += '-';
    for (let i = 0; i < randomLength; i++) {
      slug += PRandom.toAlphanumeric(prandom ? prandom.next() : Math.random());
    }

    return slug;
  }

  /**
   * @param {StorageMethod} storageMethod
   * @param {StrictOmit<LHCI.ServerCommand.Project, 'id'|'token'|'adminToken'>} unsavedProject
   */
  static async createProjectWithUniqueSlug(storageMethod, unsavedProject) {
    const maxLength = 40;
    let randomLength = 0;
    let slug = StorageMethod.generateSlug(unsavedProject.name, {maxLength, randomLength});
    let existingProject = await storageMethod.findProjectBySlug(slug);
    while (existingProject && randomLength < maxLength - 10) {
      randomLength++;
      slug = StorageMethod.generateSlug(unsavedProject.name, {maxLength, randomLength});
      existingProject = await storageMethod.findProjectBySlug(slug);
    }

    if (existingProject) throw new Error('Unable to generate unique slug');
    return storageMethod._createProject({...unsavedProject, slug});
  }

  /**
   * @param {LHCI.ServerCommand.StorageOptions} options
   * @return {StorageMethod}
   */
  static from(options) {
    const SqlStorageMethod = require('./sql/sql.js');

    switch (options.storageMethod) {
      case 'sql':
        return new SqlStorageMethod();
      default:
        throw new Error(`Storage method "${options.storageMethod}" not yet supported`);
    }
  }
}

module.exports = StorageMethod;

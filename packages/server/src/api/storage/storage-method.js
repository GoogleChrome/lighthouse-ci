/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const _ = require('@lhci/utils/src/lodash.js');
const {computeRepresentativeRuns} = require('@lhci/utils/src/representative-runs.js');
const statisticDefinitions = require('../statistic-definitions.js');

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
   * @param {StrictOmit<LHCI.ServerCommand.Project, 'id'|'token'>} project
   * @return {Promise<LHCI.ServerCommand.Project>}
   */
  // eslint-disable-next-line no-unused-vars
  async createProject(project) {
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
   * @protected
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
   * @param {StorageMethod} storageMethod
   * @param {string} projectId
   * @param {string} buildId
   * @return {Promise<Array<LHCI.ServerCommand.Statistic>>}
   */
  static async getOrCreateStatistics(storageMethod, projectId, buildId) {
    const build = await storageMethod.findBuildById(projectId, buildId);
    if (!build) throw new Error('Cannot create statistics for non-existent build');
    // If the build hasn't been sealed yet then we can't compute statistics for it yet.
    if (build.lifecycle !== 'sealed') return [];

    const urls = await storageMethod.getUrls(projectId, buildId);
    const statisicDefinitionEntries = Object.entries(statisticDefinitions);
    const existingStatistics = await storageMethod._getStatistics(projectId, buildId);
    if (existingStatistics.length === urls.length * statisicDefinitionEntries.length) {
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
    const runsByUrl = _.groupBy(
      runs.map(run => [run, JSON.parse(run.lhr)]),
      ([_, lhr]) => lhr.finalUrl
    );

    const statisicDefinitionEntries = Object.entries(statisticDefinitions);
    const existingStatistics = context.existingStatistics || [];

    const statistics = await Promise.all(
      statisicDefinitionEntries.map(([key, fn]) => {
        const name = /** @type {LHCI.ServerCommand.StatisticName} */ (key);
        return Promise.all(
          runsByUrl.map(runs => {
            const url = runs[0][1].finalUrl;
            const {value} = fn(runs.map(([_, lhr]) => lhr));
            const existing = existingStatistics.find(
              s => s.name === name && s.value === value && s.url === url
            );
            if (existing) return existing;

            return storageMethod._createOrUpdateStatistic(
              {
                projectId,
                buildId,
                url,
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

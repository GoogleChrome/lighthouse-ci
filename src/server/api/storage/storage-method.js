/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const _ = require('../../../shared/lodash.js');
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

  /**
   * @return {Promise<Array<LHCI.ServerCommand.Project>>}
   */
  async getProjects() {
    throw new Error('Unimplemented');
  }

  /**
   * @param {LHCI.ServerCommand.Project} project
   * @return {Promise<string>}
   */
  // eslint-disable-next-line no-unused-vars
  async getProjectToken(project) {
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
   * @param {StrictOmit<LHCI.ServerCommand.Project, 'id'>} project
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
   * @param {string} buildId
   * @return {Promise<LHCI.ServerCommand.Build | undefined>}
   */
  // eslint-disable-next-line no-unused-vars
  async findBuildById(projectId, buildId) {
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
   * @return {Promise<LHCI.ServerCommand.Run[]>}
   */
  // eslint-disable-next-line no-unused-vars
  async getRuns(projectId, buildId) {
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
   * @return {Promise<LHCI.ServerCommand.Statistic>}
   */
  // eslint-disable-next-line no-unused-vars
  async _createStatistic(unsavedStatistic) {
    throw new Error('Unimplemented');
  }

  /**
   * @param {StorageMethod} storageMethod
   * @param {string} projectId
   * @param {string} buildId
   * @return {Promise<Array<LHCI.ServerCommand.Statistic>>}
   */
  static async getStatistics(storageMethod, projectId, buildId) {
    const build = await storageMethod.findBuildById(projectId, buildId);
    if (!build) throw new Error('Cannot create statistics for non-existent build');

    const runs = await storageMethod.getRuns(build.projectId, build.id);
    /** @type {Array<Array<LH.Result>>} */
    const lhrsByUrl = _.groupBy(runs.map(run => JSON.parse(run.lhr)), lhr => lhr.finalUrl);

    const statistics = await Promise.all(
      Object.entries(statisticDefinitions).map(([key, fn]) => {
        const name = /** @type {LHCI.ServerCommand.StatisticName} */ (key);
        return Promise.all(
          lhrsByUrl.map(lhrs => {
            const url = lhrs[0].finalUrl;
            const {value} = fn(lhrs);
            return storageMethod._createStatistic({
              projectId: build.projectId,
              buildId: build.id,
              url,
              name,
              value,
            });
          })
        );
      })
    );

    return statistics.reduce((a, b) => a.concat(b));
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

/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const SqlStorageMethod = require('./sql/sql.js');

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
   * @param {LHCI.ServerCommand.StorageOptions} options
   * @return {StorageMethod}
   */
  static from(options) {
    switch (options.storageMethod) {
      case 'sql':
        return new SqlStorageMethod();
      default:
        throw new Error(`Storage method "${options.storageMethod}" not yet supported`);
    }
  }
}

module.exports = StorageMethod;

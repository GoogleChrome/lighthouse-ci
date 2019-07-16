/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const URL = require('url').URL;
const fetch = require('isomorphic-fetch');

class ApiClient {
  /**
   * @param {{rootURL: string, fetch?: import('isomorphic-fetch'), URL?: typeof import('url').URL}} options
   */
  constructor(options) {
    this._rootURL = options.rootURL;
    this._fetch = options.fetch || fetch;
    this._URL = options.URL || URL;

    /** @type {LHCI.ServerCommand.StorageMethod} */
    const typecheck = this; // eslint-disable-line no-unused-vars
  }

  /**
   * @param {string} url
   * @return {URL}
   */
  _normalizeURL(url) {
    return new this._URL(url, this._rootURL);
  }

  /**
   * @template {string} T
   * @param {string} rawUrl
   * @param {Partial<Record<T, string|number|undefined>>} [query]
   * @return {Promise<any>}
   */
  async _get(rawUrl, query) {
    const url = this._normalizeURL(rawUrl);
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value === undefined) continue;
        url.searchParams.append(key, value.toString());
      }
    }

    const response = await this._fetch(url.href);
    if (response.status === 404) return undefined;
    const json = await response.json();
    return json;
  }

  /**
   * @param {string} url
   * @param {*} body
   * @return {Promise<any>}
   */
  async _post(url, body) {
    const response = await this._fetch(this._normalizeURL(url).href, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {'content-type': 'application/json'},
    });

    const json = await response.json();
    return json;
  }

  /**
   * @return {Promise<void>}
   */
  async initialize() {
    throw new Error('Unimplemented');
  }

  /**
   * @return {Promise<Array<LHCI.ServerCommand.Project>>}
   */
  async getProjects() {
    return this._get('/v1/projects');
  }

  /**
   * @param {LHCI.ServerCommand.Project} project
   * @return {Promise<string>}
   */
  async getProjectToken(project) {
    return (await this._get(`/v1/projects/${project.id}/token`)).token;
  }

  /**
   * @param {string} token
   * @return {Promise<LHCI.ServerCommand.Project | undefined>}
   */
  async findProjectByToken(token) {
    return this._post(`/v1/projects/lookup`, {token});
  }

  /**
   * @param {string} projectId
   * @return {Promise<LHCI.ServerCommand.Project | undefined>}
   */
  async findProjectById(projectId) {
    return await this._get(`/v1/projects/${projectId}`);
  }

  /**
   * @param {StrictOmit<LHCI.ServerCommand.Project, 'id'>} unsavedProject
   * @return {Promise<LHCI.ServerCommand.Project>}
   */
  async createProject(unsavedProject) {
    return this._post(`/v1/projects`, unsavedProject);
  }

  /**
   * @param {string} projectId
   * @param {LHCI.ServerCommand.GetBuildsOptions} [options]
   * @return {Promise<LHCI.ServerCommand.Build[]>}
   */
  async getBuilds(projectId, options = {}) {
    return this._get(`/v1/projects/${projectId}/builds`, options);
  }

  /**
   * @param {StrictOmit<LHCI.ServerCommand.Build, 'id'>} unsavedBuild
   * @return {Promise<LHCI.ServerCommand.Build>}
   */
  async createBuild(unsavedBuild) {
    return this._post(`/v1/projects/${unsavedBuild.projectId}/builds`, unsavedBuild);
  }

  /**
   * @param {string} projectId
   * @param {string} buildId
   * @return {Promise<LHCI.ServerCommand.Run[]>}
   */
  async getRuns(projectId, buildId) {
    return this._get(`/v1/projects/${projectId}/builds/${buildId}/runs`);
  }

  /**
   * @param {StrictOmit<LHCI.ServerCommand.Run, 'id'>} run
   * @return {Promise<LHCI.ServerCommand.Run>}
   */
  async createRun(run) {
    return this._post(`/v1/projects/${run.projectId}/builds/${run.buildId}/runs`, run);
  }
}

module.exports = ApiClient;

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
   * @param {Promise<any>} returnValuePromise
   * @return {Promise<any>}
   */
  _convert404ToUndefined(returnValuePromise) {
    return returnValuePromise.catch(err => {
      if ('status' in err && err.status === 404) return undefined;
      throw err;
    });
  }

  /**
   * @param {Response} response
   */
  async _convertFetchResponseToReturnValue(response) {
    if (response.status === 204) {
      return undefined;
    }

    if (response.status >= 400) {
      const body = await response.text();
      /** @type {Error & {status?: number, body?: string}} */
      const error = new Error(`Unexpected status code ${response.status}\n  ${body}`);
      error.status = response.status;
      error.body = body;
      throw error;
    }

    if (response.status === 204) return;
    const json = await response.json();
    return json;
  }

  /**
   * @param {string} method
   * @param {string} url
   * @param {*} body
   * @return {Promise<any>}
   */
  async _fetchWithRequestBody(method, url, body) {
    const response = await this._fetch(this._normalizeURL(url).href, {
      method,
      body: JSON.stringify(body),
      headers: {'content-type': 'application/json'},
    });

    return this._convertFetchResponseToReturnValue(response);
  }

  /**
   * @template {string} T
   * @param {string} rawUrl
   * @param {Partial<Record<T, string|number|boolean|undefined>>} [query]
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
    return this._convertFetchResponseToReturnValue(response);
  }

  /**
   * @param {string} url
   * @param {*} body
   * @return {Promise<any>}
   */
  async _post(url, body) {
    return this._fetchWithRequestBody('POST', url, body);
  }

  /**
   * @param {string} url
   * @param {*} body
   * @return {Promise<any>}
   */
  async _put(url, body) {
    return this._fetchWithRequestBody('PUT', url, body);
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
    return this._convert404ToUndefined(this._post(`/v1/projects/lookup`, {token}));
  }

  /**
   * @param {string} projectId
   * @return {Promise<LHCI.ServerCommand.Project | undefined>}
   */
  async findProjectById(projectId) {
    return this._convert404ToUndefined(this._get(`/v1/projects/${projectId}`));
  }

  /**
   * @param {StrictOmit<LHCI.ServerCommand.Project, 'id'|'token'>} unsavedProject
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
   * @param {string} projectId
   * @return {Promise<Array<{branch: string}>>}
   */
  // eslint-disable-next-line no-unused-vars
  async getBranches(projectId) {
    return this._get(`/v1/projects/${projectId}/branches`);
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
   * @return {Promise<void>}
   */
  async sealBuild(projectId, buildId) {
    return this._put(`/v1/projects/${projectId}/builds/${buildId}/lifecycle`, 'sealed');
  }

  /**
   * @param {string} projectId
   * @param {string} buildId
   * @return {Promise<LHCI.ServerCommand.Build | undefined>}
   */
  async findBuildById(projectId, buildId) {
    return this._convert404ToUndefined(this._get(`/v1/projects/${projectId}/builds/${buildId}`));
  }

  /**
   * @param {string} projectId
   * @param {string} buildId
   * @return {Promise<LHCI.ServerCommand.Build | undefined>}
   */
  async findAncestorBuildById(projectId, buildId) {
    return this._convert404ToUndefined(
      this._get(`/v1/projects/${projectId}/builds/${buildId}/ancestor`)
    );
  }

  /**
   * @param {string} projectId
   * @param {string} buildId
   * @param {LHCI.ServerCommand.GetRunsOptions} [options]
   * @return {Promise<LHCI.ServerCommand.Run[]>}
   */
  async getRuns(projectId, buildId, options = {}) {
    return this._get(`/v1/projects/${projectId}/builds/${buildId}/runs`, options);
  }

  /**
   * @param {string} projectId
   * @param {string} [buildId]
   * @return {Promise<{url: string}[]>}
   */
  async getUrls(projectId, buildId) {
    if (buildId) return this._get(`/v1/projects/${projectId}/builds/${buildId}/urls`);
    return this._get(`/v1/projects/${projectId}/urls`);
  }

  /**
   * @param {StrictOmit<LHCI.ServerCommand.Run, 'id'>} run
   * @return {Promise<LHCI.ServerCommand.Run>}
   */
  async createRun(run) {
    return this._post(`/v1/projects/${run.projectId}/builds/${run.buildId}/runs`, run);
  }

  /**
   * @param {string} projectId
   * @param {string} buildId
   * @return {Promise<Array<LHCI.ServerCommand.Statistic>>}
   */
  async getStatistics(projectId, buildId) {
    return this._get(`/v1/projects/${projectId}/builds/${buildId}/statistics`);
  }

  /**
   * @protected
   * @param {StrictOmit<LHCI.ServerCommand.Statistic, 'id'>} unsavedStatistic
   * @return {Promise<LHCI.ServerCommand.Statistic>}
   */
  // eslint-disable-next-line no-unused-vars
  async _createOrUpdateStatistic(unsavedStatistic) {
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

  async close() {}
}

module.exports = ApiClient;

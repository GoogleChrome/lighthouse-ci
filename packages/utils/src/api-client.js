/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const log = require('debug')('lhci:utils:api-client');
const URL = require('url').URL;
const fetch = require('isomorphic-fetch');

/** @type {(s: string) => string} */
const btoa = typeof window === 'undefined' ? s => Buffer.from(s).toString('base64') : window.btoa; // eslint-disable-line no-undef

class ApiClient {
  /**
   * @param {{rootURL: string, fetch?: import('isomorphic-fetch'), URL?: typeof import('url').URL, extraHeaders?: Record<string, string>, basicAuth?: LHCI.ServerCommand.Options['basicAuth']}} options
   */
  constructor(options) {
    this._rootURL = options.rootURL;
    /** @type {Record<string, string>} */
    this._extraHeaders = options.extraHeaders || {};
    this._fetch = options.fetch || fetch;
    this._URL = options.URL || URL;

    if (options.basicAuth && options.basicAuth.password) {
      const {username = ApiClient.DEFAULT_BASIC_AUTH_USERNAME, password} = options.basicAuth;
      this._extraHeaders.Authorization = `Basic ${btoa(`${username}:${password}`)}`;
    }

    /** @type {LHCI.ServerCommand.StorageMethod} */
    const typecheck = this; // eslint-disable-line no-unused-vars
  }

  /** @param {string|undefined} token */
  setBuildToken(token) {
    this._extraHeaders = {...this._extraHeaders, 'x-lhci-build-token': token || ''};
  }

  /** @param {string|undefined} token */
  setAdminToken(token) {
    this._extraHeaders = {...this._extraHeaders, 'x-lhci-admin-token': token || ''};
  }

  /**
   * @param {string} url
   * @return {URL}
   */
  _normalizeURL(url) {
    if (!url.startsWith('/')) throw new Error(`Cannot normalize "${url}" without leading /`);
    const rootWithoutSlash = this._rootURL.endsWith('/')
      ? this._rootURL.slice(0, this._rootURL.length - 1)
      : this._rootURL;
    return new this._URL(`${rootWithoutSlash}${url}`);
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
      headers: {...this._extraHeaders, 'content-type': 'application/json'},
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

    const response = await this._fetch(url.href, {headers: {...this._extraHeaders}});
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
   * @param {string} rawUrl
   * @return {Promise<void>}
   */
  async _delete(rawUrl) {
    const headers = {...this._extraHeaders};
    const response = await this._fetch(this._normalizeURL(rawUrl).href, {
      method: 'DELETE',
      headers,
    });
    return this._convertFetchResponseToReturnValue(response);
  }

  /**
   * @return {Promise<void>}
   */
  async initialize() {
    throw new Error('Unimplemented');
  }

  /**
   * @return {Promise<string>}
   */
  async getVersion() {
    const response = await this._fetch(this._normalizeURL('/version').href, {
      headers: {...this._extraHeaders},
    });

    const body = response.text();

    if (!response.ok) {
      /** @type {Error & {status?: number, body?: any}} */
      const error = new Error(`Unexpected status code ${response.status}\n  ${body}`);
      error.status = response.status;
      error.body = body;
      throw error;
    }

    return body;
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
   * @param {string} slug
   * @return {Promise<LHCI.ServerCommand.Project | undefined>}
   */
  async findProjectBySlug(slug) {
    return this._convert404ToUndefined(this._get(`/v1/projects/slug:${slug}`));
  }

  /**
   * @param {StrictOmit<LHCI.ServerCommand.Project, 'id'|'token'|'adminToken'>} unsavedProject
   * @return {Promise<LHCI.ServerCommand.Project>}
   */
  async createProject(unsavedProject) {
    return this._post(`/v1/projects`, unsavedProject);
  }

  /**
   * @param {Pick<LHCI.ServerCommand.Project, 'id'|'baseBranch'|'externalUrl'|'name'>} projectUpdates
   * @return {Promise<void>}
   */
  async updateProject(projectUpdates) {
    return this._put(`/v1/projects/${projectUpdates.id}`, projectUpdates);
  }

  /**
   * @param {string} projectId
   * @return {Promise<void>}
   */
  async deleteProject(projectId) {
    return this._delete(`/v1/projects/${projectId}`);
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
   * @return {Promise<void>}
   */
  async deleteBuild(projectId, buildId) {
    return this._delete(`/v1/projects/${projectId}/builds/${buildId}`);
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
   * @param {StrictOmit<LHCI.ServerCommand.Project, 'id'|'token'|'adminToken'>} unsavedProject
   * @return {Promise<LHCI.ServerCommand.Project>}
   */
  // eslint-disable-next-line no-unused-vars
  async _createProject(unsavedProject) {
    throw new Error('Unimplemented');
  }

  /**
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
   * @param {Date} runAt
   * @return {Promise<LHCI.ServerCommand.Build[]>}
   */
  // eslint-disable-next-line no-unused-vars
  async findBuildsBeforeTimestamp(runAt) {
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

  async close() {}

  static get DEFAULT_BASIC_AUTH_USERNAME() {
    return 'lhci';
  }

  /**
   * Computes whether the two version strings are API-version compatible.
   * For now this is just semver, but could eventually take more into account.
   * @param {string} clientVersion
   * @param {string} serverVersion
   */
  static isApiVersionCompatible(clientVersion, serverVersion) {
    log(`checking for client (${clientVersion}) server (${serverVersion}) compatibility`);
    const partsClient = clientVersion.match(/(\d+)\.(\d+)\.\d+/);
    const partsServer = serverVersion.match(/(\d+)\.(\d+)\.\d+/);
    if (!partsClient || !partsServer) return false;

    let majorVersionClient = Number(partsClient[1]);
    let majorVersionServer = Number(partsServer[1]);
    if (majorVersionClient !== majorVersionServer) return false;

    if (majorVersionClient === 0) majorVersionClient = Number(partsClient[2]);
    if (majorVersionServer === 0) majorVersionServer = Number(partsServer[2]);

    return (
      majorVersionClient === majorVersionServer || majorVersionClient === majorVersionServer + 1
    );
  }
}

module.exports = ApiClient;

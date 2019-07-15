/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {useState, useEffect} from 'preact/hooks';
import ApiClient from '../../server/api/client.js';

const api = new ApiClient({rootURL: window.location.origin, URL: window.URL});

/** @typedef {'loading'|'error'|'loaded'} LoadingState */

/**
 * @template {keyof StrictOmit<ApiClient, '_rootURL'|'_URL'>} T
 * @param {T} apiMethod
 * @param {Parameters<ApiClient[T]>} apiParameters
 * @return {[LoadingState, UnPromisify<ReturnType<ApiClient[T]>> | undefined]}
 */
function useApiData(apiMethod, apiParameters) {
  const [loadingState, setLoadingState] = useState(/** @type {LoadingState} */ ('loading'));
  const [apiData, setApiData] = useState(/** @type {any} */ (undefined));

  useEffect(() => {
    // Wrap in IIFE because the return value of useEffect should be a cleanup function, not a Promise.
    (async () => {
      try {
        // @ts-ignore - tsc can't figure out that apiParameters matches our apiMethod signature
        const response = await api[apiMethod](...apiParameters);
        setLoadingState('loaded');
        setApiData(response);
      } catch (err) {
        console.error(err); // eslint-disable-line no-console
        setLoadingState('error');
      }
    })();
  }, apiParameters);

  return [loadingState, apiData];
}

/**
 * @return {[LoadingState, Array<LHCI.ServerCommand.Project> | undefined]}
 */
export function useProjectList() {
  return useApiData('getProjects', []);
}

/**
 * @param {string} projectId
 * @return {[LoadingState, LHCI.ServerCommand.Project | undefined]}
 */
export function useProject(projectId) {
  return useApiData('findProjectById', [projectId]);
}

/**
 * @param {string} projectId
 * @return {[LoadingState, Array<LHCI.ServerCommand.Build> | undefined]}
 */
export function useProjectBuilds(projectId) {
  return useApiData('getBuilds', [projectId]);
}

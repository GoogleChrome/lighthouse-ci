/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {useState, useEffect} from 'preact/hooks';

/** @typedef {'loading'|'error'|'loaded'} LoadingState */

/**
 * @template T
 * @param {string} url
 * @param {RequestInit} fetchOptions
 * @return {[LoadingState, T | undefined]}
 */
function useApiData(url, fetchOptions) {
  const [loadingState, setLoadingState] = useState(/** @type {LoadingState} */ ('loading'));
  const [apiData, setApiData] = useState(/** @type {any} */ (undefined));

  useEffect(() => {
    // Wrap in IIFE because the return value of useEffect should be a cleanup function, not a Promise.
    (async () => {
      try {
        const response = await fetch(url, fetchOptions);
        if (response.status !== 200) throw new Error('Could not connect.');
        setLoadingState('loaded');
        setApiData(await response.json());
      } catch (err) {
        setLoadingState('error');
      }
    })();
  }, []);

  return [loadingState, apiData];
}

/**
 * @return {[LoadingState, Array<LHCI.ServerCommand.Project> | undefined]}
 */
export function useProjectList() {
  return useApiData('/v1/projects', {});
}

/**
 * @param {string} projectId
 * @return {[LoadingState, Array<LHCI.ServerCommand.Build> | undefined]}
 */
export function useProjectBuilds(projectId) {
  return useApiData(`/v1/projects/${projectId}/builds`, {});
}

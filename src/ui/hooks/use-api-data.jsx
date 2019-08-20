/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {useState, useEffect, useMemo} from 'preact/hooks';
import ApiClient from '../../server/api/client.js';

export const api = new ApiClient({
  rootURL: window.location.origin,
  URL: window.URL,
  fetch: window.fetch.bind(window),
});

/** @typedef {'loading'|'error'|'loaded'} LoadingState */

/**
 * @template {keyof StrictOmit<ApiClient, '_rootURL'|'_URL'>} T
 * @param {T} apiMethod
 * @param {Parameters<ApiClient[T]>|undefined} apiParameters
 * @return {[LoadingState, UnPromisify<ReturnType<ApiClient[T]>> | undefined]}
 */
function useApiData(apiMethod, apiParameters) {
  const [loadingState, setLoadingState] = useState(/** @type {LoadingState} */ ('loading'));
  const [apiData, setApiData] = useState(/** @type {any} */ (undefined));

  useEffect(() => {
    if (!apiParameters) return;

    // Wrap in IIFE because the return value of useEffect should be a cleanup function, not a Promise.
    (async () => {
      try {
        // @ts-ignore - tsc can't figure out that apiParameters matches our apiMethod signature
        const response = await api[apiMethod](...apiParameters);
        setApiData(response);
        setLoadingState('loaded');
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

/**
 * @param {string|undefined} projectId
 * @return {[LoadingState, Array<{url: string}> | undefined]}
 */
export function useProjectURLs(projectId) {
  return useApiData('getUrls', projectId ? [projectId] : undefined);
}

/**
 * @param {string|undefined} projectId
 * @return {[LoadingState, Array<{branch: string}> | undefined]}
 */
export function useProjectBranches(projectId) {
  return useApiData('getBranches', projectId ? [projectId] : undefined);
}

/**
 * @param {string|undefined} projectId
 * @param {string|undefined} buildId
 * @return {[LoadingState, LHCI.ServerCommand.Build | undefined]}
 */
export function useBuild(projectId, buildId) {
  return useApiData('findBuildById', projectId && buildId ? [projectId, buildId] : undefined);
}

/**
 * @param {string|undefined} projectId
 * @param {string|undefined} buildId
 * @return {[LoadingState, Array<{url: string}> | undefined]}
 */
export function useBuildURLs(projectId, buildId) {
  return useApiData('getUrls', projectId && buildId ? [projectId, buildId] : undefined);
}

/**
 * @param {string|undefined} projectId
 * @param {LHCI.ServerCommand.Build | undefined} build
 * @return {[LoadingState, LHCI.ServerCommand.Build | null | undefined]}
 */
export function useOptionalAncestorBuild(projectId, build) {
  // Construct this options object in a `useMemo` to prevent infinitely re-requesting.
  const getBuildsOptions = useMemo(() => build && {hash: build.ancestorHash}, [build]);
  const [apiLoadingState, builds] = useApiData(
    'getBuilds',
    projectId && build && build.ancestorHash ? [projectId, getBuildsOptions] : undefined
  );

  let loadingState = apiLoadingState;
  /** @type {LHCI.ServerCommand.Build | null | undefined} */
  let ancestorBuild = undefined;
  // If there was no hash to lookup in the first place or there were no matching builds...
  // Then it's "loaded" and the result is just `null`.
  if ((build && !build.ancestorHash) || (builds && !builds.length)) {
    ancestorBuild = null;
    loadingState = 'loaded';
  }
  // If there were matching builds,
  // Then it's "loaded" and the result is the first matched build.
  if (builds && builds.length) {
    ancestorBuild = builds[0];
    loadingState = 'loaded';
  }

  return [loadingState, ancestorBuild];
}

/**
 * @param {string|undefined} projectId
 * @param {string[]|undefined} buildIds
 * @return {[LoadingState, Array<LHCI.ServerCommand.Statistic> | undefined]}
 */
export function useBuildStatistics(projectId, buildIds) {
  const [loadingState, setLoadingState] = useState(/** @type {LoadingState} */ ('loading'));
  const [statistics, setStatistics] = useState(
    /** @type {Array<LHCI.ServerCommand.Statistic> | undefined} */ (undefined)
  );

  useEffect(() => {
    if (!buildIds || !projectId) return;

    // Wrap in IIFE because the return value of useEffect should be a cleanup function, not a Promise.
    (async () => {
      try {
        setStatistics(undefined);
        setLoadingState('loading');

        await Promise.all(
          buildIds.map(async buildId => {
            const response = await api.getStatistics(projectId, buildId);
            setStatistics(existing => (existing || []).concat(response));
          })
        );

        setLoadingState('loaded');
      } catch (err) {
        console.error(err); // eslint-disable-line no-console
        setLoadingState('error');
      }
    })();
  }, [projectId, buildIds]);

  return [loadingState, statistics];
}

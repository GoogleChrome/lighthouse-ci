/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

/**
 * @fileoverview
 *
 * Contains all of the hooks for consuming API data throughout the app.
 * The shape of the return object for all hooks is the below tuple:
 *
 *    `[loadingState, data]: [LoadingState, TData | undefined]`
 *
 * Conventions:
 *
 *    1. `loadingState === 'loaded'` if and only if `data !== undefined`.
 *       Hooks that violate this convention automatically redirect to the project selector via
 *       logic in `async-loader.jsx`.
 *    2. A request is sent if and only if all of a hook's parameters are defined
 *       (i.e. `arguments.every(arg => arg !== undefined)`).
 *    3. A request is reissued whenever the parameters have changed.
 */

import {useState, useEffect, useMemo} from 'preact/hooks';
import ApiClient from '@lhci/utils/src/api-client.js';

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
 * @param {string|undefined} projectId
 * @return {[LoadingState, LHCI.ServerCommand.Project | undefined]}
 */
export function useProject(projectId) {
  return useApiData('findProjectById', projectId ? [projectId] : undefined);
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
 * @param {string} projectId
 * @param {string} branch
 * @return {[LoadingState, Array<LHCI.ServerCommand.Build> | undefined]}
 */
export function useBranchBuilds(projectId, branch) {
  // Construct this options object in a `useMemo` to prevent infinitely re-requesting.
  const getBuildsOptions = useMemo(() => ({branch}), [branch]);
  return useApiData('getBuilds', [projectId, getBuildsOptions]);
}

/**
 * @param {string|undefined} projectId
 * @param {string|undefined} buildId
 * @param {string|null|undefined} url
 * @return {[LoadingState, Array<LHCI.ServerCommand.Run> | undefined]}
 */
export function useOptionalBuildRepresentativeRuns(projectId, buildId, url) {
  const isUrlDefined = url !== undefined;
  // Construct this options object in a `useMemo` to prevent infinitely re-requesting.
  const getRunsOptions = useMemo(
    () => (url ? {representative: true, url} : {representative: true}),
    [url]
  );

  return useApiData(
    'getRuns',
    projectId && buildId && isUrlDefined ? [projectId, buildId, getRunsOptions] : undefined
  );
}

/**
 * @param {string|undefined} projectId
 * @param {string|undefined} buildId
 * @return {[LoadingState, LHCI.ServerCommand.Build | null | undefined]}
 */
export function useAncestorBuild(projectId, buildId) {
  const [apiLoadingState, build] = useApiData(
    'findAncestorBuildById',
    projectId && buildId ? [projectId, buildId] : undefined
  );

  // If we couldn't find an ancestor build but we tried, consider it loaded with `null` to differentiate from `undefined`.
  if (apiLoadingState === 'loaded' && !build) {
    return ['loaded', null];
  }

  return [apiLoadingState, build];
}

/**
 * @param {string|undefined} projectId
 * @param {{ancestorHash?: string} | undefined} build
 * @return {[LoadingState, LHCI.ServerCommand.Build | null | undefined]}
 */
export function useOptionalBuildByHash(projectId, build) {
  // Construct this options object in a `useMemo` to prevent infinitely re-requesting.
  const getBuildsOptions = useMemo(() => build && {hash: build.ancestorHash}, [
    build && build.ancestorHash,
  ]);
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
  // Then it's "loaded" and the result is the first matched build (which would be the most recent in default API sorting)
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

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
import _ from '@lhci/utils/src/lodash.js';

export const api = new ApiClient({
  rootURL: window.location.origin,
  URL: window.URL,
  fetch: window.fetch.bind(window),
});

/** @param {string} projectId @return {string|undefined} */
function getAdminTokenForProject(projectId) {
  return localStorage.getItem(`adminToken__${projectId}`) || undefined;
}

/** @param {string} projectId @param {string} adminToken */
function setAdminTokenForProject(projectId, adminToken) {
  return localStorage.setItem(`adminToken__${projectId}`, adminToken);
}

/** @param {string} projectId @return {[string|undefined, (s: string) => void]} */
export function useAdminToken(projectId) {
  const adminToken = getAdminTokenForProject(projectId);
  // We only use state to trigger a rerender, not to actually keep track of the data
  const setAdminToken = useState(adminToken)[1];

  return [
    adminToken,
    token => {
      setAdminTokenForProject(projectId, token);
      setAdminToken(token);
    },
  ];
}

/** @typedef {'loading'|'error'|'loaded'} LoadingState */

// We cache the last result to getRuns so repeated requests for a particular LHR aren't repeated.
// This could be more sophisticated in the future to de-deduplicate requests and be more aggressive.
// But we don't really need it do be yet, so we'll stay conservative.
/** @type {Partial<Record<keyof ApiClient, {parameters: any, result: any}>>} */
const lastCachedApiData = {
  getRuns: {parameters: undefined, result: undefined},
};

/**
 * @template {keyof StrictOmit<ApiClient, '_rootURL'|'_URL'|'_extraHeaders'|'_fetch'>} T
 * @param {T} apiMethod
 * @param {Parameters<ApiClient[T]>|undefined} apiParameters
 * @return {[LoadingState, UnPromisify<ReturnType<ApiClient[T]>> | undefined]}
 */
function useApiData(apiMethod, apiParameters) {
  const [loadingState, setLoadingState] = useState(/** @type {LoadingState} */ ('loading'));
  const [apiData, setApiData] = useState(/** @type {any} */ (undefined));
  const cache = lastCachedApiData[apiMethod];

  useEffect(() => {
    if (!apiParameters) return;

    // Wrap in IIFE because the return value of useEffect should be a cleanup function, not a Promise.
    (async () => {
      try {
        // Use the cached response if the parameters match.
        let response = undefined;
        if (cache && _.isEqual(apiParameters, cache.parameters)) {
          response = cache.result;
        } else {
          // @ts-ignore - tsc can't figure out that apiParameters matches our apiMethod signature
          response = await api[apiMethod](...apiParameters);
        }

        setApiData(response);
        setLoadingState('loaded');

        // If this is supposed to be cached, stash the result and parameters used.
        if (cache) {
          cache.result = response;
          cache.parameters = apiParameters;
        }
      } catch (err) {
        console.error(err); // eslint-disable-line no-console
        setLoadingState('error');
      }
    })();
  }, apiParameters);

  return [loadingState, apiData];
}

/**
 * @return {[LoadingState, string | undefined]}
 */
export function useVersion() {
  return useApiData('getVersion', []);
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
 * @param {string|undefined} projectSlug
 * @return {[LoadingState, LHCI.ServerCommand.Project | undefined]}
 */
export function useProjectBySlug(projectSlug) {
  return useApiData('findProjectBySlug', projectSlug ? [projectSlug] : undefined);
}

/**
 * @param {string|undefined} projectId
 * @return {[LoadingState, Array<LHCI.ServerCommand.Build> | undefined]}
 */
export function useProjectBuilds(projectId) {
  const lifecycle = /** @type {'sealed'} */ ('sealed');
  const options = useMemo(() => ({limit: 1000, lifecycle}), []);
  return useApiData('getBuilds', projectId ? [projectId, options] : undefined);
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
 * @param {string|null|undefined} buildId
 * @return {[LoadingState, Array<{url: string}> | undefined]}
 */
export function useBuildURLs(projectId, buildId) {
  const [loadingState, data] = useApiData(
    'getUrls',
    projectId && buildId ? [projectId, buildId] : undefined
  );

  // If we receive a `null` that means it's explicitly not available, so short-circuit and return empty
  if (buildId === null) return ['loaded', []];
  return [loadingState, data];
}

/**
 * @param {string} projectId
 * @param {string} branch
 * @param {{limit?: number}} [options]
 * @return {[LoadingState, Array<LHCI.ServerCommand.Build> | undefined]}
 */
export function useBranchBuilds(projectId, branch, options = {}) {
  // Construct this options object in a `useMemo` to prevent infinitely re-requesting.
  const getBuildsOptions = useMemo(() => ({branch, limit: options.limit}), [branch, options.limit]);
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
 * @param {string|null|undefined} buildId
 * @return {[LoadingState, LHCI.ServerCommand.Build | null | undefined]}
 */
export function useOptionalBuildById(projectId, buildId) {
  const buildData = useApiData(
    'findBuildById',
    projectId && buildId ? [projectId, buildId] : undefined
  );

  // If there was no id to lookup in the first place then it's just loaded.
  if (buildId === null) return ['loaded', null];
  return buildData;
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

        setStatistics(existing => existing || []);
        setLoadingState('loaded');
      } catch (err) {
        console.error(err); // eslint-disable-line no-console
        setLoadingState('error');
      }
    })();
  }, [projectId, buildIds]);

  return [loadingState, statistics];
}

/**
 * @param {string|undefined} projectId
 * @param {string|undefined} buildId
 * @param {string|undefined} url
 * @return {[LoadingState, LHCI.ServerCommand.Run | null | undefined]}
 */
export function useRepresentativeRun(projectId, buildId, url) {
  // Construct this options object in a `useMemo` to prevent infinitely re-requesting.
  const getRunsOptions = useMemo(() => ({url, representative: true}), [url]);
  const [apiLoadingState, runs] = useApiData(
    'getRuns',
    projectId && buildId && url ? [projectId, buildId, getRunsOptions] : undefined
  );

  // If we couldn't find a run but we tried, consider it loaded with `null` to differentiate from `undefined`.
  if (apiLoadingState === 'loaded' && (!runs || runs.length !== 1)) {
    return ['loaded', null];
  }

  return [apiLoadingState, runs && runs[0]];
}

/**
 * @param {LHCI.ServerCommand.Run|null|undefined} run
 * @return {LH.Result|null|undefined}
 */
export function useLhr(run) {
  if (!run) return run;

  try {
    return JSON.parse(run.lhr);
  } catch (_) {
    return null;
  }
}

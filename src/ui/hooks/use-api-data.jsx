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

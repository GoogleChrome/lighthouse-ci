/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

/**
 * Returns the route-based parameters from the pathname.
 *
 * Although not technically a hook at this point in time, if preact-router were to stop being buggy
 * (double renders child contents in unclear situations) we could move this to use the built-in hooks.
 *
 * @return {{projectSlug: string | undefined}}
 */
export function useRouteParams() {
  const projectSlug = window.location.pathname.match(/\/app\/projects\/([^/]+)/);
  return {
    projectSlug: (projectSlug && projectSlug[1]) || undefined,
  };
}

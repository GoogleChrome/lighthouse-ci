/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h} from 'preact';
import {Redirect} from './redirect.jsx';

/** @typedef {import('../hooks/use-api-data').LoadingState} LoadingState */

/**
 * @template T
 * @param {{loadingState: LoadingState, asyncData: T | undefined, render: (data: T) => JSX.Element, renderLoading?: () => JSX.Element}} props */
export const AsyncLoader = props => {
  const {asyncData, loadingState, render, renderLoading} = props;

  if (loadingState === 'loaded') {
    return asyncData === undefined ? <Redirect to="/app/projects" /> : render(asyncData);
  } else if (loadingState === 'error') {
    return <h1>Lighthouse Error</h1>;
  } else if (loadingState === 'loading') {
    return renderLoading ? renderLoading() : <h1>Loading...</h1>;
  }

  return null;
};

/**
 * @param {Array<[LoadingState, *]>} states
 */
export function combineLoadingStates(...states) {
  if (states.some(state => state[0] === 'error')) return 'error';
  if (states.some(state => state[0] === 'loading')) return 'loading';
  return 'loaded';
}

/**
 * @template T1
 * @template T2
 * @template T3
 * @template T4
 * @template T5
 * @template T6
 * @param {[LoadingState, T1 | undefined]} l1
 * @param {[LoadingState, T2 | undefined]} l2
 * @param {[LoadingState, T3 | undefined]} [l3]
 * @param {[LoadingState, T4 | undefined]} [l4]
 * @param {[LoadingState, T5 | undefined]} [l5]
 * @param {[LoadingState, T6 | undefined]} [l6]
 * @return {[T1, T2, T3, T4, T5, T6] | undefined}
 */
export function combineAsyncData(l1, l2, l3, l4, l5, l6) {
  const tuples = [l1, l2, l3, l4, l5, l6].filter(tuple => tuple !== undefined);
  const values = tuples.map(tuple => tuple && tuple[1]);

  if (values.every(value => value !== undefined)) {
    // @ts-ignore - tsc doesn't know that the tuples are in order.
    return values;
  }

  return undefined;
}

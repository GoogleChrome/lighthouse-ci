/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h, render as preactRender} from 'preact';
import * as testingLibrary from '@testing-library/dom';

const renderedComponents = new Set();

export function render(preactNodeToRender, {container} = {}) {
  if (!container) {
    container = document.body.appendChild(document.createElement('div'));
  }

  renderedComponents.add(container);
  preactRender(preactNodeToRender, container);

  return {
    container,
    ...testingLibrary.getQueriesForElement(container),
  };
}

export function cleanup() {
  for (const container of renderedComponents) {
    preactRender('', document.body, container);
  }
}

/** @type {typeof import('@testing-library/dom').fireEvent} */
export const dispatchEvent = (...args) => testingLibrary.fireEvent(...args);

Object.keys(testingLibrary.fireEvent).forEach(key => {
  dispatchEvent[key] = (...args) => {
    testingLibrary.fireEvent(...args);
    return new Promise(resolve => process.nextTick(resolve));
  };
});

export const wait = testingLibrary.wait;

export const prettyDOM = testingLibrary.prettyDOM;

/** PrettyDOM but without the color control characters. */
export const snapshotDOM = (el, maxLength) => prettyDOM(el, maxLength).replace(/\[\d{1,2}m/g, '');

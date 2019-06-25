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

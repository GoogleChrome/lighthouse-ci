/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h} from 'preact';
import {useRef, useEffect} from 'preact/hooks';
import * as d3 from 'd3';

/**
 * @param {HTMLElement} rootEl
 * @param {{top: number, right: number, bottom: number, left: number}} margin
 */
export function createRootSvg(rootEl, margin) {
  d3.select(rootEl)
    .selectAll('*')
    .remove();

  const height = rootEl.clientHeight;
  const width = rootEl.clientWidth;
  const graphWidth = width - margin.left - margin.right;
  const graphHeight = height - margin.top - margin.bottom;
  const svgRoot = d3
    .select(rootEl)
    .append('svg')
    .attr('width', width)
    .attr('height', height);

  return {
    width,
    height,
    graphWidth,
    graphHeight,
    masks: svgRoot.append('defs'),
    svg: svgRoot
      .append('g')
      .attr('style', `transform: translate(${margin.left}px, ${margin.top}px)`),
  };
}

/**
 * @param {HTMLElement} rootEl
 * @param {{top: number, right: number, bottom: number, left: number}} margin
 */
export function findRootSvg(rootEl, margin) {
  const height = rootEl.clientHeight;
  const width = rootEl.clientWidth;
  const graphWidth = width - margin.left - margin.right;
  const graphHeight = height - margin.top - margin.bottom;
  const svgRoot = d3.select(rootEl).select('svg');

  return {
    width,
    height,
    graphWidth,
    graphHeight,
    masks: svgRoot.select('defs'),
    svg: svgRoot.select('g'),
  };
}

/**
 * @template T
 * @param {{className?: string, data: T, render: (el: HTMLElement, data: T) => void, computeRerenderKey: (data: T) => string, update?: (el: HTMLElement, data: T) => void, computeUpdateKey?: (data: T) => string}} props
 */
export const D3Graph = props => {
  const graphElRef = useRef(/** @type {HTMLElement|undefined} */ (undefined));
  const updateKey = props.computeUpdateKey ? props.computeUpdateKey(props.data) : '';
  const rerender = () => {
    if (!graphElRef.current) return;
    props.render(graphElRef.current, props.data);
    if (props.update) props.update(graphElRef.current, props.data);
  };

  useEffect(() => {
    rerender();
  }, [props.computeRerenderKey(props.data)]);

  useEffect(() => {
    window.addEventListener('resize', rerender);
    return () => window.removeEventListener('resize', rerender);
  }, [updateKey]);

  useEffect(() => {
    if (!props.update || !graphElRef.current) return;
    props.update(graphElRef.current, props.data);
  }, [updateKey]);

  return <div className={props.className} ref={graphElRef} />;
};

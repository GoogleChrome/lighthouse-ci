/**
 * @license Copyright 2020 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import * as _ from '@lhci/utils/src/lodash.js';
import {findRootSvg} from '../../../components/d3-graph.jsx';
import {HOVER_CARD_MARGIN, HOVER_CARD_WIDTH} from './hover-card.jsx';

/** @typedef {import('../project-category-summaries.jsx').StatisticWithBuild} StatisticWithBuild */

/**
 * @param {[number, number]} domain
 * @param {number} count
 * @return {number[]}
 */
export function getExactTicks(domain, count) {
  return _.range(domain[0], domain[1], (domain[1] - domain[0]) / count);
}

/** @param {Pick<StatisticWithBuild, 'value'>} statistic */
export function getClassNameFromStatistic(
  statistic,
  prefix = 'score',
  passThreshold = 0.9,
  failThreshold = 0.5
) {
  if (statistic.value >= passThreshold) return `${prefix}--pass`;
  if (statistic.value < failThreshold) return `${prefix}--fail`;
  return `${prefix}--average`;
}

/** @param {Array<StatisticWithBuild>} statistics */
export function computeStatisticRerenderKey(statistics) {
  return statistics
    .map(s => s.id)
    .sort()
    .join(',');
}

/**
 * @template T
 * @param {HTMLElement} rootEl
 * @param {{top: number, left: number, right: number, bottom: number}} margin
 * @param {Array<T>} dataItems
 * @param {(n: number) => number} xScale
 * @param {(item: T | undefined) => void} setSelectedId
 * @param {import('preact/hooks/src').StateUpdater<boolean>} setPinned
 */
export function appendHoverCardHitboxElements(
  rootEl,
  margin,
  dataItems,
  xScale,
  setSelectedId,
  setPinned
) {
  const {svg, graphWidth, graphHeight} = findRootSvg(rootEl, margin);
  const categoryCardEl = rootEl.closest('.category-card');
  const graphRootEl = rootEl.closest('.graph-root-el');
  if (!(categoryCardEl instanceof HTMLElement)) throw new Error('Missing category-card');
  if (!(graphRootEl instanceof HTMLElement)) throw new Error('Missing graph-root-el');

  const isDistribution =
    graphRootEl.classList.contains('category-score-graph--distribution') ||
    graphRootEl.classList.contains('metric-distribution-graph');
  const n = dataItems.length - 1;
  const debouncedClearSelection = _.debounce(() => setSelectedId(undefined), 250);

  // Distributions are bar graphs with visual display aligned to xScale bins.
  // Other graphs are line graphs with visual display aligned to the border of xScale bins.
  // We need to shift the hitbox of line graphs by -1/2 a bin.
  const xShift = isDistribution ? 0 : -graphWidth / n / 2;

  // The click and mouseover hitboxes
  svg
    .selectAll('.graph-hitbox')
    .data(dataItems)
    .enter()
    .append('rect')
    .attr('class', 'graph-hitbox')
    .attr('x', (d, i) => xScale(i) + xShift)
    .attr('y', 0)
    .attr('width', graphWidth / n)
    .attr('height', graphHeight)
    .on('click', () => {
      if (!categoryCardEl.querySelector('.hover-card--visible')) return;

      setPinned(current => {
        const next = !current;
        if (!next) debouncedClearSelection();
        return next;
      });
    })
    .on('mouseover', (d, i) => {
      debouncedClearSelection.cancel();
      if (graphRootEl.querySelector('.hover-card--pinned')) return;
      // Set the selected build
      setSelectedId(d);
      updateGraphHoverElements(rootEl, graphWidth, margin.left, margin.right, xScale, i);
    })
    .on('mouseout', () => {
      if (graphRootEl.querySelector('.hover-card--pinned')) return;
      debouncedClearSelection();
    });
}

/**
 * @param {HTMLElement} rootEl
 * @param {number} graphWidth
 * @param {number} graphLeftMargin
 * @param {number} graphRightMargin
 * @param {(n: number) => number} xScale
 * @param {number} selectedIndex
 */
export function updateGraphHoverElements(
  rootEl,
  graphWidth,
  graphLeftMargin,
  graphRightMargin,
  xScale,
  selectedIndex
) {
  const graphRootEl = rootEl.closest('.graph-root-el');
  if (!(graphRootEl instanceof HTMLElement)) throw new Error('Missing graph-root-el');
  const isDistribution =
    graphRootEl.classList.contains('category-score-graph--distribution') ||
    graphRootEl.classList.contains('metric-distribution-graph');

  // Update the position of the tracking line
  const trackingLineEl = graphRootEl.querySelector('.tracking-line');
  if (trackingLineEl instanceof SVGElement) {
    // Tracking line should go through the dot of line graphs but through the *center* of bar graphs
    const visualCueLeft = selectedIndex === -1 ? -9999 : xScale(selectedIndex);
    const hitboxWidth = xScale(1) - xScale(0);
    const translateX = isDistribution ? visualCueLeft + hitboxWidth / 2 : visualCueLeft;
    trackingLineEl.setAttribute('style', `transform: translateX(${translateX}px)`);
  }

  // Update the position of the hover card
  const hoverCard = graphRootEl.querySelector('.hover-card');
  if (hoverCard instanceof HTMLElement) {
    const leftPx =
      selectedIndex === -1 ? -9999 : xScale(selectedIndex) + graphLeftMargin + HOVER_CARD_MARGIN;
    if (leftPx + HOVER_CARD_WIDTH < graphWidth) {
      hoverCard.style.left = leftPx + 'px';
      hoverCard.style.right = '';
    } else {
      const rightPx =
        graphWidth - (leftPx - HOVER_CARD_MARGIN) + graphRightMargin + HOVER_CARD_MARGIN;
      hoverCard.style.left = '';
      hoverCard.style.right = rightPx + 'px';
    }
  }
}

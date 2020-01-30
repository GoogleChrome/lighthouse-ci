/**
 * @license Copyright 2020 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import * as _ from '@lhci/utils/src/lodash.js';
import {findRootSvg} from '../../../components/d3-graph.jsx';
import {HOVER_CARD_MARGIN, HOVER_CARD_WIDTH} from './hover-card.jsx';

/** @typedef {import('../project-category-summaries.jsx').StatisticWithBuild} StatisticWithBuild */

/** @param {Pick<StatisticWithBuild, 'value'>} statistic */
export function getClassNameFromStatistic(statistic) {
  if (statistic.value >= 0.9) return 'score--pass';
  if (statistic.value < 0.5) return 'score--fail';
  return 'score--average';
}

/** @param {Array<StatisticWithBuild>} statistics */
export function computeStatisticRerenderKey(statistics) {
  return statistics
    .map(s => s.id)
    .sort()
    .join(',');
}

/**
 * @param {HTMLElement} rootEl
 * @param {{top: number, left: number, right: number, bottom: number}} margin
 * @param {Array<StatisticWithBuild>} statistics
 * @param {(n: number) => number} xScale
 * @param {import('preact/hooks/src').StateUpdater<string|undefined>} setSelectedBuildId
 * @param {import('preact/hooks/src').StateUpdater<boolean>} setPinned
 */
export function appendHoverCardHitboxElements(
  rootEl,
  margin,
  statistics,
  xScale,
  setSelectedBuildId,
  setPinned
) {
  const {svg, graphWidth, graphHeight} = findRootSvg(rootEl, margin);
  const graphRootEl = rootEl.closest('.graph-root-el');
  if (!(graphRootEl instanceof HTMLElement)) throw new Error('Missing graph-root-el');

  const n = statistics.length - 1;
  const debouncedClearBuildId = _.debounce(() => setSelectedBuildId(undefined), 250);

  // The click and mouseover hitboxes
  svg
    .selectAll('.graph-hitbox')
    .data(statistics)
    .enter()
    .append('rect')
    .attr('class', 'graph-hitbox')
    .attr('x', (d, i) => xScale(i) - graphWidth / n / 2)
    .attr('y', 0)
    .attr('width', graphWidth / n)
    .attr('height', graphHeight)
    .on('click', () => {
      setPinned(current => {
        const next = !current;
        if (!next) debouncedClearBuildId();
        return next;
      });
    })
    .on('mouseover', (d, i) => {
      debouncedClearBuildId.cancel();
      if (graphRootEl.querySelector('.hover-card--pinned')) return;
      // Set the selected build
      setSelectedBuildId(d.buildId);
      updateGraphHoverElements(rootEl, graphWidth, margin.left, margin.right, xScale, i);
    })
    .on('mouseout', () => {
      if (graphRootEl.querySelector('.hover-card--pinned')) return;
      debouncedClearBuildId();
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

  // Update the position of the tracking line
  const trackingLineEl = graphRootEl.querySelector('.tracking-line');
  if (trackingLineEl instanceof SVGElement) {
    const translateX = selectedIndex === -1 ? -9999 : xScale(selectedIndex);
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

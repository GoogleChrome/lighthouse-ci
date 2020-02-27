/**
 * @license Copyright 2020 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h} from 'preact';
import clsx from 'clsx';
import * as d3 from 'd3';
import * as _ from '@lhci/utils/src/lodash.js';

import {createRootSvg, findRootSvg} from '../../../../components/d3-graph';
import {GRAPH_MARGIN} from './category-score-graph';
import {
  updateGraphHoverElements,
  appendHoverCardHitboxElements,
  getClassNameFromStatistic,
} from '../graph-utils';

/** @typedef {import('../../project-category-summaries.jsx').StatisticWithBuild} StatisticWithBuild */

/**
 * @typedef ScoreGraphData
 * @prop {Array<StatisticWithBuild>} statistics
 * @prop {Array<import('d3').Bin<StatisticWithBuild, number>>} binnedStatistics
 * @prop {number} selectedBinIndex
 * @prop {import('preact/hooks/src').StateUpdater<number>} setSelectedBinIndex
 * @prop {import('preact/hooks/src').StateUpdater<boolean>} setPinned
 */

/**
 * @param {HTMLElement} rootEl
 * @param {ScoreGraphData} data
 */
export function renderScoreDistributionGraph(rootEl, data) {
  const {binnedStatistics} = data;

  const {svg, width, graphWidth, graphHeight} = createRootSvg(rootEl, GRAPH_MARGIN);

  const xScale = d3
    .scaleLinear()
    .domain([0, 1])
    .range([0, graphWidth]);
  const xScaleForHover = d3
    .scaleLinear()
    .domain([0, binnedStatistics.length])
    .range([0, graphWidth]);
  const yScale = d3
    .scaleLinear()
    .domain([0, Math.max(...binnedStatistics.map(bin => bin.length))])
    .range([graphHeight, 10]);
  const yAxis = d3
    .axisLeft(yScale)
    .ticks(3)
    .tickSize(0);

  // The numbers on the y-axis to the right-hand side
  svg
    .append('g')
    .attr('class', 'y-axis')
    .attr('style', `transform: translateX(${width - GRAPH_MARGIN.right / 2}px)`)
    .call(yAxis);

  // The tracking line for the hover/click effects
  svg
    .append('line')
    .attr('class', 'tracking-line')
    .style('transform', 'translateX(-9999px)')
    .attr('x1', 0)
    .attr('y1', 0)
    .attr('x2', 0)
    .attr('y2', graphHeight);

  // The histogram bars
  svg
    .selectAll('.histogram-bar')
    .data(binnedStatistics)
    .enter()
    .append('rect')
    .attr('class', ({x0 = 0}) =>
      clsx('histogram-bar', getClassNameFromStatistic({value: x0}, 'histogram-bar'))
    )
    .attr('x', ({x0 = 0, x1 = 0}) => xScale(x0) + (xScale(x1) - xScale(x0)) / 4)
    .attr('y', bin => Math.min(yScale(bin.length), yScale(0) - 2))
    .attr('width', ({x0 = 0, x1 = 0}) => xScale(x1) - xScale(x0) - (xScale(x1) - xScale(x0)) / 2)
    .attr('height', bin => Math.max(yScale(0) - yScale(bin.length), 2));

  appendHoverCardHitboxElements(
    rootEl,
    GRAPH_MARGIN,
    binnedStatistics.map(bin => Object.assign(bin, {buildId: bin[0] && bin[0].buildId})),
    xScaleForHover,
    bin => data.setSelectedBinIndex(bin ? binnedStatistics.indexOf(bin) : -1),
    data.setPinned
  );
}

/**
 * @param {HTMLElement} rootEl
 * @param {ScoreGraphData} data
 */
export function updateScoreDistributionGraph(rootEl, data) {
  const {graphWidth} = findRootSvg(rootEl, GRAPH_MARGIN);

  const xScaleForHover = d3
    .scaleLinear()
    .domain([0, data.binnedStatistics.length])
    .range([0, graphWidth]);

  updateGraphHoverElements(
    rootEl,
    graphWidth,
    GRAPH_MARGIN.left,
    GRAPH_MARGIN.right,
    xScaleForHover,
    data.selectedBinIndex
  );
}

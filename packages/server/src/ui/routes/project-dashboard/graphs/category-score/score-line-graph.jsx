/**
 * @license Copyright 2020 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import clsx from 'clsx';
import * as d3 from 'd3';
import * as _ from '@lhci/utils/src/lodash.js';

import {createRootSvg, findRootSvg} from '../../../../components/d3-graph';
import {GRAPH_MARGIN} from './category-score-graph';
import {
  getClassNameFromStatistic,
  appendHoverCardHitboxElements,
  updateGraphHoverElements,
} from '../graph-utils';

/** @typedef {import('../../project-category-summaries.jsx').StatisticWithBuild} StatisticWithBuild */

/** @param {Array<StatisticWithBuild>} statistics @return {Record<string, {min: number, max: number}>} */
export function buildMinMaxByBuildId(statistics) {
  /** @type {Record<string, {min: number, max: number}>} */
  const minMaxByBuild = {};
  for (const stat of statistics) {
    const entry = minMaxByBuild[stat.buildId] || {min: 0, max: 0};
    if (stat.name.endsWith('_min')) entry.min = stat.value;
    if (stat.name.endsWith('_max')) entry.max = stat.value;
    minMaxByBuild[stat.buildId] = entry;
  }
  return minMaxByBuild;
}

/**
 * @param {number} graphWidth
 * @param {ScoreGraphData} data
 */
function buildXScale(graphWidth, data) {
  return d3
    .scaleLinear()
    .domain([0, data.statistics.length - 1])
    .range([0, graphWidth]);
}

/**
 * @typedef ScoreGraphData
 * @prop {Array<StatisticWithBuild>} statistics
 * @prop {Array<StatisticWithBuild>} statisticsWithMinMax
 * @prop {Array<{index: number}>} versionChanges
 * @prop {string|undefined} selectedBuildId
 * @prop {import('preact/hooks/src').StateUpdater<string|undefined>} setSelectedBuildId
 * @prop {import('preact/hooks/src').StateUpdater<boolean>} setPinned
 */

/**
 * @param {HTMLElement} rootEl
 * @param {ScoreGraphData} data
 */
export function renderScoreGraph(rootEl, data) {
  const {statistics, statisticsWithMinMax, versionChanges, setPinned} = data;

  const {svg, masks, width, graphWidth, graphHeight} = createRootSvg(rootEl, GRAPH_MARGIN);
  const minMaxByBuild = buildMinMaxByBuildId(statisticsWithMinMax);
  const n = statistics.length - 1;
  const statName = statistics[0].name;
  const scoreLineMaskId = `scoreLineMask-${statName}`;

  /** @type {[number, number][]} */
  const passingGuideLine = [[0, 90], [n, 90]];
  /** @type {[number, number][]} */
  const failingGuideLine = [[0, 50], [n, 50]];

  const xScale = buildXScale(graphWidth, data);
  const yScale = d3
    .scaleLinear()
    .domain([0, 100])
    .range([graphHeight, 0]);
  const yAxis = d3
    .axisLeft(yScale)
    .ticks(6)
    .tickSize(0);

  /** @type {() => import('d3').Line<StatisticWithBuild>} */
  const statisticLine = d3.line;
  /** @type {() => import('d3').Area<StatisticWithBuild>} */
  const statisticArea = d3.area;
  const scoreLine = statisticLine()
    .x(d => xScale(statistics.indexOf(d)))
    .y(d => yScale(d.value * 100));
  const scoreRange = statisticArea()
    .curve(d3.curveMonotoneX)
    .x((d, i) => xScale(i))
    .y0(d => yScale(minMaxByBuild[d.buildId].min * 100))
    .y1(d => yScale(minMaxByBuild[d.buildId].max * 100));

  const guideLine = d3
    .line()
    .x(d => xScale(d[0]))
    .y(d => yScale(d[1]));

  masks
    .append('mask')
    .attr('id', scoreLineMaskId)
    .append('path')
    .datum(statistics)
    .attr('d', scoreLine)
    .style('stroke', 'white');

  // The numbers on the y-axis to the right-hand side
  svg
    .append('g')
    .attr('class', 'y-axis')
    .attr('style', `transform: translateX(${width - GRAPH_MARGIN.right / 2}px)`)
    .call(yAxis);

  // The grey error bar area behind the score line
  svg
    .append('path')
    .datum(statistics)
    .attr('class', 'score-error-range')
    .attr('d', scoreRange);

  // Passing/Average horizontal score guide
  svg
    .append('path')
    .datum(passingGuideLine)
    .attr('class', 'score-guide')
    .attr('d', guideLine);

  // Average/Failing horizontal score guide
  svg
    .append('path')
    .datum(failingGuideLine)
    .attr('class', 'score-guide')
    .attr('d', guideLine);

  // The shaded area for the version changes
  for (const {index} of versionChanges) {
    svg
      .append('rect')
      .attr('class', 'version-change-warning')
      .attr('x', xScale(index - 1))
      .attr('y', 0)
      .attr('width', xScale(index) - xScale(index - 1))
      .attr('height', graphHeight);
  }

  // Passing score line mask fill
  svg
    .append('rect')
    .attr('x', xScale(0))
    .attr('y', yScale(100))
    .attr('width', xScale(n) - xScale(0))
    .attr('height', yScale(90) - yScale(100))
    .attr('mask', `url(#${scoreLineMaskId})`)
    .attr('class', clsx('score-line-fill', getClassNameFromStatistic({value: 1})));

  // Average score line mask fill
  svg
    .append('rect')
    .attr('x', xScale(0))
    .attr('y', yScale(90))
    .attr('width', xScale(n) - xScale(0))
    .attr('height', yScale(50) - yScale(90))
    .attr('mask', `url(#${scoreLineMaskId})`)
    .attr('class', clsx('score-line-fill', getClassNameFromStatistic({value: 0.75})));

  // Failing score line mask fill
  svg
    .append('rect')
    .attr('x', xScale(0))
    .attr('y', yScale(50))
    .attr('width', xScale(n) - xScale(0))
    .attr('height', yScale(0) - yScale(50))
    .attr('mask', `url(#${scoreLineMaskId})`)
    .attr('class', clsx('score-line-fill', getClassNameFromStatistic({value: 0})));

  // The tracking line for the hover/click effects
  svg
    .append('line')
    .attr('class', 'tracking-line')
    .style('transform', 'translateX(-9999px)')
    .attr('x1', 0)
    .attr('y1', 0)
    .attr('x2', 0)
    .attr('y2', graphHeight);

  // The individual score points
  svg
    .selectAll('.score-point')
    .data(statistics)
    .enter()
    .append('circle')
    .attr('class', d => clsx('score-point', getClassNameFromStatistic(d)))
    .attr('cx', (d, i) => xScale(i))
    .attr('cy', d => yScale(d.value * 100))
    .attr('r', 3);

  appendHoverCardHitboxElements(
    rootEl,
    GRAPH_MARGIN,
    statistics,
    xScale,
    stat => data.setSelectedBuildId(stat && stat.buildId),
    setPinned
  );
}

/**
 * @param {HTMLElement} rootEl
 * @param {ScoreGraphData} data
 */
export function updateScoreGraph(rootEl, data) {
  const {graphWidth} = findRootSvg(rootEl, GRAPH_MARGIN);
  const xScale = buildXScale(graphWidth, data);

  const selectedIndex = data.statistics.findIndex(stat => stat.buildId === data.selectedBuildId);

  updateGraphHoverElements(
    rootEl,
    graphWidth,
    GRAPH_MARGIN.left,
    GRAPH_MARGIN.right,
    xScale,
    selectedIndex
  );
}

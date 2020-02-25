/**
 * @license Copyright 2020 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import clsx from 'clsx';
import * as d3 from 'd3';
import * as _ from '@lhci/utils/src/lodash.js';

import {createRootSvg} from '../../../../components/d3-graph';
import {GRAPH_MARGIN} from './category-score-graph';

/** @typedef {import('../../project-category-summaries.jsx').StatisticWithBuild} StatisticWithBuild */

/**
 * @typedef ScoreGraphData
 * @prop {Array<StatisticWithBuild>} statistics
 */

/**
 * @param {HTMLElement} rootEl
 * @param {ScoreGraphData} data
 */
export function renderScoreDistributionGraph(rootEl, data) {
  const {statistics} = data;

  const {svg, width, graphWidth, graphHeight} = createRootSvg(rootEl, GRAPH_MARGIN);

  /** @type {() => import('d3').HistogramGeneratorNumber<StatisticWithBuild, number>} */
  const statisticHistogram = d3.histogram;
  const binnedStatistics = statisticHistogram()
    .domain([0, 1])
    .value(stat => stat.value)
    .thresholds(50)(statistics);

  const xScale = d3
    .scaleLinear()
    .domain([0, 1])
    .range([0, graphWidth]);
  const yScale = d3
    .scaleLinear()
    .domain([0, Math.max(...binnedStatistics.map(bin => bin.length))])
    .range([graphHeight, 0]);
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

  // The histogram bars
  svg
    .selectAll('.histogram-bar')
    .data(binnedStatistics)
    .enter()
    .append('rect')
    .attr('class', ({x0 = 0, x1 = 0}) =>
      clsx('histogram-bar', {
        'histogram-bar--pass': x0 >= 0.9,
        'histogram-bar--average': x0 < 0.9 && x1 > 0.5,
        'histogram-bar--fail': x1 <= 0.5,
      })
    )
    .attr('x', ({x0 = 0, x1 = 0}) => xScale(x0) + (xScale(x1) - xScale(x0)) / 4)
    .attr('y', bin => Math.min(yScale(bin.length), yScale(0) - 2))
    .attr('width', ({x0 = 0, x1 = 0}) => xScale(x1) - xScale(x0) - (xScale(x1) - xScale(x0)) / 2)
    .attr('height', bin => Math.max(yScale(0) - yScale(bin.length), 2));
}

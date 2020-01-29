/**
 * @license Copyright 2020 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h} from 'preact';
import * as d3 from 'd3';
import * as _ from '@lhci/utils/src/lodash.js';

import {D3Graph, createRootSvg} from '../../../components/d3-graph';
import {computeStatisticRerenderKey} from './graph-utils';

import './metric-line-graph.css';

const GRAPH_MARGIN = {top: 20, right: 50, bottom: 20, left: 20};

/** @typedef {import('../project-category-summaries.jsx').StatisticWithBuild} StatisticWithBuild */

/** @typedef {{statistics: Array<StatisticWithBuild>, label: string}} MetricLineDef */

/**
 * @typedef LineGraphData
 * @prop {Array<MetricLineDef>} metrics
 */

/**
 * @param {HTMLElement} rootEl
 * @param {LineGraphData} data
 */
function renderLineGraph(rootEl, data) {
  const {metrics} = data;
  const {svg, width, graphWidth, graphHeight} = createRootSvg(rootEl, GRAPH_MARGIN);

  const n = metrics[0].statistics.length - 1;
  const yMax = Math.max(...metrics.map(m => Math.max(...m.statistics.map(s => s.value))));
  const yMaxSeconds = Math.ceil(yMax / 1000);

  const xScale = d3
    .scaleLinear()
    .domain([0, n])
    .range([0, graphWidth]);
  const yScale = d3
    .scaleLinear()
    .domain([0, yMaxSeconds])
    .range([graphHeight, 0]);
  const yAxis = d3
    .axisLeft(yScale)
    .ticks(Math.min(yMaxSeconds, 10))
    .tickFormat(d => d3.format('.0f')(d) + 's')
    .tickSize(0);
  /** @type {() => import('d3').Line<StatisticWithBuild>} */
  const statisticLine = d3.line;

  // The numbers on the y-axis to the right-hand side
  svg
    .append('g')
    .attr('class', 'y-axis')
    .attr('style', `transform: translateX(${width - GRAPH_MARGIN.right / 2}px)`)
    .call(yAxis);

  for (const metric of metrics) {
    const metricLine = statisticLine()
      .curve(d3.curveMonotoneX)
      .x(d => xScale(metric.statistics.indexOf(d)))
      .y(d => yScale(d.value / 1000));

    svg
      .append('path')
      .datum(metric.statistics)
      .attr('class', 'metric-line-graph__line')
      .attr('d', metricLine);
  }
}

/** @param {{metrics: Array<MetricLineDef>}} props */
export const MetricLineGraph = props => {
  return (
    <D3Graph
      className="metric-line-graph"
      data={props}
      render={renderLineGraph}
      computeRerenderKey={data =>
        computeStatisticRerenderKey(
          data.metrics.map(m => m.statistics).reduce((a, b) => a.concat(b))
        )
      }
    />
  );
};

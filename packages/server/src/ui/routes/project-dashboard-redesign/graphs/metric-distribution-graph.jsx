/**
 * @license Copyright 2020 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h} from 'preact';
import * as d3 from 'd3';
import * as _ from '@lhci/utils/src/lodash.js';

import {D3Graph, createRootSvg} from '../../../components/d3-graph';
import {computeStatisticRerenderKey, getExactTicks} from './graph-utils';

import './metric-distribution-graph.css';
import clsx from 'clsx';

const GRAPH_MARGIN = {top: 20, right: 20, bottom: 20, left: 50};

/** @typedef {import('../project-category-summaries.jsx').StatisticWithBuild} StatisticWithBuild */

/**
 * @typedef GraphData
 * @prop {Array<StatisticWithBuild>} statistics
 * @prop {string} abbreviation
 * @prop {string} label
 * @prop {[number, number]} scoreLevels
 * @prop {number} xMax
 */

/**
 * @param {HTMLElement} rootEl
 * @param {GraphData} data
 */
function renderHistogram(rootEl, data) {
  const {statistics, xMax} = data;
  const [passThreshold, failThreshold] = data.scoreLevels;
  const {svg, graphWidth, graphHeight} = createRootSvg(rootEl, GRAPH_MARGIN);

  const xScale = d3
    .scaleLinear()
    .domain([0, xMax])
    .range([0, graphWidth]);

  /** @type {() => import('d3').HistogramGeneratorNumber<StatisticWithBuild, number>} */
  const statisticHistogram = d3.histogram;
  const binnedStatistics = statisticHistogram()
    .thresholds(getExactTicks([0, data.xMax], 25))
    .domain([0, xMax])
    .value(stat => Math.min(stat.value, xMax))(statistics);

  const yMax = Math.max(...binnedStatistics.map(bin => bin.length));
  const yScale = d3
    .scaleLinear()
    .domain([0, yMax])
    .range([graphHeight, 10]);
  const yAxis = d3
    .axisLeft(yScale)
    .ticks(Math.min(3, yMax))
    .tickSize(0);

  // The numbers on the y-axis to the right-hand side
  svg
    .append('g')
    .attr('class', 'y-axis')
    .attr('style', `transform: translateX(${-GRAPH_MARGIN.left / 4}px)`)
    .call(yAxis);

  // The histogram bars
  svg
    .selectAll('.histogram-bar')
    .data(binnedStatistics)
    .enter()
    .append('rect')
    .attr('class', ({x0 = 0}) =>
      clsx('histogram-bar', {
        'histogram-bar--pass': x0 < passThreshold,
        'histogram-bar--fail': x0 > failThreshold,
        'histogram-bar--average': x0 >= passThreshold && x0 <= failThreshold,
      })
    )
    .attr('x', ({x0 = 0}) => xScale(x0) + 1)
    .attr('y', bin => Math.min(yScale(bin.length), yScale(0) - 2))
    .attr('width', ({x0 = 0, x1 = 0}) => xScale(x1) - xScale(x0) - 2)
    .attr('height', bin => Math.max(yScale(0) - yScale(bin.length), 2));
}

/** @param {StrictOmit<GraphData, 'xMax'>} props */
export const MetricDistributionGraph = props => {
  const xMax = Math.ceil((props.scoreLevels[1] * 2) / 1000) * 1000;
  return (
    <div className="metric-distribution-graph graph-root-el">
      <div className="metric-distribution-graph__title">
        <span>{props.abbreviation}</span> {props.label}
      </div>
      <D3Graph
        className="metric-distribution-graph__graph"
        data={{...props, xMax}}
        render={renderHistogram}
        computeRerenderKey={data => computeStatisticRerenderKey(data.statistics)}
      />

      <div className="metric-distribution-graph__x-axis">
        <div style={{marginLeft: GRAPH_MARGIN.left}}>0s</div>
        <div style={{flexGrow: 1}} />
        <div style={{marginRight: GRAPH_MARGIN.right}}>{xMax / 1000}s</div>
      </div>
    </div>
  );
};

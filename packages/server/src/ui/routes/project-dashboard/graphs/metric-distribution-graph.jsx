/**
 * @license Copyright 2020 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h, Fragment} from 'preact';
import {useState} from 'preact/hooks';
import * as d3 from 'd3';
import * as _ from '@lhci/utils/src/lodash.js';

import {D3Graph, createRootSvg, findRootSvg} from '../../../components/d3-graph';
import {
  computeStatisticRerenderKey,
  getExactTicks,
  getClassNameFromStatistic,
  updateGraphHoverElements,
  appendHoverCardHitboxElements,
} from './graph-utils';

import './metric-distribution-graph.css';
import clsx from 'clsx';
import {HoverCard} from './hover-card';

const GRAPH_MARGIN = {top: 20, right: 20, bottom: 20, left: 50};

/** @typedef {import('../project-category-summaries.jsx').StatisticWithBuild} StatisticWithBuild */

/**
 * @typedef GraphData
 * @prop {Array<StatisticWithBuild>} statistics
 * @prop {Array<import('d3').Bin<StatisticWithBuild, number>>} binnedStatistics
 * @prop {string} abbreviation
 * @prop {string} label
 * @prop {[number, number]} scoreLevels
 * @prop {number} xMax
 * @prop {boolean} pinned
 * @prop {import('preact/hooks/src').StateUpdater<boolean>} setPinned
 * @prop {number} selectedBinIndex
 * @prop {import('preact/hooks/src').StateUpdater<number>} setSelectedBinIndex
 */

/**
 * @param {HTMLElement} rootEl
 * @param {GraphData} data
 */
function renderHistogram(rootEl, data) {
  const {binnedStatistics, xMax} = data;
  const [passThreshold, failThreshold] = data.scoreLevels;
  const {svg, graphWidth, graphHeight} = createRootSvg(rootEl, GRAPH_MARGIN);

  const xScale = d3
    .scaleLinear()
    .domain([0, xMax])
    .range([0, graphWidth]);
  const xScaleForHover = d3
    .scaleLinear()
    .domain([0, binnedStatistics.length])
    .range([0, graphWidth]);

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

  appendHoverCardHitboxElements(
    rootEl,
    GRAPH_MARGIN,
    binnedStatistics.map(bin => Object.assign(bin, {buildId: bin[0] && bin[0].buildId})),
    xScaleForHover,
    bin => data.setSelectedBinIndex(bin ? binnedStatistics.indexOf(bin) : -1),
    data.setPinned
  );
}

/** @param {StrictOmit<GraphData, 'xMax'>} props */
const HoverCardWithDistribution = props => {
  const {selectedBinIndex, binnedStatistics: bins} = props;
  const bin = selectedBinIndex !== -1 ? bins[selectedBinIndex] : undefined;
  const statWithBuild = bin && bin[0];
  /** @param {number} x */
  const toDisplay = x => `${Math.round(x / 100) / 10}s`;

  let children = <Fragment />;
  if (bin && bin.length) {
    const {x0 = 0, x1 = 0} = bin;
    const ellipsisChild =
      bin.length > 5 ? (
        <div className="distribution-example">
          <span>...</span>
        </div>
      ) : null;

    children = (
      <Fragment>
        <div className="distribution-summary">
          <div className="text--smaller text--secondary">
            {toDisplay(x0)} - {toDisplay(x1)}
          </div>
          {bin.length} <span>{_.pluralize('example', bin.length)}</span>
        </div>
        {bin.slice(0, 5).map(stat => (
          <div className="distribution-example" key={stat.id}>
            <span className={getClassNameFromStatistic(stat, 'text')}>{toDisplay(stat.value)}</span>
            {stat.build.commitMessage}
          </div>
        ))}
        {ellipsisChild}
      </Fragment>
    );
  }

  return (
    <HoverCard
      url={(statWithBuild && statWithBuild.url) || ''}
      build={statWithBuild && statWithBuild.build}
      pinned={props.pinned}
      hideBuildDate
      hideActions
    >
      {children}
    </HoverCard>
  );
};

/**
 * @param {HTMLElement} rootEl
 * @param {GraphData} data
 */
function updateGraph(rootEl, data) {
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

/** @param {StrictOmit<GraphData, 'xMax'|'binnedStatistics'|'selectedBinIndex'|'setSelectedBinIndex'|'pinned'|'setPinned'>} props */
export const MetricDistributionGraph = props => {
  const [pinned, setPinned] = useState(false);
  const [selectedBinIndex, setSelectedBinIndex] = useState(-1);
  const xMax = Math.ceil((props.scoreLevels[1] * 2) / 1000) * 1000;
  /** @type {() => import('d3').HistogramGeneratorNumber<StatisticWithBuild, number>} */
  const statisticHistogram = d3.histogram;
  const binnedStatistics = statisticHistogram()
    .thresholds(getExactTicks([0, xMax], 25))
    .domain([0, xMax])
    .value(stat => Math.min(stat.value, xMax))(props.statistics);

  const graphData = {
    ...props,
    xMax,
    binnedStatistics,
    selectedBinIndex,
    setSelectedBinIndex,
    pinned,
    setPinned,
  };

  return (
    <div className="metric-distribution-graph graph-root-el">
      <div className="metric-distribution-graph__title">
        <span>{props.abbreviation}</span> {props.label}
      </div>
      <D3Graph
        className="metric-distribution-graph__graph"
        data={graphData}
        render={renderHistogram}
        computeRerenderKey={data => computeStatisticRerenderKey(data.statistics)}
        update={updateGraph}
        computeUpdateKey={data => data.selectedBinIndex.toString()}
      />
      <HoverCardWithDistribution {...graphData} />
      <div className="metric-distribution-graph__x-axis">
        <div style={{marginLeft: GRAPH_MARGIN.left}}>0s</div>
        <div style={{flexGrow: 1}} />
        <div style={{marginRight: GRAPH_MARGIN.right}}>{xMax / 1000}s</div>
      </div>
    </div>
  );
};

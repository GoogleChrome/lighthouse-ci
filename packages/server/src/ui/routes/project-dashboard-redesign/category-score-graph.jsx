/**
 * @license Copyright 2020 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h} from 'preact';
import * as d3 from 'd3';

import './category-score-graph.css';
import {useRef, useEffect} from 'preact/hooks';

/** @typedef {import('./project-graphs-redesign.jsx').StatisticWithBuild} StatisticWithBuild */

/**
 *
 * @param {HTMLElement} rootEl
 * @param {Array<StatisticWithBuild>} statistics
 */
function render(rootEl, statistics) {
  const margin = 10;
  const marginRight = 50;
  const height = rootEl.clientHeight;
  const width = rootEl.clientWidth;
  const graphWidth = width - margin - marginRight;
  const graphHeight = height - margin * 2;

  /** @type {[number, number][]} */
  const passingGuideLine = [[0, 90], [statistics.length - 1, 90]];
  /** @type {[number, number][]} */
  const failingGuideLine = [[0, 50], [statistics.length - 1, 50]];

  const xScale = d3
    .scaleLinear()
    .domain([0, statistics.length - 1])
    .range([0, graphWidth]);

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
    .x((d, i) => xScale(i))
    .y(d => yScale(d.value * 100));
  const scoreRange = statisticArea()
    .x((d, i) => xScale(i))
    .y0(d => yScale(Math.max(d.value * 100 - 8, 0)))
    .y1(d => yScale(Math.min(100, d.value * 100 + 8)));

  const guideLine = d3
    .line()
    .x(d => xScale(d[0]))
    .y(d => yScale(d[1]));

  d3.select(rootEl)
    .selectAll('*')
    .remove();

  const svg = d3
    .select(rootEl)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .append('g')
    .attr('style', `transform: translate(${margin}px, ${margin}px)`);

  svg
    .append('g')
    .attr('class', 'y-axis')
    .attr('style', `transform: translateX(${width - marginRight / 2}px)`)
    .call(yAxis);

  svg
    .append('path')
    .datum(statistics)
    .attr('class', 'score-error-range')
    .attr('d', scoreRange);

  svg
    .append('path')
    .datum(passingGuideLine)
    .attr('class', 'score-guide')
    .attr('d', guideLine);
  svg
    .append('path')
    .datum(failingGuideLine)
    .attr('class', 'score-guide')
    .attr('d', guideLine);

  svg
    .append('path')
    .datum(statistics)
    .attr('class', 'score-line')
    .attr('d', scoreLine);

  svg
    .selectAll('.score-point')
    .data(statistics)
    .enter()
    .append('circle')
    .attr('class', 'score-point')
    .attr('cx', (d, i) => xScale(i))
    .attr('cy', d => yScale(d.value * 100))
    .attr('r', 3);
}

/** @param {{statistics: Array<StatisticWithBuild>}} props */
const Graph = props => {
  const graphElRef = useRef(/** @type {HTMLElement|undefined} */ (undefined));

  useEffect(() => {
    if (!graphElRef.current) return;
    render(graphElRef.current, props.statistics);
  }, [props.statistics.length]);

  return <div className="category-score-graph__score-graph" ref={graphElRef} />;
};

/** @param {{category: 'performance'|'pwa', statistics: Array<StatisticWithBuild>}} props */
export const CategoryScoreGraph = props => {
  const statistics = props.statistics.filter(s => s.name === `category_${props.category}_average`);

  return (
    <div className="category-score-graph">
      <h2>Overview</h2>
      <Graph statistics={statistics} />
    </div>
  );
};

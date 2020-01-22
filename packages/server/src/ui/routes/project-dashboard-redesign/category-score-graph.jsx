/**
 * @license Copyright 2020 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h} from 'preact';
import * as d3 from 'd3';

import './category-score-graph.css';
import {useRef, useEffect} from 'preact/hooks';
import clsx from 'clsx';

const GRAPH_MARGIN = 10;
const GRAPH_MARGIN_RIGHT = 50;
const DELTA_GRAPH_MIN = -50;
const DELTA_GRAPH_MAX = 50;

/** @typedef {import('./project-graphs-redesign.jsx').StatisticWithBuild} StatisticWithBuild */

/** @param {StatisticWithBuild} statistic */
function getClassNameFromStatistic(statistic) {
  if (statistic.value >= 0.9) return 'score--pass';
  if (statistic.value < 0.5) return 'score--fail';
  return 'score--average';
}

/**
 * This function takes the score statistics and creates line segments that can be individually colored
 * based on their score.
 *
 * @param {Array<StatisticWithBuild>} statistics
 * @return {Array<Array<StatisticWithBuild>>}
 */
export function computeScoreLineSegments(statistics) {
  const statsReversed = statistics.slice().reverse();
  const firstStatistic = statsReversed.pop();
  if (!firstStatistic) return [];

  /** @type {Array<StatisticWithBuild>} */
  let segment = [firstStatistic];
  let currentClass = getClassNameFromStatistic(firstStatistic);
  /** @type {Array<Array<StatisticWithBuild>>} */
  const segments = [segment];

  while (statsReversed.length) {
    const nextStatistic = statsReversed.pop();
    if (!nextStatistic) throw new Error('Impossible');

    if (currentClass === getClassNameFromStatistic(nextStatistic)) {
      // We're continuing the same score class, keep the same segment and add this stat to it.
      segment.push(nextStatistic);
    } else {
      // We're changing the score class. End the previous segment where it was and start a new one.
      // This new segment will start at the end of the last segment.
      const lastSegmentEnd = segment[segment.length - 1];
      currentClass = getClassNameFromStatistic(nextStatistic);
      segment = [lastSegmentEnd, nextStatistic];
      segments.push(segment);
    }
  }

  return segments.filter(segment => segment.length > 1);
}

/** @param {HTMLElement} rootEl */
function createRootSvg(rootEl) {
  const height = rootEl.clientHeight;
  const width = rootEl.clientWidth;
  const graphWidth = width - GRAPH_MARGIN - GRAPH_MARGIN_RIGHT;
  const graphHeight = height - GRAPH_MARGIN * 2;

  return {
    width,
    height,
    graphWidth,
    graphHeight,
    svg: d3
      .select(rootEl)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('style', `transform: translate(${GRAPH_MARGIN}px, ${GRAPH_MARGIN}px)`),
  };
}

/**
 *
 * @param {HTMLElement} rootEl
 * @param {Array<StatisticWithBuild>} statistics
 */
function renderScoreGraph(rootEl, statistics) {
  d3.select(rootEl)
    .selectAll('*')
    .remove();
  const {svg, width, graphWidth, graphHeight} = createRootSvg(rootEl);

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
    .x(d => xScale(statistics.indexOf(d)))
    .y(d => yScale(d.value * 100));
  const scoreRange = statisticArea()
    .x((d, i) => xScale(i))
    .y0(d => yScale(Math.max(d.value * 100 - 8, 0)))
    .y1(d => yScale(Math.min(100, d.value * 100 + 8)));

  const guideLine = d3
    .line()
    .x(d => xScale(d[0]))
    .y(d => yScale(d[1]));

  svg
    .append('g')
    .attr('class', 'y-axis')
    .attr('style', `transform: translateX(${width - GRAPH_MARGIN_RIGHT / 2}px)`)
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

  for (const lineData of computeScoreLineSegments(statistics)) {
    svg
      .append('path')
      .datum(lineData)
      .attr('class', clsx('score-line', getClassNameFromStatistic(lineData[lineData.length - 1])))
      .attr('d', scoreLine);
  }

  svg
    .selectAll('.score-point')
    .data(statistics)
    .enter()
    .append('circle')
    .attr('class', d => clsx('score-point', getClassNameFromStatistic(d)))
    .attr('cx', (d, i) => xScale(i))
    .attr('cy', d => yScale(d.value * 100))
    .attr('r', 3);
}

/**
 *
 * @param {HTMLElement} rootEl
 * @param {Array<StatisticWithBuild>} statistics
 */
function renderScoreDeltaGraph(rootEl, statistics) {
  d3.select(rootEl)
    .selectAll('*')
    .remove();
  const deltas = statistics
    .map((stat, i) => (i === 0 ? 0 : (stat.value - statistics[i - 1].value) * 100))
    .map(delta => Math.min(Math.max(delta, DELTA_GRAPH_MIN), DELTA_GRAPH_MAX));
  const {svg, graphWidth, graphHeight} = createRootSvg(rootEl);

  const xScale = d3
    .scaleLinear()
    .domain([0, deltas.length - 1])
    .range([0, graphWidth]);

  const yScale = d3
    .scaleLinear()
    .domain([DELTA_GRAPH_MIN, DELTA_GRAPH_MAX])
    .range([graphHeight, 0]);

  svg
    .append('line')
    .attr('class', 'score-guide')
    .attr('x1', xScale(0))
    .attr('y1', yScale(0))
    .attr('x2', xScale(deltas.length - 1))
    .attr('y2', yScale(0));

  svg
    .selectAll('.score-delta')
    .data(deltas)
    .enter()
    .append('rect')
    .attr('class', d =>
      clsx('score-delta', {
        'score-delta--improvement': d > 0,
        'score-delta--regression': d < 0,
      })
    )
    .attr('x', (d, i) => xScale(i) - graphWidth / deltas.length / 8)
    .attr('y', d => (d > 0 ? yScale(d) : yScale(0)))
    .attr('width', graphWidth / deltas.length / 4)
    .attr('height', d => Math.abs(yScale(d) - yScale(0)));
}

/** @param {{statistics: Array<StatisticWithBuild>}} props */
const ScoreGraph = props => {
  const graphElRef = useRef(/** @type {HTMLElement|undefined} */ (undefined));

  useEffect(() => {
    const rerender = () =>
      graphElRef.current && renderScoreGraph(graphElRef.current, props.statistics);

    rerender();
    window.addEventListener('resize', rerender);
    return () => window.removeEventListener('resize', rerender);
  }, [props.statistics.length]);

  return <div className="category-score-graph__score-graph" ref={graphElRef} />;
};

/** @param {{statistics: Array<StatisticWithBuild>}} props */
const ScoreDeltaGraph = props => {
  const graphElRef = useRef(/** @type {HTMLElement|undefined} */ (undefined));

  useEffect(() => {
    const rerender = () =>
      graphElRef.current && renderScoreDeltaGraph(graphElRef.current, props.statistics);

    rerender();
    window.addEventListener('resize', rerender);
    return () => window.removeEventListener('resize', rerender);
  }, [props.statistics.length]);

  return <div className="category-score-graph__score-delta-graph" ref={graphElRef} />;
};

/** @param {{category: 'performance'|'pwa', statistics: Array<StatisticWithBuild>}} props */
export const CategoryScoreGraph = props => {
  const statistics = props.statistics.filter(s => s.name === `category_${props.category}_average`);

  if (!statistics.length) return <span>No data available</span>;

  return (
    <div className="category-score-graph">
      <h2>Overview</h2>
      <ScoreGraph statistics={statistics} />
      <ScoreDeltaGraph statistics={statistics} />
      <div className="category-score-graph__date-range">
        <div style={{marginLeft: GRAPH_MARGIN}}>
          {new Date(statistics[0].createdAt || '').toLocaleDateString()}
        </div>
        <div style={{flexGrow: 1}} />
        <div style={{marginRight: GRAPH_MARGIN_RIGHT}}>
          {new Date(statistics[statistics.length - 1].createdAt || '').toLocaleDateString()}
        </div>
      </div>
    </div>
  );
};

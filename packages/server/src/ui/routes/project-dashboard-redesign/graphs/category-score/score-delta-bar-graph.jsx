import clsx from 'clsx';
import * as d3 from 'd3';

import {createRootSvg} from '../../../../components/d3-graph';
import {GRAPH_MARGIN} from './category-score-graph';

/** @typedef {import('../../project-category-summaries.jsx').StatisticWithBuild} StatisticWithBuild */

const DELTA_GRAPH_MIN = -50;
const DELTA_GRAPH_MAX = 50;

/**
 *
 * @param {HTMLElement} rootEl
 * @param {Array<StatisticWithBuild>} statistics
 */
export function renderScoreDeltaGraph(rootEl, statistics) {
  const {svg, graphWidth, graphHeight} = createRootSvg(rootEl, GRAPH_MARGIN);

  const deltas = statistics
    .map((stat, i) => (i === 0 ? 0 : (stat.value - statistics[i - 1].value) * 100))
    .map(delta => Math.min(Math.max(delta, DELTA_GRAPH_MIN), DELTA_GRAPH_MAX));
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

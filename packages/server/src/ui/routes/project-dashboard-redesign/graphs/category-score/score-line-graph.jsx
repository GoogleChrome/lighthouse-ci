import clsx from 'clsx';
import * as d3 from 'd3';
import * as _ from '@lhci/utils/src/lodash.js';

import {createRootSvg} from '../../../../components/d3-graph';
import {GRAPH_MARGIN, getClassNameFromStatistic} from './category-score-graph';
import {HOVER_CARD_MARGIN} from '../hover-card';

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
 * @typedef ScoreGraphData
 * @prop {Array<StatisticWithBuild>} statistics
 * @prop {Array<StatisticWithBuild>} statisticsWithMinMax
 * @prop {import('preact/hooks/src').StateUpdater<string|undefined>} setSelectedBuildId
 * @prop {import('preact/hooks/src').StateUpdater<boolean>} setPinned
 */
/**
 * @param {HTMLElement} rootEl
 * @param {ScoreGraphData} data
 */
export function renderScoreGraph(rootEl, data) {
  const {statistics, statisticsWithMinMax, setSelectedBuildId, setPinned} = data;
  const rootParentEl = rootEl.closest('.category-score-graph');
  if (!(rootParentEl instanceof HTMLElement)) throw new Error('Missing category-score-graph');
  const getTrackingLineEl = () => {
    const trackingLineEl = rootParentEl.querySelector('.tracking-line');
    if (!(trackingLineEl instanceof SVGElement)) throw new Error('Missing tracking line!');
    return trackingLineEl;
  };
  const {svg, masks, width, graphWidth, graphHeight} = createRootSvg(rootEl, GRAPH_MARGIN);
  const minMaxByBuild = buildMinMaxByBuildId(statisticsWithMinMax);
  const n = statistics.length - 1;
  const statName = statistics[0].name;
  const scoreLineMaskId = `scoreLineMask-${statName}`;
  const debouncedClearBuildId = _.debounce(() => setSelectedBuildId(undefined), 250);
  /** @type {[number, number][]} */
  const passingGuideLine = [[0, 90], [n, 90]];
  /** @type {[number, number][]} */
  const failingGuideLine = [[0, 50], [n, 50]];
  const xScale = d3
    .scaleLinear()
    .domain([0, n])
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
    .attr('x1', xScale(0))
    .attr('y1', yScale(0))
    .attr('x2', xScale(0))
    .attr('y2', yScale(100));
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
  // The click and mouseover hitboxes for the score points
  svg
    .selectAll('.score-point__hitbox')
    .data(statistics)
    .enter()
    .append('rect')
    .attr('class', 'score-point__hitbox')
    .attr('x', (d, i) => xScale(i) - graphWidth / n / 2)
    .attr('y', yScale(100))
    .attr('width', graphWidth / n)
    .attr('height', yScale(0) - yScale(100))
    .on('click', () => {
      setPinned(current => {
        const next = !current;
        if (!next) debouncedClearBuildId();
        return next;
      });
    })
    .on('mouseover', (d, i) => {
      debouncedClearBuildId.cancel();
      if (rootParentEl.querySelector('.hover-card--pinned')) return;
      // Set the selected build
      setSelectedBuildId(d.buildId);
      // Update the position of the tracking line
      getTrackingLineEl().setAttribute('style', `transform: translateX(${xScale(i)}px)`);
      const hoverCard = rootParentEl.querySelector('.hover-card');
      if (!(hoverCard instanceof HTMLElement)) return;
      // Update the position of the hover card
      const leftPx = xScale(i) + HOVER_CARD_MARGIN;
      if (leftPx + 200 < graphWidth) {
        hoverCard.style.left = leftPx + 'px';
        hoverCard.style.right = '';
      } else {
        const rightPx =
          graphWidth - (leftPx - HOVER_CARD_MARGIN) + GRAPH_MARGIN.right + HOVER_CARD_MARGIN;
        hoverCard.style.left = '';
        hoverCard.style.right = rightPx + 'px';
      }
    })
    .on('mouseout', () => {
      if (rootParentEl.querySelector('.hover-card--pinned')) return;
      debouncedClearBuildId();
    });
}

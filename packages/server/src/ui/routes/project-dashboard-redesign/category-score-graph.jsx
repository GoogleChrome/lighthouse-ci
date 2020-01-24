/**
 * @license Copyright 2020 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h, Fragment} from 'preact';
import * as d3 from 'd3';
import * as _ from '@lhci/utils/src/lodash.js';

import './category-score-graph.css';
import {useRef, useEffect, useState} from 'preact/hooks';
import clsx from 'clsx';
import {Gauge} from '../../components/gauge';
import {ScoreDeltaBadge} from '../../components/score-delta-badge';
import {LhrViewerLink} from '../../components/lhr-viewer-link';
import {api} from '../../hooks/use-api-data';

const GRAPH_MARGIN = 10;
const GRAPH_MARGIN_RIGHT = 50;
const DELTA_GRAPH_MIN = -50;
const DELTA_GRAPH_MAX = 50;
const HOVER_CARD_MARGIN = 100;

/** @typedef {import('./project-graphs-redesign.jsx').StatisticWithBuild} StatisticWithBuild */

/** @param {Pick<StatisticWithBuild, 'value'>} statistic */
function getClassNameFromStatistic(statistic) {
  if (statistic.value >= 0.9) return 'score--pass';
  if (statistic.value < 0.5) return 'score--fail';
  return 'score--average';
}

/**
 * This function takes the score statistics and creates line segments that can be individually colored
 * based on their score. This is not currently used, but is an interesting alternative to masking.
 * TODO: remove this if we end up deciding against it
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
  const svgRoot = d3
    .select(rootEl)
    .append('svg')
    .attr('width', width)
    .attr('height', height);

  return {
    width,
    height,
    graphWidth,
    graphHeight,
    masks: svgRoot.append('defs'),
    svg: svgRoot
      .append('g')
      .attr('style', `transform: translate(${GRAPH_MARGIN}px, ${GRAPH_MARGIN}px)`),
  };
}

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
 *
 * @param {HTMLElement} rootEl
 * @param {Array<StatisticWithBuild>} statistics
 * @param {Array<StatisticWithBuild>} statisticsWithMinMax
 * @param {import('preact/hooks/src').StateUpdater<string|undefined>} setSelectedBuildId
 * @param {import('preact/hooks/src').StateUpdater<boolean>} setPinned
 */
function renderScoreGraph(rootEl, statistics, statisticsWithMinMax, setSelectedBuildId, setPinned) {
  const rootParentEl = rootEl.closest('.category-score-graph');
  if (!(rootParentEl instanceof HTMLElement)) throw new Error('Missing category-score-graph');
  const getTrackingLineEl = () => {
    const trackingLineEl = rootParentEl.querySelector('.tracking-line');
    if (!(trackingLineEl instanceof SVGElement)) throw new Error('Missing tracking line!');
    return trackingLineEl;
  };

  d3.select(rootEl)
    .selectAll('*')
    .remove();
  const {svg, masks, width, graphWidth, graphHeight} = createRootSvg(rootEl);
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
    .attr('style', `transform: translateX(${width - GRAPH_MARGIN_RIGHT / 2}px)`)
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
          graphWidth - (leftPx - HOVER_CARD_MARGIN) + GRAPH_MARGIN_RIGHT + HOVER_CARD_MARGIN;
        hoverCard.style.left = '';
        hoverCard.style.right = rightPx + 'px';
      }
    })
    .on('mouseout', () => {
      if (rootParentEl.querySelector('.hover-card--pinned')) return;
      debouncedClearBuildId();
    });
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

/** @param {{statistics: Array<StatisticWithBuild>, averageStatistics: Array<StatisticWithBuild>, setSelectedBuildId: import('preact/hooks/src').StateUpdater<string|undefined>, setPinned: import('preact/hooks/src').StateUpdater<boolean>}} props */
const ScoreGraph = props => {
  const graphElRef = useRef(/** @type {HTMLElement|undefined} */ (undefined));

  useEffect(() => {
    const rerender = () =>
      graphElRef.current &&
      renderScoreGraph(
        graphElRef.current,
        props.averageStatistics,
        props.statistics,
        props.setSelectedBuildId,
        props.setPinned
      );

    rerender();
    window.addEventListener('resize', rerender);
    return () => window.removeEventListener('resize', rerender);
  }, [props.statistics.length, props.averageStatistics.length]);

  return <div className="category-score-graph__score-graph" ref={graphElRef} />;
};

/** @param {{averageStatistics: Array<StatisticWithBuild>}} props */
const ScoreDeltaGraph = props => {
  const graphElRef = useRef(/** @type {HTMLElement|undefined} */ (undefined));

  useEffect(() => {
    const rerender = () =>
      graphElRef.current && renderScoreDeltaGraph(graphElRef.current, props.averageStatistics);

    rerender();
    window.addEventListener('resize', rerender);
    return () => window.removeEventListener('resize', rerender);
  }, [props.averageStatistics.length]);

  return <div className="category-score-graph__score-delta-graph" ref={graphElRef} />;
};

/** @param {{selectedBuildId: string|undefined, averageStatistics: Array<StatisticWithBuild>, pinned: boolean}} props */
const HoverCard = props => {
  const {selectedBuildId, averageStatistics: stats} = props;
  const statIndex = selectedBuildId ? stats.findIndex(s => s.buildId === selectedBuildId) : -1;
  const stat = statIndex !== -1 ? stats[statIndex] : undefined;

  let contents = <Fragment />;
  if (stat) {
    const previousStat = statIndex > 0 ? stats[statIndex - 1] : undefined;
    const createdAt = new Date(stat.build.createdAt || '');
    /** @type {LHCI.NumericAuditDiff|undefined} */
    const diff = previousStat && {
      type: 'score',
      auditId: '',
      baseValue: Math.round(previousStat.value * 100) / 100,
      compareValue: Math.round(stat.value * 100) / 100,
    };
    contents = (
      <Fragment>
        <div className="hover-card__datetime">
          <span className="hover-card__date">{createdAt.toLocaleDateString()}</span>
          <span className="hover-card__time">
            {createdAt.getHours()}:{createdAt.getMinutes()}
          </span>
        </div>
        <Gauge score={stat.value} diff={diff} />
        {diff ? <ScoreDeltaBadge diff={diff} /> : null}
        <div className="hover-card__actions">
          <a href="#">
            <LhrViewerLink
              lhr={async () => {
                const [run] = await api.getRuns(stat.build.projectId, stat.buildId, {
                  url: stat.url,
                  representative: true,
                });
                return JSON.parse(run.lhr);
              }}
            >
              Report
            </LhrViewerLink>
          </a>
          <a href={`./compare/${_.shortId(stat.build.id)}`}>CI Diff</a>
        </div>
      </Fragment>
    );
  }

  return (
    <div
      className={clsx('hover-card', {
        'hover-card--visible': !!props.selectedBuildId,
        'hover-card--pinned': !!props.pinned,
      })}
    >
      {contents}
    </div>
  );
};

/** @param {{category: 'performance'|'pwa'|'seo'|'accessibility', statistics: Array<StatisticWithBuild>}} props */
export const CategoryScoreGraph = props => {
  const [pinned, setPinned] = useState(false);
  const [selectedBuildId, setSelectedBuildId] = useState(
    /** @type {undefined|string} */ (undefined)
  );

  const id = `category-score-graph--${props.category}`;
  const allStats = props.statistics.filter(s => s.name.startsWith(`category_${props.category}`));
  const averageStats = allStats.filter(s => s.name.endsWith('_average'));

  // Unpin when the user clicks out of the graph
  useEffect(() => {
    /** @param {Event} e */
    const listener = e => {
      const target = e.target;
      if (!(target instanceof Element)) return;

      if (!target.closest(`#${id}`)) {
        setPinned(false);
        setSelectedBuildId(undefined);
      }
    };

    document.addEventListener('click', listener);
    return () => document.removeEventListener('click', listener);
  }, [setPinned]);

  if (!averageStats.length) return <span>No data available</span>;

  return (
    <div
      id={id}
      className={clsx('category-score-graph', {
        'category-score-graph--with-selected-build': !!selectedBuildId,
        'category-score-graph--pinned': !!pinned,
      })}
    >
      <h2>Overview</h2>
      <ScoreGraph
        statistics={allStats}
        averageStatistics={averageStats}
        setSelectedBuildId={setSelectedBuildId}
        setPinned={setPinned}
      />
      <ScoreDeltaGraph averageStatistics={averageStats} />
      <HoverCard
        pinned={pinned}
        selectedBuildId={selectedBuildId}
        averageStatistics={averageStats}
      />
      <div className="category-score-graph__date-range">
        <div style={{marginLeft: GRAPH_MARGIN}}>
          {new Date(averageStats[0].createdAt || '').toLocaleDateString()}
        </div>
        <div style={{flexGrow: 1}} />
        <div style={{marginRight: GRAPH_MARGIN_RIGHT}}>
          {new Date(averageStats[averageStats.length - 1].createdAt || '').toLocaleDateString()}
        </div>
      </div>
    </div>
  );
};

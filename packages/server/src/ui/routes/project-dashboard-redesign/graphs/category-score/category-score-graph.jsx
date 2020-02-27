/**
 * @license Copyright 2020 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h, Fragment} from 'preact';
import {useState} from 'preact/hooks';
import * as d3 from 'd3';
import * as _ from '@lhci/utils/src/lodash.js';

import './category-score-graph.css';
import clsx from 'clsx';
import {Gauge} from '../../../../components/gauge';
import {ScoreDeltaBadge} from '../../../../components/score-delta-badge';
import {D3Graph} from '../../../../components/d3-graph';
import {renderScoreDistributionGraph} from './score-distribution-graph';
import {renderScoreGraph, updateScoreGraph} from './score-line-graph';
import {renderScoreDeltaGraph} from './score-delta-bar-graph';
import {HoverCard} from '../hover-card';
import {computeStatisticRerenderKey, getClassNameFromStatistic} from '../graph-utils';

export const GRAPH_MARGIN = {top: 10, right: 50, bottom: 10, left: 10};

/** @typedef {import('../../project-category-summaries.jsx').StatisticWithBuild} StatisticWithBuild */

/** @param {{selectedBuildId: string|undefined, averageStatistics: Array<StatisticWithBuild>, pinned: boolean}} props */
const HoverCardWithDiff = props => {
  const {selectedBuildId, averageStatistics: stats} = props;
  const statIndex = selectedBuildId ? stats.findIndex(s => s.buildId === selectedBuildId) : -1;
  const stat = statIndex !== -1 ? stats[statIndex] : undefined;

  let children = <Fragment />;
  if (stat) {
    const previousStat = statIndex > 0 ? stats[statIndex - 1] : undefined;
    /** @type {LHCI.NumericAuditDiff|undefined} */
    const diff = previousStat && {
      type: 'score',
      auditId: '',
      baseValue: Math.round(previousStat.value * 100) / 100,
      compareValue: Math.round(stat.value * 100) / 100,
    };
    children = (
      <Fragment>
        <Gauge score={stat.value} diff={diff} />
        {diff ? <ScoreDeltaBadge diff={diff} /> : null}
      </Fragment>
    );
  }

  return (
    <HoverCard url={(stat && stat.url) || ''} build={stat && stat.build} pinned={props.pinned}>
      {children}
    </HoverCard>
  );
};

/** @param {{selectedBinIndex: number, binnedStatistics: Array<import('d3').Bin<StatisticWithBuild, number>>, pinned: boolean}} props */
const HoverCardWithDistribution = props => {
  const {selectedBinIndex, binnedStatistics: bins} = props;
  const bin = selectedBinIndex !== -1 ? bins[selectedBinIndex] : undefined;
  const statWithBuild = bin && bin[0];

  let children = <Fragment />;
  if (bin && bin.length) {
    const uniqueBuilds = _.uniqBy(bin, stat => stat.buildId);
    const ellipsisChild =
      uniqueBuilds.length > 5 ? (
        <div className="distribution-example">
          <span>...</span>
        </div>
      ) : null;
    children = (
      <Fragment>
        {uniqueBuilds.slice(0, 5).map(stat => (
          <div className="distribution-example" key={stat.id}>
            <span className={getClassNameFromStatistic(stat, 'text')}>
              {Math.round(stat.value * 100)}
            </span>
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
      hideActions
    >
      {children}
    </HoverCard>
  );
};

/** @param {{category: LH.CategoryResult, statistics: Array<StatisticWithBuild>, selectedBuildId: string|undefined, setSelectedBuildId: import('preact/hooks/src').StateUpdater<string|undefined>, pinned: boolean, setPinned: import('preact/hooks/src').StateUpdater<boolean>}} props */
export const CategoryScoreTimelineGraph = props => {
  const {selectedBuildId, setSelectedBuildId, pinned, setPinned} = props;

  const categoryId = props.category.id;
  const allStats = props.statistics.filter(s => s.name.startsWith(`category_${categoryId}`));
  const averageStats = allStats.filter(s => s.name.endsWith('_average'));

  if (!averageStats.length) return <span>No data available</span>;

  return (
    <div className={clsx('category-score-graph', 'graph-root-el')}>
      <h2>Overview</h2>
      <D3Graph
        className="category-score-graph__score-graph"
        data={{
          statistics: averageStats,
          statisticsWithMinMax: allStats,
          selectedBuildId: selectedBuildId,
          setSelectedBuildId: setSelectedBuildId,
          setPinned: setPinned,
        }}
        render={renderScoreGraph}
        computeRerenderKey={data => computeStatisticRerenderKey(data.statisticsWithMinMax)}
        update={updateScoreGraph}
        computeUpdateKey={data => `${data.selectedBuildId}`}
      />
      <D3Graph
        className="category-score-graph__score-delta-graph"
        data={averageStats}
        render={renderScoreDeltaGraph}
        computeRerenderKey={computeStatisticRerenderKey}
      />
      <HoverCardWithDiff
        pinned={pinned}
        selectedBuildId={selectedBuildId}
        averageStatistics={averageStats}
      />
      <div className="category-score-graph__x-axis">
        <div style={{marginLeft: GRAPH_MARGIN.left}}>
          {new Date(averageStats[0].build.createdAt || '').toLocaleDateString()}
        </div>
        <div style={{flexGrow: 1}} />
        <div style={{marginRight: GRAPH_MARGIN.right}}>
          {new Date(
            averageStats[averageStats.length - 1].build.createdAt || ''
          ).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
};

/** @param {{category: LH.CategoryResult, statistics: Array<StatisticWithBuild>, pinned: boolean, setPinned: import('preact/hooks/src').StateUpdater<boolean>}} props */
export const CategoryScoreDistributionGraph = props => {
  const [selectedBinIndex, setSelectedBinIndex] = useState(-1);
  const categoryId = props.category.id;
  const statistics = props.statistics.filter(s => s.name.startsWith(`category_${categoryId}`));

  if (!statistics.length) return <span>No data available</span>;

  /** @type {() => import('d3').HistogramGeneratorNumber<StatisticWithBuild, number>} */
  const statisticHistogram = d3.histogram;
  const binnedStatistics = statisticHistogram()
    .domain([0, 1])
    .value(stat => stat.value)
    .thresholds(50)(statistics);

  return (
    <div
      className={clsx(
        'category-score-graph',
        'category-score-graph--distribution',
        'graph-root-el'
      )}
    >
      <h2>Overview</h2>
      <D3Graph
        className="category-score-graph__score-graph"
        data={{
          statistics,
          binnedStatistics,
          selectedBinIndex: selectedBinIndex,
          setSelectedBinIndex: setSelectedBinIndex,
          setPinned: props.setPinned,
        }}
        render={renderScoreDistributionGraph}
        computeRerenderKey={data => computeStatisticRerenderKey(data.statistics)}
      />
      <HoverCardWithDistribution
        pinned={props.pinned}
        selectedBinIndex={selectedBinIndex}
        binnedStatistics={binnedStatistics}
      />
      <div className="category-score-graph__x-axis">
        <div style={{top: 0, bottom: 0, left: GRAPH_MARGIN.left, right: GRAPH_MARGIN.right}}>
          <div style={{left: '0%', transform: 'initial'}}>0</div>
          <div style={{left: '50%'}}>50</div>
          <div style={{left: '90%'}}>90</div>
          <div style={{right: 0, transform: 'initial'}}>100</div>
        </div>
      </div>
    </div>
  );
};

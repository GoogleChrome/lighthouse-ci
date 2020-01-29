/**
 * @license Copyright 2020 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h, Fragment} from 'preact';
import * as _ from '@lhci/utils/src/lodash.js';

import './category-score-graph.css';
import {useEffect, useState} from 'preact/hooks';
import clsx from 'clsx';
import {Gauge} from '../../../../components/gauge';
import {ScoreDeltaBadge} from '../../../../components/score-delta-badge';
import {D3Graph} from '../../../../components/d3-graph';
import {renderScoreGraph, updateScoreGraph} from './score-line-graph';
import {renderScoreDeltaGraph} from './score-delta-bar-graph';
import {HoverCard} from '../hover-card';
import {computeStatisticRerenderKey} from '../graph-utils';

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

/** @param {{category: LH.CategoryResult, statistics: Array<StatisticWithBuild>, selectedBuildId: string|undefined, setSelectedBuildId: import('preact/hooks/src').StateUpdater<string|undefined>}} props */
export const CategoryScoreGraph = props => {
  const [pinned, setPinned] = useState(false);
  const {selectedBuildId, setSelectedBuildId} = props;

  const categoryId = props.category.id;
  const id = `category-score-graph--${categoryId}`;
  const allStats = props.statistics.filter(s => s.name.startsWith(`category_${categoryId}`));
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
      <div className="category-score-graph__date-range">
        <div style={{marginLeft: GRAPH_MARGIN.left}}>
          {new Date(averageStats[0].createdAt || '').toLocaleDateString()}
        </div>
        <div style={{flexGrow: 1}} />
        <div style={{marginRight: GRAPH_MARGIN.right}}>
          {new Date(averageStats[averageStats.length - 1].createdAt || '').toLocaleDateString()}
        </div>
      </div>
    </div>
  );
};

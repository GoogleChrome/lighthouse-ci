/**
 * @license Copyright 2020 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h, Fragment} from 'preact';
import {useState} from 'preact/hooks';
import _ from '@lhci/utils/src/lodash.js';
import {AsyncLoader} from '../../components/async-loader';
import {Paper} from '../../components/paper.jsx';

import './category-card.css';
import {CategoryScoreGraph} from './graphs/category-score/category-score-graph';
import clsx from 'clsx';
import {MetricLineGraph} from './graphs/metric-line-graph';

/** @typedef {import('./project-category-summaries.jsx').StatisticWithBuild} StatisticWithBuild */
/** @typedef {{category: LH.CategoryResult, categoryGroups: LH.Result['categoryGroups'], statistics?: Array<StatisticWithBuild>, loadingState: import('../../components/async-loader').LoadingState, builds: LHCI.ServerCommand.Build[], buildLimit: number, setBuildLimit: (n: number) => void}} Props */
/** @typedef {Props & {statistics: Array<StatisticWithBuild>, selectedBuildId: string|undefined, setSelectedBuildId: import('preact/hooks/src').StateUpdater<string|undefined>}} PropsWithState */

const BUILD_LIMIT_OPTIONS = [{value: 25}, {value: 50}, {value: 100}, {value: 150, label: 'Max'}];

/** @param {PropsWithState} props */
const PerformanceCategoryDetails = props => {
  /** @param {LHCI.ServerCommand.Statistic['name']} name */
  const stats = name => props.statistics.filter(s => s.name === name);

  return (
    <div className="performance-category-details__graphs">
      <MetricLineGraph
        selectedBuildId={props.selectedBuildId}
        setSelectedBuildId={props.setSelectedBuildId}
        metrics={[
          {
            abbreviation: 'FCP',
            label: 'First Contentful Paint',
            statistics: stats('audit_first-contentful-paint_average'),
          },
          {
            abbreviation: 'TTI',
            label: 'Time to Interactive',
            statistics: stats('audit_interactive_average'),
          },
          {
            abbreviation: 'SI',
            label: 'Speed Index',
            statistics: stats('audit_speed-index_average'),
          },
        ]}
      />
      <MetricLineGraph
        selectedBuildId={props.selectedBuildId}
        setSelectedBuildId={props.setSelectedBuildId}
        metrics={[
          {
            abbreviation: 'FCP',
            label: 'First Contentful Paint',
            statistics: stats('audit_first-contentful-paint_average'),
          },
          {
            abbreviation: 'TTI',
            label: 'Time to Interactive',
            statistics: stats('audit_interactive_average').map(s => ({...s, value: s.value * 5})),
          },
          {
            abbreviation: 'SI',
            label: 'Speed Index',
            statistics: stats('audit_speed-index_average').map(s => ({...s, value: s.value * 1})),
          },
        ]}
      />
    </div>
  );
};

/** @param {PropsWithState} props */
const CategoryDetails = props => {
  if (props.category.id === 'performance') return <PerformanceCategoryDetails {...props} />;
  return <Fragment />;
};

/** @param {Props} props */
export const CategoryCard = props => {
  const [selectedBuildId, setSelectedBuildId] = useState(
    /** @type {undefined|string} */ (undefined)
  );

  return (
    <Paper className="category-card">
      <div className="category-card__header">
        <h3 className="category-card__title">{props.category.title}</h3>
        <div className="category-card__build-limit">
          {BUILD_LIMIT_OPTIONS.map(option => (
            <span
              key={option.value}
              className={clsx('build-limit-option', {
                'build-limit-option--selected': props.buildLimit === option.value,
              })}
              onClick={() => props.setBuildLimit(option.value)}
            >
              {option.label || option.value}
            </span>
          ))}
        </div>
      </div>
      <div className="category-card__body">
        <AsyncLoader
          loadingState={props.loadingState}
          asyncData={props.statistics}
          renderLoading={() => <span>Loading, please wait...</span>}
          render={allStats => (
            <Fragment>
              <CategoryScoreGraph
                {...props}
                statistics={allStats}
                selectedBuildId={selectedBuildId}
                setSelectedBuildId={setSelectedBuildId}
              />
              <CategoryDetails
                {...props}
                statistics={allStats}
                selectedBuildId={selectedBuildId}
                setSelectedBuildId={setSelectedBuildId}
              />
            </Fragment>
          )}
        />
      </div>
    </Paper>
  );
};

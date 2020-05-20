/**
 * @license Copyright 2020 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h} from 'preact';
import PRandom from '@lhci/utils/src/seed-data/prandom';
import {action} from '@storybook/addon-actions';
import {MetricLineGraph} from './metric-line-graph';

export default {
  title: 'Project Dashboard/Metric Line Graph',
  component: MetricLineGraph,
  parameters: {dimensions: 'auto', padding: 10},
};

const runAt = (deltaInDays = 0) =>
  new Date(
    new Date('2019-10-01T22:32:09.191Z').getTime() + deltaInDays * 24 * 60 * 60 * 1000
  ).toISOString();

/** @param {number} id @return {LHCI.ServerCommand.Build} */
const createBuild = id => ({
  id: id.toString(),
  projectId: '',
  externalBuildUrl: '',
  avatarUrl:
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==',
  lifecycle: 'sealed',
  hash: '',
  branch: 'master',
  runAt: runAt(id),
  createdAt: runAt(id),
  updatedAt: runAt(id),
});

/** @param {{id: number, value: number}} props @return {import('./metric-line-graph').StatisticWithBuild} */
const createStatistic = ({id, value}) => {
  const build = createBuild(id);
  return {
    id: id.toString(),
    projectId: build.projectId,
    buildId: build.id,
    url: 'http://example.com',
    name: 'audit_first-contentful-paint_median',
    value,
    version: 1,
    build,
    createdAt: runAt(id),
    updatedAt: runAt(id),
  };
};

/** @param {{id: number, min: number, max: number}} props */
const createStatistics = ({id, min, max}) => {
  /** @type {Array<import('./metric-line-graph').StatisticWithBuild>} */
  const stats = [];
  const prandom = new PRandom(id);
  for (let i = 0; i < 20; i++) {
    stats.push(createStatistic({id: id + i, value: prandom.next() * (max - min) + min}));
  }

  return stats;
};

const defaultProps = {
  metrics: [
    {
      label: 'First Contentful Paint',
      abbreviation: 'FCP',
      // prettier-ignore
      scoreLevels: /** @type {[number, number]} */ ([1000, 3000]),
      statistics: createStatistics({id: 1, min: 800, max: 5000}),
    },
    {
      label: 'Largest Contentful Paint',
      abbreviation: 'LCP',
      // prettier-ignore
      scoreLevels: /** @type {[number, number]} */ ([3000, 5000]),
      statistics: createStatistics({id: 1, min: 2000, max: 7000}),
    },
    {
      label: 'Time to Interactive',
      abbreviation: 'TTI',
      // prettier-ignore
      scoreLevels: /** @type {[number, number]} */ ([5000, 10000]),
      statistics: createStatistics({id: 1, min: 4000, max: 20000}),
    },
  ],
  selectedBuildId: undefined,
  pinned: false,
  selectedMetricIndex: -1,
  setSelectedBuildId: action('setSelectedBuildId'),
  setPinned: action('setPinned'),
  setSelectedMetricIndex: action('setSelectedMetricIndex'),
};

/** @param {{children: LHCI.PreactNode}} props */
const Wrapper = ({children}) => (
  <div className="category-card" style={{width: 600, background: 'white'}}>
    {children}
  </div>
);

export const Default = () => (
  <Wrapper>
    <MetricLineGraph {...defaultProps} />
  </Wrapper>
);

export const WithSelectedMetric = () => (
  <Wrapper>
    <MetricLineGraph
      {...defaultProps}
      __selectedMetricIndexForTest={2}
      selectedBuildId={defaultProps.metrics[0].statistics[5].buildId}
    />
  </Wrapper>
);

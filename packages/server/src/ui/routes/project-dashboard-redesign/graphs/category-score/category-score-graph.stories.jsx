/**
 * @license Copyright 2020 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h} from 'preact';
import {action} from '@storybook/addon-actions';
import {CategoryScoreGraph} from './category-score-graph';

export default {
  title: 'Project Dashboard/Category Score Graph',
  component: CategoryScoreGraph,
  parameters: {dimensions: 'auto', padding: 10},
};

/** @type {LH.CategoryResult} */
const category = {id: 'seo', title: 'SEO', description: '', score: 0, auditRefs: []};

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
});

/** @param {{id: number, min?: number, max?: number, avg: number}} props @return {Array<import('./category-score-graph').StatisticWithBuild>} */
const createStatistics = ({id, min, max, avg}) => {
  const build = createBuild(id);
  /** @type {import('./category-score-graph').StatisticWithBuild} */
  const stat = {
    id: id.toString(),
    projectId: build.projectId,
    buildId: build.id,
    url: 'http://example.com',
    name: `category_seo_min`,
    value: avg,
    version: 1,
    build,
    createdAt: runAt(id),
    updatedAt: runAt(id),
  };

  min = min || avg * 0.8;
  max = max || avg * 1.2;
  return [
    {...stat, value: min, name: 'category_seo_min'},
    {...stat, value: max, name: 'category_seo_max'},
    {...stat, value: avg, name: 'category_seo_average'},
  ];
};

/** @type {Array<import('./category-score-graph').StatisticWithBuild>} */
const statistics = [
  ...createStatistics({id: 1, avg: 0.5}),
  ...createStatistics({id: 2, avg: 0.6}),
  ...createStatistics({id: 3, avg: 0.55}),
  ...createStatistics({id: 4, avg: 0.95, max: 1}),
  ...createStatistics({id: 5, avg: 0.3}),
  ...createStatistics({id: 6, avg: 0.25}),
  ...createStatistics({id: 7, avg: 0.5, min: 0.3, max: 0.55}),
  ...createStatistics({id: 8, avg: 0.5}),
  ...createStatistics({id: 9, avg: 0.5, min: 0.1, max: 0.7}),
  ...createStatistics({id: 10, avg: 0.49}),
  ...createStatistics({id: 11, avg: 0.52}),
];

const defaultProps = {
  category,
  statistics,
  selectedBuildId: undefined,
  pinned: false,
  setSelectedBuildId: action('setSelectedBuildId'),
  setPinned: action('setPinned'),
};

/** @param {{children: LHCI.PreactNode}} props */
const Wrapper = ({children}) => (
  <div className="category-card" style={{width: 600, background: 'white'}}>
    {children}
  </div>
);

export const Default = () => (
  <Wrapper>
    <CategoryScoreGraph {...defaultProps} />
  </Wrapper>
);

export const DefaultWithHoverCard = () => (
  <Wrapper>
    <CategoryScoreGraph {...defaultProps} selectedBuildId={statistics[28].buildId} pinned={true} />
  </Wrapper>
);

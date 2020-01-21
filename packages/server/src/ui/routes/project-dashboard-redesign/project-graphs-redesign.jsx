/**
 * @license Copyright 2020 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h} from 'preact';
import {useMemo} from 'preact/hooks';
import _ from '@lhci/utils/src/lodash.js';
import {useBuildStatistics} from '../../hooks/use-api-data';

import './project-graphs-redesign.css';
import {CategoryGraphs} from './category-graphs';

/** @typedef {LHCI.ServerCommand.Statistic & {build: LHCI.ServerCommand.Build}} StatisticWithBuild */

/**
 * @param {LHCI.ServerCommand.Statistic[]|undefined} stats
 * @param {LHCI.ServerCommand.Build[]} builds
 * @return {Array<StatisticWithBuild>|undefined}
 */
const augmentStatsWithBuilds = (stats, builds) => {
  if (!stats) return undefined;

  return stats
    .map(stat => ({
      ...stat,
      build: builds.find(build => build.id === stat.buildId),
    }))
    .filter(/** @return {stat is StatisticWithBuild} */ stat => !!stat.build);
};

/** @param {{project: LHCI.ServerCommand.Project, builds: Array<LHCI.ServerCommand.Build>, runUrl?: string, branch?: string}} props */
export const ProjectGraphs = props => {
  const {project, builds, branch: overrideBranch} = props;
  const branch =
    overrideBranch ||
    (!builds.length || builds.some(build => build.branch === 'master')
      ? 'master'
      : builds[0].branch);
  const buildIds = useMemo(
    () =>
      builds
        .filter(build => build.branch === branch)
        .sort((a, b) => new Date(b.runAt).getTime() - new Date(a.runAt).getTime())
        .map(build => build.id)
        .slice(0, 20),
    [builds, branch]
  );
  const [loadingState, stats] = useBuildStatistics(project.id, buildIds);
  const statsWithBuildsUnfiltered = augmentStatsWithBuilds(stats, builds);
  const statsWithBuilds =
    statsWithBuildsUnfiltered &&
    statsWithBuildsUnfiltered
      .filter(stat => stat.build.branch === branch)
      .filter(stat => !props.runUrl || stat.url === props.runUrl);

  return (
    <div className="dashboard-graphs-redesign">
      <CategoryGraphs
        title="Performance"
        category="performance"
        loadingState={loadingState}
        statistics={statsWithBuilds}
        builds={builds}
      />
    </div>
  );
};

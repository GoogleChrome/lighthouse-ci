/**
 * @license Copyright 2020 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h} from 'preact';
import {useMemo, useState} from 'preact/hooks';
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
  const [buildLimit, setBuildLimit] = useState(25);
  const buildIds = useMemo(
    () =>
      builds
        .filter(build => build.branch === branch)
        .sort((a, b) => new Date(b.runAt).getTime() - new Date(a.runAt).getTime())
        .map(build => build.id)
        .slice(0, buildLimit),
    [builds, branch, buildLimit]
  );
  const [loadingState, stats] = useBuildStatistics(project.id, buildIds);
  const statsWithBuildsUnfiltered = augmentStatsWithBuilds(stats, builds);
  const statForBranch =
    statsWithBuildsUnfiltered && statsWithBuildsUnfiltered.find(s => s.build.branch);
  const url = props.runUrl || (statForBranch && statForBranch.url) || '';

  const statsWithBuilds =
    statsWithBuildsUnfiltered &&
    statsWithBuildsUnfiltered
      .filter(stat => stat.build.branch === branch)
      .filter(stat => stat.url === url);

  return (
    <div className="dashboard-graphs-redesign">
      <CategoryGraphs
        title="Performance"
        category="performance"
        loadingState={loadingState}
        statistics={statsWithBuilds}
        builds={builds}
        buildLimit={buildLimit}
        setBuildLimit={setBuildLimit}
      />
      <CategoryGraphs
        title="Accessibility"
        category="accessibility"
        loadingState={loadingState}
        statistics={statsWithBuilds}
        builds={builds}
        buildLimit={buildLimit}
        setBuildLimit={setBuildLimit}
      />
      <CategoryGraphs
        title="PWA"
        category="pwa"
        loadingState={loadingState}
        statistics={statsWithBuilds}
        builds={builds}
        buildLimit={buildLimit}
        setBuildLimit={setBuildLimit}
      />
      <CategoryGraphs
        title="SEO"
        category="seo"
        loadingState={loadingState}
        statistics={statsWithBuilds}
        builds={builds}
        buildLimit={buildLimit}
        setBuildLimit={setBuildLimit}
      />
    </div>
  );
};

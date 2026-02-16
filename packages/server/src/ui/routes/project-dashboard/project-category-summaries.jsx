/**
 * @license Copyright 2020 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h, Fragment} from 'preact';
import {useMemo, useState} from 'preact/hooks';
import _ from '@lhci/utils/src/lodash.js';
import {useBuildStatistics, useRepresentativeRun, useLhr} from '../../hooks/use-api-data';
import {aggregateStatistics, getGroupName} from '../../utils/url-grouping.js';

import './project-category-summaries.css';
import {CategoryCard} from './category-card';
import {AsyncLoader} from '../../components/async-loader';

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

/** @param {{builds: Array<LHCI.ServerCommand.Build>, statistics: Array<StatisticWithBuild>|undefined, statisticsLoadingState: import('../../hooks/use-api-data').LoadingState, run: LHCI.ServerCommand.Run|null, buildLimit: number, setBuildLimit: (n: number) => void, url: string}} props */
const ProjectCategorySummaries_ = props => {
  const lhr = useLhr(props.run);
  if (!lhr) {
    return <h1>No matching graph data available.</h1>;
  }

  return (
    <Fragment>
      {Object.values(lhr.categories).map(category => {
        return (
          <CategoryCard
            key={category.id}
            lhr={lhr}
            category={category}
            categoryGroups={lhr.categoryGroups}
            loadingState={props.statisticsLoadingState}
            statistics={props.statistics}
            builds={props.builds}
            buildLimit={props.buildLimit}
            setBuildLimit={props.setBuildLimit}
            url={props.url}
          />
        );
      })}
    </Fragment>
  );
};

/** @param {{project: LHCI.ServerCommand.Project, builds: Array<LHCI.ServerCommand.Build>, url: string, branch: string, viewMode?: 'grouped'|'individual', groupUrls?: string[]|null}} props */
export const ProjectCategorySummaries = props => {
  const {project, builds, branch, url, viewMode, groupUrls} = props;
  const [buildLimit, setBuildLimit] = useState(25);
  const buildIds = useMemo(
    () =>
      builds
        .filter(build => build.lifecycle === 'sealed')
        .filter(build => build.branch === branch)
        .sort((a, b) => new Date(b.runAt).getTime() - new Date(a.runAt).getTime())
        .map(build => build.id)
        .slice(0, buildLimit),
    [builds, branch, buildLimit]
  );

  // In grouped mode, use the shortest URL from the group for the representative run (LHR enumeration).
  // In individual mode, use the selected url as-is.
  const representativeUrl = useMemo(() => {
    if (viewMode === 'grouped' && groupUrls && groupUrls.length > 0) {
      return groupUrls.reduce((shortest, u) => (u.length < shortest.length ? u : shortest));
    }
    return url;
  }, [viewMode, groupUrls, url]);

  const [runLoadingState, run] = useRepresentativeRun(project.id, buildIds[0], representativeUrl);
  const [statLoadingState, stats] = useBuildStatistics(project.id, buildIds);
  const statsWithBuildsUnfiltered = augmentStatsWithBuilds(stats, builds);

  const statsWithBuilds = useMemo(() => {
    if (!statsWithBuildsUnfiltered) return undefined;

    const branchStats = statsWithBuildsUnfiltered.filter(stat => stat.build.branch === branch);

    if (viewMode === 'grouped' && groupUrls && groupUrls.length > 0) {
      // Aggregate statistics across all URLs in the group
      return aggregateStatistics(branchStats, getGroupName(url))
        .sort((a, b) => (a.build.runAt || '').localeCompare(b.build.runAt || ''));
    }

    // Individual mode: filter to the single selected URL
    return branchStats
      .filter(stat => stat.url === url)
      .sort((a, b) => (a.build.runAt || '').localeCompare(b.build.runAt || ''));
  }, [statsWithBuildsUnfiltered, branch, viewMode, groupUrls, url]);

  return (
    <div className="project-category-summaries">
      <AsyncLoader
        loadingState={runLoadingState}
        asyncData={run}
        render={run => (
          <ProjectCategorySummaries_
            run={run}
            url={representativeUrl}
            builds={builds}
            statistics={statsWithBuilds}
            statisticsLoadingState={statLoadingState}
            buildLimit={buildLimit}
            setBuildLimit={setBuildLimit}
          />
        )}
      />
    </div>
  );
};

/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h} from 'preact';
import {useMemo} from 'preact/hooks';
import {Link} from 'preact-router';
import _ from '../../../shared/lodash.js';
import {useProjectBuilds, useProject, useBuildStatistics} from '../../hooks/use-api-data';
import {AsyncLoader, combineLoadingStates, combineAsyncData} from '../../components/async-loader';
import {Paper} from '../../components/paper.jsx';
import {Plot} from '../../components/plot.jsx';
import {ProjectGettingStarted} from './getting-started.jsx';
import './project-dashboard.css';
import {Page} from '../../layout/page.jsx';

/** @typedef {LHCI.ServerCommand.Statistic & {build: LHCI.ServerCommand.Build}} StatisticWithBuild */

/** @param {Array<StatisticWithBuild>} stats */
const sortByMostRecentLast = stats =>
  stats.slice().sort((a, b) => a.build.runAt.localeCompare(b.build.runAt));

/** @param {{title: string, statisticName: LHCI.ServerCommand.StatisticName, statistics?: Array<StatisticWithBuild>, loadingState: import('../../components/async-loader').LoadingState, builds: LHCI.ServerCommand.Build[]}} props */
const StatisticPlot = props => {
  return (
    <AsyncLoader
      loadingState={props.loadingState}
      asyncData={props.statistics}
      render={allStats => {
        const statsUngrouped = allStats
          .filter(stat => stat.name === props.statisticName)
          .sort((a, b) => a.build.runAt.localeCompare(b.build.runAt));
        // We need to merge the stats by hash to handle multiple URLs.
        const stats = _.groupBy(statsUngrouped, stat => stat.build.hash).map(group => {
          const value = group.map(stat => stat.value).reduce((a, b) => a + b) / group.length;
          return {...group[0], value};
        });

        const xs = stats.map((_, i) => i);
        return (
          <Paper className="dashboard-graph">
            <h3 className="dashboard-graph__title">{props.title}</h3>
            <Plot
              useResizeHandler
              data={[
                {
                  x: xs,
                  y: stats.map(x => Math.round(x.value * 100)),
                  type: 'scatter',
                  mode: 'lines+markers',
                  marker: {color: '#4587f4'},
                  hoverinfo: /** @type {*} */ ('y'),
                },
              ]}
              layout={{
                height: 300,
                autosize: true,
                margin: {l: 40, r: 20, t: 20, b: 40},
                showlegend: false,
                spikedistance: -1,
                xaxis: {
                  tickfont: {color: '#888'},
                  tickvals: xs,
                  ticktext: stats.map(x => {
                    const build = props.builds.find(build => build.id === x.buildId);
                    if (!build) return 'Unknown';
                    return build.hash.slice(0, 8);
                  }),
                  showgrid: false,
                  fixedrange: true,
                  zeroline: false,
                  spikecolor: 'rgba(0, 0, 255, 0.3)',
                  spikethickness: 1,
                  spikemode: 'across+toaxis+marker',
                  // @ts-ignore - property not documented in tsc https://plot.ly/javascript/reference/#layout-xaxis-spikesnap
                  spikesnap: 'cursor',
                },
                yaxis: {
                  tickfont: {color: '#888'},
                  fixedrange: true,
                  range: [0, 100],
                  tickvals: _.range(0, 101, 20),
                  ticktext: _.range(0, 101, 20).map(x => x.toString()),
                  spikecolor: 'rgba(0, 0, 255, 0.3)',
                  spikethickness: 1,
                  spikemode: 'across+toaxis+marker',
                  // @ts-ignore - property not documented in tsc https://plot.ly/javascript/reference/#layout-xaxis-spikesnap
                  spikesnap: 'cursor',
                },
              }}
            />
          </Paper>
        );
      }}
    />
  );
};

/**
 * @typedef CategoryDiffBadgeProps
 * @prop {LHCI.ServerCommand.StatisticName} statisticName
 * @prop {Array<StatisticWithBuild>} stats
 */

/**
 * @param {CategoryDiffBadgeProps} props
 */
const CategoryDiffBadge = props => {
  const {statisticName, stats} = props;
  const [mostRecent, ...rest] = stats.filter(stat => stat.name === statisticName);
  let classification = 'neutral';
  let stringLabel = '0 pts';
  if (rest.length) {
    const diff = Math.round(
      100 * (mostRecent.value - rest.reduce((a, b) => a + b.value, 0) / rest.length)
    );

    classification = 'negative';
    stringLabel = `${diff} pt${diff === 1 ? '' : 's'}`;
    if (diff >= 0) {
      classification = 'positive';
      stringLabel = `+${stringLabel}`;
    }
  }

  return (
    <span className={`dashboard-summary__badge dashboard-summary__badge--${classification}`}>
      {stringLabel}
    </span>
  );
};

/** @param {{statsWithBuilds: Array<StatisticWithBuild>|undefined, loadingState: import('../../components/async-loader').LoadingState}} props */
const DashboardSummary = props => {
  return (
    <Paper className="dashboard-summary">
      <AsyncLoader
        loadingState={props.loadingState}
        asyncData={props.statsWithBuilds}
        render={unsortedStats => {
          const stats = sortByMostRecentLast(unsortedStats).reverse();
          const mostRecent = stats[0];
          const performance = (
            <CategoryDiffBadge statisticName="category_performance_average" stats={stats} />
          );
          const a11y = (
            <CategoryDiffBadge statisticName="category_accessibility_average" stats={stats} />
          );
          const seo = <CategoryDiffBadge statisticName="category_seo_average" stats={stats} />;
          const bestPractices = (
            <CategoryDiffBadge statisticName="category_best-practices_average" stats={stats} />
          );
          const pwa = <CategoryDiffBadge statisticName="category_pwa_average" stats={stats} />;

          return (
            <span>
              Compared to previous builds, the commit{' '}
              <span className="dashboard-summary__commit">{mostRecent.build.hash.slice(0, 8)}</span>{' '}
              on <span>{new Date(mostRecent.build.runAt).toLocaleString()}</span> scored{' '}
              {performance} for Performance, {a11y} for Accessibility, {seo} for SEO,{' '}
              {bestPractices} for Best Practices, and {pwa} for Progressive Web App.
            </span>
          );
        }}
      />
    </Paper>
  );
};

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
const ProjectDashboard_ = props => {
  const {project, builds} = props;
  const buildIds = useMemo(() => builds.map(build => build.id), builds);
  const [loadingState, stats] = useBuildStatistics(project.id, buildIds);
  const statsWithBuildsUnfiltered = augmentStatsWithBuilds(stats, builds);
  const statsWithBuilds =
    statsWithBuildsUnfiltered &&
    statsWithBuildsUnfiltered
      .filter(stat => !props.branch || stat.build.branch === props.branch)
      .filter(stat => !props.runUrl || stat.url === props.runUrl);

  return (
    <div className="dashboard">
      <div className="dashboard__header">
        <h2 className="dashboard__project-name">{project.name}</h2>
        <Paper className="dashboard__build-list">
          <table>
            {builds.slice(0, 3).map(build => {
              return (
                <tr key={build.id}>
                  <td>
                    <Link href={`/app/projects/${project.id}/builds/${build.id}`}>
                      {build.branch} ({build.hash.slice(0, 8)}){' '}
                    </Link>
                  </td>
                  <td>{new Date(build.runAt).toLocaleTimeString()}</td>
                </tr>
              );
            })}
          </table>
        </Paper>
        <DashboardSummary loadingState={loadingState} statsWithBuilds={statsWithBuilds} />
      </div>
      <div className="dashboard_graphs-container">
        <StatisticPlot
          title="Performance"
          statisticName="category_performance_average"
          loadingState={loadingState}
          statistics={statsWithBuilds}
          builds={builds}
        />
        <StatisticPlot
          title="PWA"
          statisticName="category_pwa_average"
          loadingState={loadingState}
          statistics={statsWithBuilds}
          builds={builds}
        />
        <StatisticPlot
          title="Accessibility"
          statisticName="category_accessibility_average"
          loadingState={loadingState}
          statistics={statsWithBuilds}
          builds={builds}
        />
        <StatisticPlot
          title="SEO"
          statisticName="category_seo_average"
          loadingState={loadingState}
          statistics={statsWithBuilds}
          builds={builds}
        />
      </div>
    </div>
  );
};

/** @param {{projectId: string, runUrl?: string, branch?: string}} props */
export const ProjectDashboard = props => {
  const projectApiData = useProject(props.projectId);
  const projectBuildData = useProjectBuilds(props.projectId);

  return (
    <Page>
      <AsyncLoader
        loadingState={combineLoadingStates(projectApiData, projectBuildData)}
        asyncData={combineAsyncData(projectApiData, projectBuildData)}
        render={([project, builds]) =>
          builds.length ? (
            <ProjectDashboard_ project={project} builds={builds} {...props} />
          ) : (
            <ProjectGettingStarted project={project} />
          )
        }
      />
    </Page>
  );
};

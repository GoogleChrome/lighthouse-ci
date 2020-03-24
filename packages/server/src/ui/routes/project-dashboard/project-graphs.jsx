/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h} from 'preact';
import {useMemo} from 'preact/hooks';
import _ from '@lhci/utils/src/lodash.js';
import {useBuildStatistics} from '../../hooks/use-api-data';
import {AsyncLoader} from '../../components/async-loader';
import {Paper} from '../../components/paper.jsx';
import {Plot} from '../../components/plot.jsx';

import './project-graphs.css';
import {Dropdown} from '../../components/dropdown';
import {route} from 'preact-router';
import {LoadingSpinner} from '../../components/loading-spinner';

const COLORS = [
  '#4587f4',
  '#f44587',
  '#87f445',
  '#9e7cef',
  '#d96dda',
  '#ff60ba',
  '#ff5f92',
  '#ff6f68',
  '#ff893d',
  '#ffa600',
];

/** @param {Array<StatisticWithBuild>} stats */
function computeURLsFromStats(stats) {
  return [...new Set(stats.map(stat => stat.url))].sort((a, b) => a.length - b.length);
}

/** @param {{statistics?: Array<StatisticWithBuild>, builds: Array<LHCI.ServerCommand.Build>, branch: string}} props */
const Legend = props => {
  if (!props.statistics) return null;

  const urls = computeURLsFromStats(props.statistics);
  const branches = Array.from(
    new Set(props.builds.map(build => build.branch).concat([props.branch]))
  );
  return (
    <div className="dashboard-graphs__legend">
      <div className="dashboard-graphs__legend-items">
        {urls.map((url, i) => {
          return (
            <div className="legend-item" key={url}>
              <div className="legend-item__color-chip" style={{backgroundColor: COLORS[i]}} />
              <span>{url}</span>
            </div>
          );
        })}
      </div>
      <Dropdown
        className="dashboard-graphs__branch-select"
        options={branches.map(branch => ({value: branch, label: branch}))}
        value={props.branch}
        setValue={value => {
          const url = new URL(window.location.href);
          url.searchParams.set('branch', value);
          route(`${url.pathname}${url.search}`);
        }}
      />
    </div>
  );
};

/** @typedef {LHCI.ServerCommand.Statistic & {build: LHCI.ServerCommand.Build}} StatisticWithBuild */

/** @param {{title: string, statisticName: LHCI.ServerCommand.StatisticName, statistics?: Array<StatisticWithBuild>, loadingState: import('../../components/async-loader').LoadingState, builds: LHCI.ServerCommand.Build[]}} props */
const StatisticPlot = props => {
  return (
    <AsyncLoader
      loadingState={props.loadingState}
      asyncData={props.statistics}
      renderLoading={() => (
        <Paper className="dashboard-graph">
          <LoadingSpinner />
        </Paper>
      )}
      render={allStats => {
        const noDataToDisplay = <Paper className="dashboard-graph">No data to display</Paper>;
        if (allStats.length === 0) {
          return noDataToDisplay;
        }

        const urls = computeURLsFromStats(allStats);
        const matchingStats = allStats
          .filter(stat => stat.name === props.statisticName)
          .sort((a, b) => a.build.runAt.localeCompare(b.build.runAt));
        // We need to merge the stats by hash to handle multiple URLs.
        const builds = _.uniqBy(matchingStats, stat => stat.build.hash).map(stat => stat.build);

        /** @type {Array<Array<StatisticWithBuild|null>>} */
        const ys = [];
        for (let i = 0; i < urls.length; i++) {
          /** @type {Array<StatisticWithBuild|null>} */
          const ysForUrl = [];
          const statsForUrl = matchingStats.filter(stat => stat.url === urls[i]);
          for (const build of builds) {
            ysForUrl.push(statsForUrl.find(stat => stat.buildId === build.id) || null);
          }
          ys.push(ysForUrl);
        }

        if (ys.length === 0) {
          return noDataToDisplay;
        }

        const xs = ys[0].map((_, i) => i);
        return (
          <Paper className="dashboard-graph">
            <h3 className="dashboard-graph__title">{props.title}</h3>
            <Plot
              className="dashboard-graph__plot"
              useResizeHandler
              onClick={({points}) => {
                const currentUrl = new URL(window.location.href);
                const x = points[0].x;
                const to = `${currentUrl.pathname}/compare/${_.shortId(builds[x].id)}`;
                route(to);
              }}
              data={ys.map((yVals, i) => ({
                x: xs.filter((_, i) => yVals[i]),
                y: yVals.filter(Boolean).map(stat => (stat ? Math.round(stat.value * 100) : 0)),
                type: 'scatter',
                mode: 'lines+markers',
                marker: {color: COLORS[i]},
                hoverinfo: /** @type {*} */ ('y'),
              }))}
              layout={{
                height: 300,
                autosize: true,
                margin: {l: 40, r: 20, t: 20, b: 40},
                showlegend: false,
                spikedistance: -1,
                xaxis: {
                  tickfont: {color: '#888'},
                  tickvals: xs,
                  ticktext: xs.map(() => ''), // force no ticktext
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
                  automargin: true,
                  side: 'right',
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
    (!builds.length || builds.some(build => build.branch === project.baseBranch)
      ? project.baseBranch
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
    <div className="dashboard-graphs">
      <Legend statistics={statsWithBuilds} builds={builds} branch={branch} />
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
  );
};

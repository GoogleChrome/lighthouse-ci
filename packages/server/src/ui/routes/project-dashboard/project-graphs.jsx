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

/** @typedef {LHCI.ServerCommand.Statistic & {build: LHCI.ServerCommand.Build}} StatisticWithBuild */

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
    <div className="dashboard-graphs">
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

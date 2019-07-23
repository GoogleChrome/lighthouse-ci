/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h} from 'preact';
import {useMemo} from 'preact/hooks';
import {useProjectBuilds, useProject, useBuildStatistics} from '../../hooks/use-api-data';
import {AsyncLoader, combineLoadingStates, combineAsyncData} from '../../components/async-loader';
import {Paper} from '../../components/paper.jsx';
import {Plot} from '../../components/plot.jsx';
import {ProjectGettingStarted} from './getting-started.jsx';
import './project-dashboard.css';

/** @param {{title: string, statisticName: LHCI.ServerCommand.StatisticName, statistics?: Array<LHCI.ServerCommand.Statistic>, loadingState: import('../../components/async-loader').LoadingState, builds: LHCI.ServerCommand.Build[]}} props */
const StatisticPlot = props => {
  return (
    <AsyncLoader
      loadingState={props.loadingState}
      asyncData={props.statistics}
      render={allStats => {
        const stats = allStats
          .filter(stat => stat.name === props.statisticName)
          .sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));

        const xs = stats.map((_, i) => i);
        return (
          <Paper className="dashboard-graph">
            <h3 className="dashboard-graph__title">{props.title}</h3>
            <Plot
              useResizeHandler
              data={[
                {
                  x: xs,
                  y: stats.map(x => x.value),
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

/** @param {{project: LHCI.ServerCommand.Project, builds: Array<LHCI.ServerCommand.Build>}} props */
const ProjectDashboard_ = props => {
  const {project, builds} = props;
  const buildIds = useMemo(() => builds.map(build => build.id), builds);
  const [loadingState, stats] = useBuildStatistics(project.id, buildIds);

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
                    <a href={build.externalBuildUrl}>
                      {build.branch} ({build.hash.slice(0, 8)}){' '}
                    </a>
                  </td>
                  <td>{new Date(build.createdAt || 0).toLocaleTimeString()}</td>
                </tr>
              );
            })}
          </table>
        </Paper>
        <Paper className="dashboard__summary">
          Compared to previous builds, the commit afd3591e on July 4 scored -18 pts for Performance,
          +11 pts for Accessibility, -5 pts for SEO, +2 pts for Best Practices, and -10 pts for
          Progressive Web App.
        </Paper>
      </div>
      <div className="dashboard_graphs-container">
        <StatisticPlot
          title="First Contentful Paint"
          statisticName="audit_first-contentful-paint_average"
          loadingState={loadingState}
          statistics={stats}
          builds={builds}
        />
        <StatisticPlot
          title="Time to Interactive"
          statisticName="audit_interactive_average"
          loadingState={loadingState}
          statistics={stats}
          builds={builds}
        />
        <StatisticPlot
          title="Speed Index"
          statisticName="audit_speed-index_average"
          loadingState={loadingState}
          statistics={stats}
          builds={builds}
        />
      </div>
    </div>
  );
};

/** @param {{projectId: string}} props */
export const ProjectDashboard = props => {
  const projectApiData = useProject(props.projectId);
  const projectBuildData = useProjectBuilds(props.projectId);

  return (
    <AsyncLoader
      loadingState={combineLoadingStates(projectApiData, projectBuildData)}
      asyncData={combineAsyncData(projectApiData, projectBuildData)}
      render={([project, builds]) =>
        builds.length ? (
          <ProjectDashboard_ project={project} builds={builds} />
        ) : (
          <ProjectGettingStarted project={project} />
        )
      }
    />
  );
};

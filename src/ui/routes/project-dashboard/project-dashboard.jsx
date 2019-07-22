/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h} from 'preact';
import {useProjectBuilds, useProject} from '../../hooks/use-api-data';
import {AsyncLoader, combineLoadingStates, combineAsyncData} from '../../components/async-loader';
import {Paper} from '../../components/paper.jsx';
import {ProjectGettingStarted} from './getting-started.jsx';
import './project-dashboard.css';

/** @param {{project: LHCI.ServerCommand.Project, builds: Array<LHCI.ServerCommand.Build>}} props */
const ProjectDashboard_ = props => {
  const {project, builds} = props;

  return (
    <div className="dashboard">
      <div className="dashboard__header">
        <h2 className="dashboard__project-name">{project.name}</h2>
        <Paper className="dashboard__build-list">
          <h2>Latest Builds</h2>
          <table>
            {builds.map(build => {
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
          Compared to the previous commit, the commit afd3591e on July 4 scored -18 pts for
          Performance, +11 pts for Accessibility, -5 pts for SEO, +2 pts for Best Practices, and -10
          pts for Progressive Web App.
        </Paper>
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

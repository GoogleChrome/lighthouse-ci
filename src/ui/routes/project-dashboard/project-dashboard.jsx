/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h} from 'preact';
import {useProjectBuilds, useProject} from '../../hooks/use-api-data';
import {AsyncLoader, combineLoadingStates, combineAsyncData} from '../../components/async-loader';
import {ProjectGettingStarted} from './getting-started.jsx';

/** @param {{project: LHCI.ServerCommand.Project, builds: Array<LHCI.ServerCommand.Build>}} props */
const ProjectDashboard_ = props => {
  const {project, builds} = props;

  return (
    <div>
      <h1>{project.name}</h1>

      <h3>Recent Builds</h3>
      <table>
        {builds.map(build => {
          return (
            <tr key={build.id}>
              <td>
                <a href={build.externalBuildUrl}>
                  {build.branch} ({build.hash.slice(0, 8)}){' '}
                </a>
              </td>
              <td>{build.createdAt}</td>
            </tr>
          );
        })}
      </table>
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

/**
 * @license Copyright 2020 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h} from 'preact';
import _ from '@lhci/utils/src/lodash.js';
import {useProjectBuilds, useProjectBySlug} from '../../hooks/use-api-data';
import {AsyncLoader, combineLoadingStates, combineAsyncData} from '../../components/async-loader';
import {Page} from '../../layout/page.jsx';
import {ProjectGraphs} from './project-graphs-redesign.jsx';

import './project-dashboard.css';

/** @param {{project: LHCI.ServerCommand.Project, builds: Array<LHCI.ServerCommand.Build>, runUrl?: string, branch?: string}} props */
const ProjectDashboard_ = props => {
  return (
    <div className="dashboard-redesign">
      <ProjectGraphs {...props} />
    </div>
  );
};

/** @param {{projectSlug: string, runUrl?: string, branch?: string}} props */
export const ProjectDashboard = props => {
  const projectApiData = useProjectBySlug(props.projectSlug);
  const projectId = projectApiData[1] && projectApiData[1].id;
  const projectBuildData = useProjectBuilds(projectId);

  return (
    <Page>
      <AsyncLoader
        loadingState={combineLoadingStates(projectApiData, projectBuildData)}
        asyncData={combineAsyncData(projectApiData, projectBuildData)}
        render={([project, builds]) =>
          builds.length ? (
            <ProjectDashboard_ project={project} builds={builds} {...props} />
          ) : (
            <span>No Data Yet!</span>
          )
        }
      />
    </Page>
  );
};

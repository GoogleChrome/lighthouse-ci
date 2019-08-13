/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h} from 'preact';
import {AsyncLoader, combineLoadingStates, combineAsyncData} from '../../components/async-loader';
import {useProject, useBuild, useOptionalAncestorBuild} from '../../hooks/use-api-data';

/** @param {{project: LHCI.ServerCommand.Project, build: LHCI.ServerCommand.Build, ancestorBuild: LHCI.ServerCommand.Build | null}} props */
const BuildView_ = ({project, build, ancestorBuild}) => {
  return <pre>{JSON.stringify({project, build, ancestorBuild}, null, 2)}</pre>;
};

/** @param {{projectId: string, buildId: string}} props */
export const BuildView = props => {
  const projectLoadingData = useProject(props.projectId);
  const buildLoadingData = useBuild(props.projectId, props.buildId);
  const ancestorBuildData = useOptionalAncestorBuild(props.projectId, buildLoadingData[1]);

  return (
    <AsyncLoader
      loadingState={combineLoadingStates(projectLoadingData, buildLoadingData, ancestorBuildData)}
      asyncData={combineAsyncData(projectLoadingData, buildLoadingData, ancestorBuildData)}
      render={([project, build, ancestorBuild]) => (
        <BuildView_ project={project} build={build} ancestorBuild={ancestorBuild} />
      )}
    />
  );
};

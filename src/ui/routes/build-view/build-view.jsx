/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h, Fragment} from 'preact';
import {AsyncLoader, combineLoadingStates, combineAsyncData} from '../../components/async-loader';
import {
  useProject,
  useBuild,
  useOptionalAncestorBuild,
  useBuildURLs,
  useOptionalBuildRepresentativeRuns,
} from '../../hooks/use-api-data';
import {PageHeaderPortal} from '../../layout/page-header';

/** @param {{project: LHCI.ServerCommand.Project, build: LHCI.ServerCommand.Build, ancestorBuild: LHCI.ServerCommand.Build | null, buildUrls: Array<{url: string}>, runs: Array<LHCI.ServerCommand.Run>}} props */
const BuildView_ = props => {
  return (
    <Fragment>
      <PageHeaderPortal>
        <h1>{props.build.commitMessage}</h1>
      </PageHeaderPortal>
      <pre>{JSON.stringify(props, null, 2)}</pre>
    </Fragment>
  );
};

/** @param {{projectId: string, buildId: string, baseHash?: string}} props */
export const BuildView = props => {
  const projectLoadingData = useProject(props.projectId);
  const buildLoadingData = useBuild(props.projectId, props.buildId);
  const buildUrlsData = useBuildURLs(props.projectId, props.buildId);

  const ancestorHashOptions = props.baseHash ? {ancestorHash: props.baseHash} : buildLoadingData[1];
  const selectedBuildUrl =
    buildUrlsData[1] && (buildUrlsData[1].length ? buildUrlsData[1][0].url : null);

  const ancestorBuildData = useOptionalAncestorBuild(props.projectId, ancestorHashOptions);
  const runData = useOptionalBuildRepresentativeRuns(
    props.projectId,
    props.buildId,
    selectedBuildUrl
  );

  return (
    <AsyncLoader
      loadingState={combineLoadingStates(
        projectLoadingData,
        buildLoadingData,
        ancestorBuildData,
        buildUrlsData,
        runData
      )}
      asyncData={combineAsyncData(
        projectLoadingData,
        buildLoadingData,
        ancestorBuildData,
        buildUrlsData,
        runData
      )}
      render={([project, build, ancestorBuild, buildUrls, runs]) => (
        <BuildView_
          project={project}
          build={build}
          ancestorBuild={ancestorBuild}
          buildUrls={buildUrls}
          runs={runs}
        />
      )}
    />
  );
};

/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h} from 'preact';
import './build-hash-selector.css';
import {useBranchBuilds} from '../../hooks/use-api-data';
import {AsyncLoader, combineLoadingStates, combineAsyncData} from '../../components/async-loader';

/**
 * @param {{build: LHCI.ServerCommand.Build, ancestorBuild?: LHCI.ServerCommand.Build | null, selector: 'base'|'compare'}} props
 */
export const BuildHashSelector = props => {
  const branchLoadingData = useBranchBuilds(props.build.projectId, props.build.branch);
  const baseLoadingData = useBranchBuilds(props.build.projectId, 'master');
  return (
    <div className="build-hash-selector">
      <AsyncLoader
        loadingState={combineLoadingStates(branchLoadingData, baseLoadingData)}
        asyncData={combineAsyncData(branchLoadingData, baseLoadingData)}
        render={([branchBuilds, baseBuilds]) => (
          <pre>{JSON.stringify({branchBuilds, baseBuilds}, null, 2)}</pre>
        )}
      />
    </div>
  );
};

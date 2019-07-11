/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h} from 'preact';
import {useProjectBuilds} from '../../hooks/use-api-data';
import {AsyncLoader} from '../../components/async-loader';

/** @param {{projectId: string}} props */
export const ProjectDashboard = props => {
  const [loadingState, builds] = useProjectBuilds(props.projectId);

  return (
    <AsyncLoader
      loadingState={loadingState}
      asyncData={builds}
      render={builds => <pre>{JSON.stringify(builds, null, 2)}</pre>}
    />
  );
};

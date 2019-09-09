/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h} from 'preact';
import {useProjectList} from '../../hooks/use-api-data';
import {AsyncLoader} from '../../components/async-loader';
import {Link} from 'preact-router';
import {Page} from '../../layout/page';

/** @param {{projects: Array<LHCI.ServerCommand.Project>}} props */
const ProjectList_ = ({projects}) => {
  if (!projects.length) {
    return <span>No projects yet, create one by running `lhci wizard`</span>;
  }

  return (
    <ul>
      {projects.map(project => (
        <li key={project.id}>
          <Link href={`/app/projects/${project.id}`}>
            {project.name} ({project.externalUrl})
          </Link>
        </li>
      ))}
    </ul>
  );
};

export const ProjectList = () => {
  const [loadingState, projects] = useProjectList();

  return (
    <Page>
      <AsyncLoader
        loadingState={loadingState}
        asyncData={projects}
        render={projects => <ProjectList_ projects={projects} />}
      />
    </Page>
  );
};

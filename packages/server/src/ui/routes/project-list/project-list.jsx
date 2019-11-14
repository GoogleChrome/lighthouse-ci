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
import {DocumentTitle} from '../../components/document-title';
import './project-list.css';
import {Paper} from '../../components/paper';

// @ts-ignore - tsc doesn't get parcel :)
const LH_LOGO_PATH = require('../../logo.svg');
// @ts-ignore - tsc doesn't get parcel :)
const CONFETTI_PATH = require('./confetti.svg');

const NoProjects = () => {
  return (
    <Paper className="no-projects">
      <img src={LH_LOGO_PATH} alt="Lighthouse CI Logo" />
      <h2>
        Welcome to Lighthouse CI! <br /> Run <pre>lhci wizard</pre> to setup your first project.
      </h2>
    </Paper>
  );
};

/** @param {{projects: Array<LHCI.ServerCommand.Project>}} props */
const ProjectList_ = ({projects}) => {
  if (!projects.length) {
    return <NoProjects />;
  }

  return (
    <Paper>
      <img src={LH_LOGO_PATH} alt="Lighthouse CI Logo" />
      <ul>
        {projects.map(project => (
          <li key={project.id}>
            <Link href={`/app/projects/${project.slug}`}>{project.name}</Link>
          </li>
        ))}
      </ul>
    </Paper>
  );
};

export const ProjectList = () => {
  const [loadingState, projects] = useProjectList();

  return (
    <Page>
      <DocumentTitle title="Projects" />
      <div className="project-list">
        <div className="project-list__confetti-background">
          <img src={CONFETTI_PATH} alt="Lighthouse CI background image" />
        </div>
        <AsyncLoader
          loadingState={loadingState}
          asyncData={projects}
          render={projects => <ProjectList_ projects={projects} />}
        />
      </div>
    </Page>
  );
};

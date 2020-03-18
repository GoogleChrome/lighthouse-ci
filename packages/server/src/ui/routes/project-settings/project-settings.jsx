/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h, Fragment} from 'preact';
import {useProjectBySlug, useAdminToken, api} from '../../hooks/use-api-data';
import {AsyncLoader} from '../../components/async-loader';
import {Page} from '../../layout/page';
import {DocumentTitle} from '../../components/document-title';
import './project-settings.css';
import {Paper} from '../../components/paper';
import {useState} from 'preact/hooks';
import {route} from 'preact-router';
import {LoadingSpinner} from '../../components/loading-spinner';

/** @param {{project: LHCI.ServerCommand.Project}} props */
const ProjectSettings_ = ({project}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [adminToken, setAdminToken] = useAdminToken(project.id);
  const [errorMessage, setErrorMessage] = useState('');

  if (isProcessing) {
    return <LoadingSpinner />;
  }

  return (
    <Fragment>
      {errorMessage ? <Paper className="text--fail">{errorMessage}</Paper> : null}
      <Paper>
        <h2>Administrative Settings</h2>
        <div className="text--secondary">{project.name}</div>
        <label className="form-item">
          <div className="text--smaller">Admin Token</div>
          <input
            placeholder="Paste admin token here"
            style={{minWidth: 250}}
            value={adminToken}
            onChange={e =>
              setAdminToken(e.target instanceof HTMLInputElement ? e.target.value : '')
            }
            type="text"
          />
        </label>
        <div className="form-item">
          <button
            type="button"
            disabled={!adminToken}
            onClick={() => {
              if (
                !confirm(
                  [
                    'Are you sure you want to permanently delete this project?',
                    'You will lose access to all builds, statistics, and Lighthouse report data.',
                    'This action CANNOT BE UNDONE.',
                  ].join(' ')
                )
              ) {
                return;
              }

              setIsProcessing(true);
              api.setAdminToken(adminToken);
              api
                .deleteProject(project.id)
                .then(() => route('/app/projects'))
                .catch(err => {
                  setErrorMessage(`Failed to delete project (${err.message})`);
                  setIsProcessing(false);
                });
            }}
          >
            Delete Project
          </button>
        </div>
      </Paper>
    </Fragment>
  );
};

/** @param {{projectSlug: string}} props */
export const ProjectSettings = props => {
  const [loadingState, project] = useProjectBySlug(props.projectSlug);

  return (
    <Page>
      <DocumentTitle title="Project Settings" />
      <div className="project-settings container">
        <AsyncLoader
          loadingState={loadingState}
          asyncData={project}
          render={project => <ProjectSettings_ project={project} />}
        />
      </div>
    </Page>
  );
};

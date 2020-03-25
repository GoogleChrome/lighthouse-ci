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
import {useState, useEffect} from 'preact/hooks';
import {route} from 'preact-router';
import {LoadingSpinner} from '../../components/loading-spinner';
import {usePreviousValue} from '../../hooks/use-previous-value';

/** @param {{project: LHCI.ServerCommand.Project}} props */
const ProjectSettings_ = ({project}) => {
  const previousProjectId = usePreviousValue(project.id);
  const [isProcessing, setIsProcessing] = useState(false);
  const [name, setName] = useState('');
  const [externalUrl, setExternalUrl] = useState('');
  const [baseBranch, setBaseBranch] = useState('');
  const [adminToken, saveAdminToken] = useAdminToken(project.id);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const clearMessages = () => {
    setSuccessMessage('');
    setErrorMessage('');
  };

  useEffect(() => {
    if (project.id === previousProjectId) return;
    setName(project.name);
    setExternalUrl(project.externalUrl);
    setBaseBranch(project.baseBranch);
  }, [project.id, previousProjectId]);

  if (isProcessing) {
    return <LoadingSpinner />;
  }

  /** @type {(setter: (s: string) => void) => (e: Event) => void} */
  const changeHandler = setter => e =>
    setter(e.target instanceof HTMLInputElement ? e.target.value : '');

  return (
    <Fragment>
      {successMessage ? <Paper>{successMessage}</Paper> : null}
      {errorMessage ? <Paper className="text--fail">{errorMessage}</Paper> : null}
      <Paper>
        <h2>Administrative Settings</h2>
        <label className="form-item">
          <div className="text--smaller">Project Name</div>
          <input
            placeholder="Project"
            style={{minWidth: 250}}
            value={name}
            onChange={changeHandler(setName)}
            type="text"
          />
        </label>
        <label className="form-item">
          <div className="text--smaller">External URL</div>
          <input
            placeholder="master"
            style={{minWidth: 250}}
            value={externalUrl}
            onChange={changeHandler(setExternalUrl)}
            type="text"
          />
        </label>
        <label className="form-item">
          <div className="text--smaller">Base Branch</div>
          <input
            placeholder="master"
            style={{minWidth: 250}}
            value={baseBranch}
            onChange={changeHandler(setBaseBranch)}
            type="text"
          />
        </label>
        <label className="form-item">
          <div className="text--smaller">Admin Token</div>
          <input
            placeholder="[REQUIRED] Paste admin token here"
            style={{minWidth: 250}}
            value={adminToken || ''}
            onChange={changeHandler(saveAdminToken)}
            type="text"
          />
        </label>
        <div className="form-item">
          <button
            type="button"
            disabled={!adminToken || !baseBranch}
            onClick={() => {
              clearMessages();
              setIsProcessing(true);

              api.setAdminToken(adminToken);
              api
                .updateProject({
                  id: project.id,
                  name,
                  externalUrl,
                  baseBranch,
                })
                .then(() => {
                  setSuccessMessage('Project updated successfully!');
                  setIsProcessing(false);
                })
                .catch(err => {
                  setErrorMessage(`Failed to save project (${err.message})`);
                  setIsProcessing(false);
                });
            }}
          >
            Save
          </button>
          <span className="h-spacer" />
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

              clearMessages();
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

/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h} from 'preact';
import {route} from 'preact-router';
import './page-header.css';
import {AsyncLoader} from '../components/async-loader';
import {useProjectList, useProjectURLs, useProjectBranches} from '../hooks/use-api-data';

/**
 * @template T
 * @typedef ToplevelSelectProps
 * @prop {string} label
 * @prop {T|undefined} value
 * @prop {T[]|undefined} options
 * @prop {import('../components/async-loader').LoadingState} loadingState
 * @prop {(entry: T) => string} createLabelFromOption
 * @prop {(entry: T) => void} onSelect
 */

/** @template T @param {ToplevelSelectProps<T>} props */
const ToplevelSelect = props => {
  return (
    <div className="page-header-picker">
      <span className="page-header-picker__label">{props.label}</span>
      <AsyncLoader
        loadingState={props.loadingState}
        asyncData={props.options}
        renderLoading={() => <span>Loading...</span>}
        render={options => {
          return (
            <select
              className="page-header-picker__select"
              value={(props.value && options.indexOf(props.value)) || 0}
              onChange={e => {
                const target = /** @type {*} */ (e.target);
                const option = options[target.value];
                props.onSelect(option);
              }}
            >
              {options.map((option, index) => (
                <option key={index} value={index}>
                  {props.createLabelFromOption(option)}
                </option>
              ))}
            </select>
          );
        }}
      />
    </div>
  );
};

/** @param {string} key @param {string} value */
const setQueryParamsAndNavigate = (key, value) => {
  const url = new URL(window.location.href);
  url.searchParams.set(key, value);
  route(`${url.pathname}${url.search}`);
};

/** @param {{matches: {projectId?: string, runUrl?: string, branch?: string}}} props */
export const PageHeader = props => {
  const projectsApiData = useProjectList();
  const selectedProject =
    props.matches.projectId && projectsApiData[1]
      ? projectsApiData[1].find(project => project.id === props.matches.projectId)
      : undefined;
  const urlsApiData = useProjectURLs(selectedProject && selectedProject.id);
  const branchesApiData = useProjectBranches(selectedProject && selectedProject.id);

  return (
    <div className="page-header">
      <div className="page-header__logo" />
      <ToplevelSelect
        label="Project"
        value={selectedProject}
        loadingState={projectsApiData[0]}
        options={projectsApiData[1]}
        createLabelFromOption={project => project.name}
        onSelect={project => route(`/app/projects/${project.id}`)}
      />
      <ToplevelSelect
        label="URL"
        value={props.matches.runUrl}
        loadingState={urlsApiData[0]}
        options={urlsApiData[1] && [undefined, ...urlsApiData[1].map(({url}) => url)]}
        createLabelFromOption={url => url || 'All'}
        onSelect={url => setQueryParamsAndNavigate('runUrl', url || '')}
      />
      <ToplevelSelect
        label="Branch"
        value={props.matches.branch}
        loadingState={branchesApiData[0]}
        options={branchesApiData[1] && [undefined, ...branchesApiData[1].map(({branch}) => branch)]}
        createLabelFromOption={branch => branch || 'All'}
        onSelect={branch => setQueryParamsAndNavigate('branch', branch || '')}
      />
    </div>
  );
};

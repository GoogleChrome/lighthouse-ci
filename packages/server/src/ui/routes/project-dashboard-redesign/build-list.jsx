/**
 * @license Copyright 2020 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h} from 'preact';
import {route} from 'preact-router';
import {useState} from 'preact/hooks';
import _ from '@lhci/utils/src/lodash.js';
import {Pill} from '../../components/pill';

import './build-list.css';
import {Paper} from '../../components/paper';

/** @param {{project: LHCI.ServerCommand.Project, builds: Array<LHCI.ServerCommand.Build>}} props */
const BuildList = props => {
  if (!props.builds.length) {
    return <div>No matching builds found.</div>;
  }

  return (
    <table className="build-list">
      {props.builds.map(build => {
        return (
          <tr
            key={build.id}
            onClick={evt => {
              const href = `/app/projects/${props.project.slug}/compare/${_.shortId(build.id)}`;

              // <tr> can't be within <a> but we still want to support ctrl+click to open in new tab
              if (evt.ctrlKey || evt.metaKey) return open(href, '_blank');
              route(href);
            }}
          >
            <td className="build-list__hash" data-tooltip={build.author}>
              <Pill avatar={build}>{build.hash.slice(0, 8)}</Pill>
            </td>
            <td className="build-list__commit">{build.commitMessage}</td>
            <td className="build-list__branch">
              <div className="flex-row">
                <i className="material-icons">call_split</i>
                {build.branch}
              </div>
            </td>
            <td className="build-list__date">
              {new Date(build.runAt).toDateString().replace(/\w+ (.*) \d{4}/, '$1')}{' '}
              {new Date(build.runAt).toLocaleTimeString().replace(/:\d{2} /, ' ')}
            </td>
          </tr>
        );
      })}
    </table>
  );
};

/** @param {{project: LHCI.ServerCommand.Project, builds: Array<LHCI.ServerCommand.Build>}} props */
export const ProjectBuildList = props => {
  const [currentPage, setCurrentPage] = useState(1);
  const [filterText, setFilterText] = useState('');

  const filteredBuilds = props.builds.filter(build => {
    if (build.branch.includes(filterText)) return true;
    if (build.commitMessage && build.commitMessage.includes(filterText)) return true;
    return false;
  });

  const pageSize = 5;
  const startIndex = (currentPage - 1) * pageSize;
  const maxPages = Math.max(Math.ceil(filteredBuilds.length / pageSize), 1);

  return (
    <Paper className="dashboard-build-list">
      <div className="dashboard-build-list__header">
        <h2>
          {props.project.name} Builds{' '}
          <span className="text--secondary text--smaller">
            {filterText ? `(${props.builds.length - filteredBuilds.length} filtered out)` : ''}
          </span>
        </h2>
        <div className="dashboard-build-list__filter">
          <label>
            Filter{' '}
            <input
              type="text"
              placeholder="find a build..."
              value={filterText}
              onKeyUp={e => {
                if (!(e.target instanceof HTMLInputElement)) return;
                setFilterText(e.target.value);
                setCurrentPage(1);
              }}
            />
          </label>
        </div>
        <div className="dashboard-build-list__pagination">
          <button
            className="material-icons"
            onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
          >
            chevron_left
          </button>
          <span>
            {currentPage} / {maxPages}
          </span>
          <button
            className="material-icons"
            onClick={() => setCurrentPage(p => Math.min(p + 1, maxPages))}
          >
            chevron_right
          </button>
        </div>
      </div>
      <BuildList
        project={props.project}
        builds={filteredBuilds.slice(startIndex, startIndex + pageSize)}
      />
    </Paper>
  );
};

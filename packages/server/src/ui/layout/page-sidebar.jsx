/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h} from 'preact';
import {Link} from 'preact-router';
import './page-sidebar.css';
import {AsyncLoader} from '../components/async-loader';
import {useProjectList, useVersion} from '../hooks/use-api-data';
import clsx from 'clsx';
import {useRouteParams} from '../hooks/use-route-params';

/** @param {{isOpen: boolean, setIsOpen: (value: boolean) => void}} props */
export const PageSidebar = props => {
  const {projectSlug} = useRouteParams();
  const [loadingState, projects] = useProjectList();
  const [_, version = ''] = useVersion();

  return (
    <div
      className={clsx('page-sidebar', {
        'page-sidebar--open': props.isOpen,
      })}
    >
      <div className="page-sidebar__header" onClick={() => props.setIsOpen(false)}>
        <div className="page-sidebar__logo" />
      </div>
      <div className="page-sidebar__content">
        <AsyncLoader
          loadingState={loadingState}
          asyncData={projects}
          render={projects => {
            return (
              <ul>
                {projects.map(project => (
                  <li className="page-sidebar__link" key={project.id}>
                    <Link
                      className={clsx({
                        active: project.slug === projectSlug,
                      })}
                      href={`/app/projects/${project.slug}`}
                      onClick={() => props.setIsOpen(false)}
                    >
                      {project.name}
                    </Link>
                    <Link
                      href={`/app/projects/${project.slug}/settings`}
                      onClick={() => props.setIsOpen(false)}
                    >
                      <i className="material-icons">settings</i>
                    </Link>
                  </li>
                ))}
              </ul>
            );
          }}
        />
      </div>
      <div className="page-sidebar__footer">
        <span className="page-sidebar__version">v{version}</span> |{' '}
        <a
          className="page-sidebar__issue-link"
          href={`https://github.com/GoogleChrome/lighthouse-ci/releases/tag/v${version}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Release Notes
        </a>
      </div>
    </div>
  );
};

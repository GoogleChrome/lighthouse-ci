/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h} from 'preact';
import {Link} from 'preact-router';
import './page-sidebar.css';
import {AsyncLoader} from '../components/async-loader';
import {useProjectList} from '../hooks/use-api-data';
import clsx from 'clsx';
import {useRouteParams} from '../hooks/use-route-params';

/** @param {{isOpen: boolean, setIsOpen: (value: boolean) => void}} props */
export const PageSidebar = props => {
  const {projectSlug} = useRouteParams();
  const [loadingState, projects] = useProjectList();

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
              <ul role="navigation">
                {projects.map(project => (
                  <li key={project.id}>
                    <Link
                      className={clsx({
                        active: project.slug === projectSlug,
                      })}
                      href={`/app/projects/${project.slug}`}
                      onClick={() => props.setIsOpen(false)}
                    >
                      {project.name}
                    </Link>
                  </li>
                ))}
              </ul>
            );
          }}
        />
      </div>
      <div className="page-sidebar__footer">
        <div className="page-sidebar__version">
          {/* This environment variable is set by npm/yarn on any script command. */}v
          {process.env.npm_package_version}
        </div>
      </div>
    </div>
  );
};

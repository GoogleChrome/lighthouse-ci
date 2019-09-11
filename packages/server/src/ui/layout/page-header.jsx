/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h, Fragment, VNode} from 'preact';
import clsx from 'clsx';
import './page-header.css';
import {useProject} from '../hooks/use-api-data';
import {Router, Link} from 'preact-router';

/** @param {{children?: Array<VNode> | VNode, setIsSidebarOpen: (isOpen: boolean) => void, matches: {projectId?: string}}} props */
const PageHeader_ = props => {
  const [_, selectedProject] = useProject(props.matches.projectId);

  return (
    <Fragment>
      <div className={clsx('page-header')}>
        <div className="page-header__left">
          <div
            className="page-header__sidebar-button"
            role="button"
            onClick={() => props.setIsSidebarOpen(true)}
          >
            <i className="material-icons">menu</i>
          </div>
          <div className="page-header__current-project">
            <Link href={selectedProject ? `/app/projects/${selectedProject.id}` : '#'}>
              {(selectedProject && selectedProject.name) || 'Lighthouse CI'}
            </Link>
          </div>
        </div>
        <div className="page-header__center">{props.children}</div>
        <div className="page-header__right">
          <span />
        </div>
      </div>
    </Fragment>
  );
};

/** @type {any} Router types do not work properly, so fallback to any. */
const PageHeaderNoTypes = PageHeader_;

/** @param {Omit<Parameters<typeof PageHeader_>[0], 'matches'>} props */
export const PageHeader = props => {
  return (
    <Router>
      <PageHeaderNoTypes
        path="/app/:slug?/:projectId?/:slugLevel2?/:idLevel2?"
        setIsSidebarOpen={props.setIsSidebarOpen}
      >
        {props.children}
      </PageHeaderNoTypes>
    </Router>
  );
};

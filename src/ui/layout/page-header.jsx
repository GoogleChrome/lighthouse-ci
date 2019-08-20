/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h, Fragment} from 'preact';
import {useState, useEffect} from 'preact/hooks';
import clsx from 'clsx';
import './page-header.css';
import {useProjectList} from '../hooks/use-api-data';
import {PageSidebar} from './page-sidebar';

/** @param {{matches: {projectId?: string, runUrl?: string, branch?: string}}} props */
export const PageHeader = props => {
  const [isOpen, setIsOpen] = useState(false);
  const projectsApiData = useProjectList();
  const selectedProject =
    props.matches.projectId && projectsApiData[1]
      ? projectsApiData[1].find(project => project.id === props.matches.projectId)
      : undefined;

  useEffect(() => {
    /** @param {MouseEvent} evt */
    const listener = evt => {
      if (
        !(evt.target instanceof HTMLElement) ||
        evt.target.closest('.page-sidebar') ||
        evt.target.closest('.page-header__sidebar-button')
      )
        return;
      setIsOpen(false);
    };

    document.addEventListener('click', listener);
    return () => document.removeEventListener('click', listener);
  }, [setIsOpen]);

  return (
    <Fragment>
      <div
        className={clsx('page-header', {
          'page-header--with-sidebar': isOpen,
        })}
      >
        <div
          className="page-header__sidebar-button"
          role="button"
          onClick={() => setIsOpen(!isOpen)}
        >
          <i className="material-icons">menu</i>
        </div>
        <div className="page-header__current-project">
          {(selectedProject && selectedProject.name) || 'Lighthouse CI'}
        </div>
      </div>
      {<PageSidebar isOpen={isOpen} setIsOpen={setIsOpen} projectId={props.matches.projectId} />}
    </Fragment>
  );
};

/** @param {{children: import('preact').VNode}} props */
export const PageHeaderPortal = props => {
  return <div className="page-body__header-portal">{props.children}</div>;
};

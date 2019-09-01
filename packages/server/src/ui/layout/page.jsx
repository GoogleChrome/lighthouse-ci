/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h, VNode, Fragment} from 'preact';
import {PageHeader} from './page-header.jsx';
import {PageSidebar} from './page-sidebar.jsx';
import {useState, useEffect} from 'preact/hooks';
import {PageBody} from './page-body.jsx';

/**
 * @param {{header?: Array<VNode> | VNode, children: VNode | Array<VNode>}} props
 */
export const Page = props => {
  const [isOpen, setIsOpen] = useState(false);

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
      <PageHeader setIsSidebarOpen={setIsOpen}>{props.header}</PageHeader>
      <PageSidebar isOpen={isOpen} setIsOpen={setIsOpen} />
      <PageBody>{props.children}</PageBody>
    </Fragment>
  );
};

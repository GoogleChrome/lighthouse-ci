/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h} from 'preact';
import clsx from 'clsx';
import './page-header.css';

/** @param {{children?: LHCI.PreactNode, childrenLeft?: LHCI.PreactNode, childrenRight?: LHCI.PreactNode, setIsSidebarOpen: (isOpen: boolean) => void}} props */
export const PageHeader = props => {
  return (
    <div className={clsx('page-header')}>
      <div className="page-header__left">
        {props.childrenLeft ? (
          props.childrenLeft
        ) : (
          <div
            className="page-header__sidebar-button"
            role="button"
            onClick={() => props.setIsSidebarOpen(true)}
          >
            <i className="material-icons">menu</i>
          </div>
        )}
      </div>
      <div className="page-header__center">{props.children}</div>
      <div
        className={clsx('page-header__right', {
          'page-header__right--with-content': !!props.childrenRight,
        })}
      >
        {props.childrenRight}
      </div>
    </div>
  );
};

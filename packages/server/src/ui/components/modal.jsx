/**
 * @license Copyright 2020 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h} from 'preact';
import {createPortal} from 'preact/compat';
import clsx from 'clsx';
import './modal.css';

const modalRoot = document.getElementById('preact-portal-modal');
if (!modalRoot) throw new Error('Missing #preact-portal-modal');

/** @param {{className?: string, children: LHCI.PreactNode, onClose: () => void}} props */
export const Modal = props => {
  return createPortal(
    <div className="modal-backdrop">
      <div className={clsx('modal', props.className)} style={{position: 'relative'}}>
        {props.children}
        <div className="modal__close" onClick={props.onClose}>
          <i className="material-icons">close</i>
        </div>
      </div>
    </div>,
    modalRoot
  );
};

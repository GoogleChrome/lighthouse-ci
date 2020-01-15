/**
 * @license Copyright 2020 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h} from 'preact';
import {createPortal, useRef, useEffect} from 'preact/compat';
import clsx from 'clsx';
import './modal.css';

/** @param {{className?: string, children: LHCI.PreactNode, onClose: () => void}} props */
export const Modal = props => {
  const modalRootRef = useRef(
    document.getElementById('preact-modal-root') || document.createElement('div')
  );

  useEffect(() => {
    modalRootRef.current.id = 'preact-modal-root';
    document.body.appendChild(modalRootRef.current);
    return () => document.body.removeChild(modalRootRef.current);
  }, []);

  return createPortal(
    <div className="modal-backdrop">
      <div className={clsx('modal', props.className)} style={{position: 'relative'}}>
        {props.children}
        <div className="modal__close" onClick={props.onClose}>
          <i className="material-icons">close</i>
        </div>
      </div>
    </div>,
    modalRootRef.current
  );
};

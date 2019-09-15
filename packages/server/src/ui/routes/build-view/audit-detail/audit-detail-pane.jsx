/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h} from 'preact';
import './audit-detail-pane.css';
import {usePreviousValue} from '../../../hooks/use-previous-value.jsx';
import {useEffect, useRef} from 'preact/hooks';
import {AuditDetail} from './audit-detail';

/**
 * @param {{selectedAuditId: string, setSelectedAuditId: (id: string|null) => void, pairs: Array<LHCI.AuditPair>, baseLhr?: LH.Result}} props
 */
export const AuditDetailPane = props => {
  /** @type {import('preact').Ref<HTMLElement|undefined>} */
  const paneElementRef = useRef(undefined);
  const previouslySelectedAuditId = usePreviousValue(props.selectedAuditId);

  // Scroll to the selected audit *when it changes*
  useEffect(() => {
    const auditId = props.selectedAuditId;
    const paneElement = paneElementRef.current;
    if (!paneElement || !auditId || auditId === previouslySelectedAuditId) return;

    const childElement = paneElement.querySelector(`#audit-detail-pane-audit--${auditId}`);
    if (!childElement || !(childElement instanceof HTMLElement)) return;

    paneElement.scrollTo(0, childElement.offsetTop);
  }, [props.selectedAuditId, previouslySelectedAuditId]);

  return (
    <div className="audit-detail-pane" ref={el => (paneElementRef.current = el)}>
      <div className="audit-detail-pane__close" onClick={() => props.setSelectedAuditId(null)}>
        x
      </div>
      {props.pairs.map(pair => {
        const {audit} = pair;
        if (!audit.id) return undefined;
        return <AuditDetail key={audit.id} pair={pair} />;
      })}
    </div>
  );
};

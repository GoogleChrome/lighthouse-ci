/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h} from 'preact';
import './audit-detail-pane.css';
import clsx from 'clsx';

/** @param {{audit: LH.AuditResult, selectedAuditId: string|null, key?: string}} props */
const Audit = props => {
  return (
    <div
      className={clsx('audit-detail-pane__audit', {
        'audit-detail-pane__audit--selected': props.selectedAuditId === props.audit.id,
      })}
    >
      <div className="audit-detail-pane__audit-title">{props.audit.title}</div>
      <div className="audit-detail-pane__audit-description">{props.audit.description}</div>
      <div className="audit-detail-pane__audit-details">{JSON.stringify(props.audit.details)}</div>
    </div>
  );
};

/**
 * @param {{selectedAuditId: string, setSelectedAuditId: (id: string|null) => void, lhr: LH.Result, baseLhr?: LH.Result}} props
 */
export const AuditDetailPane = props => {
  return (
    <div className="audit-detail-pane">
      <div className="audit-detail-pane__close" onClick={() => props.setSelectedAuditId(null)}>
        x
      </div>
      {Object.values(props.lhr.audits).map(audit => {
        return <Audit key={audit.id} audit={audit} selectedAuditId={props.selectedAuditId} />;
      })}
    </div>
  );
};

/**
 * @license Copyright 2020 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h} from 'preact';
import './score-delta-badge.css';
import {getDiffLabel} from '@lhci/utils/src/audit-diff-finder';
import clsx from 'clsx';

/** @param {{diff: LHCI.NumericAuditDiff, className?: string}} props */
export const ScoreDeltaBadge = props => {
  const delta = Math.round((props.diff.compareValue - props.diff.baseValue) * 100);
  return (
    <div
      className={clsx(
        'score-delta-badge',
        `score-delta-badge--${getDiffLabel(props.diff)}`,
        props.className
      )}
    >
      {delta < 0 ? delta : `+${delta}`}
    </div>
  );
};

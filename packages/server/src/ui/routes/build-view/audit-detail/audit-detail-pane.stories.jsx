/**
 * @license Copyright 2020 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h} from 'preact';
import {action} from '@storybook/addon-actions';
import {computeAuditGroups} from '../lhr-comparison';
import {AuditDetailPane} from './audit-detail-pane';
import lhrA_ from '../../../../../test/fixtures/lh-5-6-0-verge-a.json';
import lhrB_ from '../../../../../test/fixtures/lh-5-6-0-verge-b.json';

export default {
  title: 'Build View/Audit Detail Pane',
  component: AuditDetailPane,
  parameters: {dimensions: 'auto'},
};

const lhrA = /** @type {any} */ (lhrA_);
const lhrB = /** @type {any} */ (lhrB_);

/** @type {Array<LHCI.AuditPair>} */
const auditPairs = computeAuditGroups(lhrA, lhrB, {percentAbsoluteDeltaThreshold: 0.05})
  .filter(group => !group.showAsUnchanged)
  .map(group => group.pairs)
  .reduce((a, b) => a.concat(b))
  // We don't need *all* the audits, so sample ~1/3 of them.
  .filter((pair, i) => i % 2 === 0 && pair.audit.id !== 'uses-long-cache-ttl');

export const Default = () => (
  <AuditDetailPane
    selectedAuditId={auditPairs[0].audit.id || ''}
    setSelectedAuditId={action('setSelectedAuditId')}
    pairs={auditPairs}
    baseLhr={lhrB}
  />
);

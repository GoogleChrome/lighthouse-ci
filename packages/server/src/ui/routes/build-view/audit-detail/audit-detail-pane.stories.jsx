/**
 * @license Copyright 2020 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h} from 'preact';
import {action} from '@storybook/addon-actions';
import {computeAuditGroups} from '../lhr-comparison';
import {AuditDetailPane} from './audit-detail-pane';
import lhr5A_ from '../../../../../test/fixtures/lh-5-6-0-verge-a.json';
import lhr5B_ from '../../../../../test/fixtures/lh-5-6-0-verge-b.json';
import lhr6A_ from '../../../../../test/fixtures/lh-6-0-0-coursehero-a.json';
import lhr6B_ from '../../../../../test/fixtures/lh-6-0-0-coursehero-b.json';
import lhr62A_ from '../../../../../test/fixtures/lh-6-2-0-coursehero-a.json';
import lhr62B_ from '../../../../../test/fixtures/lh-6-2-0-coursehero-b.json';

export default {
  title: 'Build View/Audit Detail Pane',
  component: AuditDetailPane,
  parameters: {dimensions: 'auto'},
};

const lhr5A = /** @type {any} */ (lhr5A_);
const lhr5B = /** @type {any} */ (lhr5B_);
const lhr6A = /** @type {any} */ (lhr6A_);
const lhr6B = /** @type {any} */ (lhr6B_);
const lhr62A = /** @type {any} */ (lhr62A_);
const lhr62B = /** @type {any} */ (lhr62B_);

const auditPairs5 = createAuditPairs(lhr5A, lhr5B);
const auditPairs6 = createAuditPairs(lhr6A, lhr6B);
const auditPairs62 = createAuditPairs(lhr62A, lhr62B);

export const Default = () => (
  <AuditDetailPane
    selectedAuditId={auditPairs5[0].audit.id || ''}
    setSelectedAuditId={action('setSelectedAuditId')}
    pairs={auditPairs5}
    baseLhr={lhr5B}
  />
);

export const Version6 = () => (
  <AuditDetailPane
    selectedAuditId={auditPairs6[1].audit.id || ''}
    setSelectedAuditId={action('setSelectedAuditId')}
    pairs={auditPairs6}
    baseLhr={lhr6B}
  />
);

export const Version62 = () => (
  <AuditDetailPane
    selectedAuditId={auditPairs62[1].audit.id || ''}
    setSelectedAuditId={action('setSelectedAuditId')}
    pairs={auditPairs62}
    baseLhr={lhr62B}
  />
);

/**
 * @param {LH.Result} lhrA
 * @param {LH.Result} lhrB
 * @return {Array<LHCI.AuditPair>}
 */
function createAuditPairs(lhrA, lhrB) {
  return (
    computeAuditGroups(lhrA, lhrB, {percentAbsoluteDeltaThreshold: 0.05})
      .filter(group => !group.showAsUnchanged)
      .map(group => group.pairs)
      .reduce((a, b) => a.concat(b))
      // We don't need *all* the audits, so sample ~1/2 of them.
      .filter((pair, i) => i % 2 === 0 && pair.audit.id !== 'uses-long-cache-ttl')
  );
}

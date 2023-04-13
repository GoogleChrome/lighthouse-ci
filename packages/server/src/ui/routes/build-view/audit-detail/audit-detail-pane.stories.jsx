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
import lhr641A_ from '../../../../../test/fixtures/lh-6-4-1-coursehero-a.json';
import lhr641B_ from '../../../../../test/fixtures/lh-6-4-1-coursehero-b.json';
import lhr700A_ from '../../../../../test/fixtures/lh-7-0-0-coursehero-a.json';
import lhr700B_ from '../../../../../test/fixtures/lh-7-0-0-coursehero-b.json';
import lhr800A_ from '../../../../../test/fixtures/lh-8-0-0-coursehero-a.json';
import lhr800B_ from '../../../../../test/fixtures/lh-8-0-0-coursehero-b.json';
import lhr930A_ from '../../../../../test/fixtures/lh-9-3-0-coursehero-a.json';
import lhr930B_ from '../../../../../test/fixtures/lh-9-3-0-coursehero-b.json';
import lhr1010A_ from '../../../../../test/fixtures/lh-10-1-0-coursehero-a.json';
import lhr1010B_ from '../../../../../test/fixtures/lh-10-1-0-coursehero-b.json';
import lhrSubitemsA_ from '../../../../../test/fixtures/lh-subitems-a.json';
import lhrSubitemsB_ from '../../../../../test/fixtures/lh-subitems-b.json';
import lhrPsi800A_ from '../../../../../test/fixtures/psi-8-0-0-dkdev-a.json';
import lhrPsi800B_ from '../../../../../test/fixtures/psi-8-0-0-dkdev-b.json';

export default {
  title: 'Build View/Audit Detail Pane',
  component: AuditDetailPane,
};

const lhr5A = /** @type {any} */ (lhr5A_);
const lhr5B = /** @type {any} */ (lhr5B_);
const lhr6A = /** @type {any} */ (lhr6A_);
const lhr6B = /** @type {any} */ (lhr6B_);
const lhr62A = /** @type {any} */ (lhr62A_);
const lhr62B = /** @type {any} */ (lhr62B_);
const lhr641A = /** @type {any} */ (lhr641A_);
const lhr641B = /** @type {any} */ (lhr641B_);
const lhr700A = /** @type {any} */ (lhr700A_);
const lhr700B = /** @type {any} */ (lhr700B_);
const lhr800A = /** @type {any} */ (lhr800A_);
const lhr800B = /** @type {any} */ (lhr800B_);
const lhr930A = /** @type {any} */ (lhr930A_);
const lhr930B = /** @type {any} */ (lhr930B_);
const lhr1010A = /** @type {any} */ (lhr1010A_);
const lhr1010B = /** @type {any} */ (lhr1010B_);
const lhrSubitemsA = /** @type {any} */ (lhrSubitemsA_);
const lhrSubitemsB = /** @type {any} */ (lhrSubitemsB_);
const lhrPsi800A = /** @type {any} */ (lhrPsi800A_);
const lhrPsi800B = /** @type {any} */ (lhrPsi800B_);

const auditPairs5 = createAuditPairs(lhr5A, lhr5B);
const auditPairs6 = createAuditPairs(lhr6A, lhr6B);
const auditPairs62 = createAuditPairs(lhr62A, lhr62B);
const auditPairs641 = createAuditPairs(lhr641A, lhr641B);
const auditPairs700 = createAuditPairs(lhr700A, lhr700B);
const auditPairs800 = createAuditPairs(lhr800A, lhr800B);
const auditPairs930 = createAuditPairs(lhr930A, lhr930B);
const auditPairs1010 = createAuditPairs(lhr1010A, lhr1010B);
const auditPairsPsi800 = createAuditPairs(lhrPsi800A, lhrPsi800B);
const auditPairsSubitems = createAuditPairs(lhrSubitemsA, lhrSubitemsB, {
  filter: pair =>
    [
      'third-party-summary',
      'third-party-facades',
      'valid-source-maps',
      'unused-javascript',
      'legacy-javascript',
    ].includes(pair.audit.id || ''),
});

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

export const Version641 = () => (
  <AuditDetailPane
    selectedAuditId={auditPairs641[1].audit.id || ''}
    setSelectedAuditId={action('setSelectedAuditId')}
    pairs={auditPairs641}
    baseLhr={lhr641B}
  />
);

export const Version700 = () => (
  <AuditDetailPane
    selectedAuditId={auditPairs700[1].audit.id || ''}
    setSelectedAuditId={action('setSelectedAuditId')}
    pairs={auditPairs700}
    baseLhr={lhr700B}
  />
);

export const Version800 = () => (
  <AuditDetailPane
    selectedAuditId={auditPairs800[1].audit.id || ''}
    setSelectedAuditId={action('setSelectedAuditId')}
    pairs={auditPairs800}
    baseLhr={lhr800B}
  />
);

export const Version930 = () => (
  <AuditDetailPane
    selectedAuditId={auditPairs930[1].audit.id || ''}
    setSelectedAuditId={action('setSelectedAuditId')}
    pairs={auditPairs930}
    baseLhr={lhr930B}
  />
);

export const Version1010 = () => (
  <AuditDetailPane
    selectedAuditId={auditPairs1010[1].audit.id || ''}
    setSelectedAuditId={action('setSelectedAuditId')}
    pairs={auditPairs1010}
    baseLhr={lhr1010B}
  />
);

export const VersionPsi800 = () => (
  <AuditDetailPane
    selectedAuditId={auditPairsPsi800[1].audit.id || ''}
    setSelectedAuditId={action('setSelectedAuditId')}
    pairs={auditPairsPsi800}
    baseLhr={lhrPsi800B}
  />
);

export const VersionSubitems = () => (
  <AuditDetailPane
    selectedAuditId={auditPairsSubitems[1].audit.id || ''}
    setSelectedAuditId={action('setSelectedAuditId')}
    pairs={auditPairsSubitems}
    baseLhr={lhrSubitemsA}
  />
);

/** @param {LHCI.AuditPair} pair */
function forceDeterministicResults(pair) {
  /** @param {Record<string, any>} item */
  function forceBrokenImage(item) {
    if (item.url) item.url = item.url.replace(/https?:\/\/(.*?)\//, 'chrome://$1/');
  }

  /** @param {LH.AuditResult} audit */
  function forceAudit(audit) {
    if (audit.details) {
      const headings = JSON.stringify(audit.details.headings) || '';
      const hasThumbnailItem = headings.includes('thumbnail');
      if (hasThumbnailItem && audit.details.items) audit.details.items.forEach(forceBrokenImage);
    }
  }

  forceAudit(pair.audit);
  if (pair.baseAudit) forceAudit(pair.baseAudit);
}

/**
 * @param {LH.Result} lhrA
 * @param {LH.Result} lhrB
 * @param {{sample?: boolean, filter?: (pair: LHCI.AuditPair, i: number) => boolean}} [options]
 * @return {Array<LHCI.AuditPair>}
 */
function createAuditPairs(lhrA, lhrB, options) {
  const {sample = true, filter} = options || {};
  return computeAuditGroups(lhrA, lhrB, {percentAbsoluteDeltaThreshold: 0.05})
    .filter(group => !group.showAsUnchanged)
    .map(group => group.pairs)
    .reduce((a, b) => a.concat(b))
    .filter((pair, i) => {
      forceDeterministicResults(pair);

      if (filter) return filter(pair, i);
      // A superlong set of details that breaks diff comparisons, always discard.
      if (pair.audit.id === 'uses-long-cache-ttl') return false;
      // If we're sampling, then keep half of them.
      if (sample) return i % 2 === 0;
      // Otherwise return them all.
      return true;
    });
}

/**
 * @license Copyright 2020 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h} from 'preact';
import {LhrComparison} from './lhr-comparison';
import lhr5A_ from '../../../../test/fixtures/lh-5-6-0-verge-a.json';
import lhr5B_ from '../../../../test/fixtures/lh-5-6-0-verge-b.json';
import lhr6A_ from '../../../../test/fixtures/lh-6-0-0-coursehero-a.json';
import lhr6B_ from '../../../../test/fixtures/lh-6-0-0-coursehero-b.json';
import lhr62A_ from '../../../../test/fixtures/lh-6-2-0-coursehero-a.json';
import lhr62B_ from '../../../../test/fixtures/lh-6-2-0-coursehero-b.json';
import lhr641A_ from '../../../../test/fixtures/lh-6-4-1-coursehero-a.json';
import lhr641B_ from '../../../../test/fixtures/lh-6-4-1-coursehero-b.json';
import lhr700A_ from '../../../../test/fixtures/lh-7-0-0-coursehero-a.json';
import lhr700B_ from '../../../../test/fixtures/lh-7-0-0-coursehero-b.json';
import lhr800A_ from '../../../../test/fixtures/lh-8-0-0-coursehero-a.json';
import lhr800B_ from '../../../../test/fixtures/lh-8-0-0-coursehero-b.json';
import lhr930A_ from '../../../../test/fixtures/lh-9-3-0-coursehero-a.json';
import lhr930B_ from '../../../../test/fixtures/lh-9-3-0-coursehero-b.json';
import lhr1010A_ from '../../../../test/fixtures/lh-10-1-0-coursehero-a.json';
import lhr1010B_ from '../../../../test/fixtures/lh-10-1-0-coursehero-b.json';
import lhrPsi800A_ from '../../../../test/fixtures/psi-8-0-0-dkdev-a.json';
import lhrPsi800B_ from '../../../../test/fixtures/psi-8-0-0-dkdev-b.json';

export default {
  title: 'Build View/LHR Comparison',
  component: LhrComparison,
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
const lhrPsi800A = /** @type {any} */ (lhrPsi800A_);
const lhrPsi800B = /** @type {any} */ (lhrPsi800B_);

/** @param {{children: LHCI.PreactNode}} props */
const Wrapper = ({children}) => <div className="build-hash-selector">{children}</div>;

export const Default = () => (
  <Wrapper>
    <LhrComparison lhr={lhr5A} baseLhr={lhr5B} hookElements={{}} />
  </Wrapper>
);

export const Version6 = () => (
  <Wrapper>
    <LhrComparison lhr={lhr6A} baseLhr={lhr6B} hookElements={{}} />
  </Wrapper>
);

export const Version62 = () => (
  <Wrapper>
    <LhrComparison lhr={lhr62A} baseLhr={lhr62B} hookElements={{}} />
  </Wrapper>
);

export const Version641 = () => (
  <Wrapper>
    <LhrComparison lhr={lhr641A} baseLhr={lhr641B} hookElements={{}} />
  </Wrapper>
);

export const Version700 = () => (
  <Wrapper>
    <LhrComparison lhr={lhr700A} baseLhr={lhr700B} hookElements={{}} />
  </Wrapper>
);

export const Version800 = () => (
  <Wrapper>
    <LhrComparison lhr={lhr800A} baseLhr={lhr800B} hookElements={{}} />
  </Wrapper>
);

export const Version930 = () => (
  <Wrapper>
    <LhrComparison lhr={lhr930A} baseLhr={lhr930B} hookElements={{}} />
  </Wrapper>
);

export const Version1010 = () => (
  <Wrapper>
    <LhrComparison lhr={lhr1010A} baseLhr={lhr1010B} hookElements={{}} />
  </Wrapper>
);

export const VersionPsi800 = () => (
  <Wrapper>
    <LhrComparison lhr={lhrPsi800A} baseLhr={lhrPsi800B} hookElements={{}} />
  </Wrapper>
);

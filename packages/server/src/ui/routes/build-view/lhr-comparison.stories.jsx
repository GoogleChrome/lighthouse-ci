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

export default {
  title: 'Build View/LHR Comparison',
  component: LhrComparison,
  parameters: {dimensions: 'auto'},
};

const lhr5A = /** @type {any} */ (lhr5A_);
const lhr5B = /** @type {any} */ (lhr5B_);
const lhr6A = /** @type {any} */ (lhr6A_);
const lhr6B = /** @type {any} */ (lhr6B_);
const lhr62A = /** @type {any} */ (lhr62A_);
const lhr62B = /** @type {any} */ (lhr62B_);

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

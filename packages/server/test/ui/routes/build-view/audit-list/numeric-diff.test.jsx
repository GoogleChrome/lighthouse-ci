/** @jest-environment jsdom */

/**
 * @license Copyright 2026 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

/* eslint-env jest */

import {h} from 'preact';
import {NumericDiff} from '../../../../../src/ui/routes/build-view/audit-list/numeric-diff.jsx';
import {render, cleanup} from '../../../../test-utils.js';

afterEach(cleanup);

describe('NumericDiff', () => {
  it('should render ms/s units when numericUnit is millisecond', () => {
    const diff = {
      auditId: 'bootup-time',
      type: /** @type {'numericValue'} */ ('numericValue'),
      baseValue: 1000,
      compareValue: 2500,
    };
    const audit = {
      id: 'bootup-time',
      score: 0.5,
      numericUnit: 'millisecond',
      displayValue: '2.5 s',
    };

    const {container} = render(<NumericDiff diff={diff} audit={audit} />);
    const deltaEl = container.querySelector('.audit-numeric-diff__delta-label');
    const boxEl = container.querySelector('.audit-numeric-diff__box');

    expect(deltaEl.textContent).toBe('+1,500ms');
    expect(boxEl.getAttribute('data-tooltip')).toBe('1.0s to 2.5s');
  });

  it('should render KB/MB units when numericUnit is byte', () => {
    const diff = {
      auditId: 'total-byte-weight',
      type: /** @type {'numericValue'} */ ('numericValue'),
      baseValue: 400 * 1024,
      compareValue: 600 * 1024,
    };
    const audit = {
      id: 'total-byte-weight',
      score: 0.5,
      numericUnit: 'byte',
      displayValue: 'Total size was 600 KiB',
    };

    const {container} = render(<NumericDiff diff={diff} audit={audit} />);
    const deltaEl = container.querySelector('.audit-numeric-diff__delta-label');
    const boxEl = container.querySelector('.audit-numeric-diff__box');

    expect(deltaEl.textContent).toBe('+200KB');
    expect(boxEl.getAttribute('data-tooltip')).toBe('400KB to 0.6MB');
  });

  it('should fallback to displayValue with KiB/MiB when numericUnit is omitted', () => {
    const diff = {
      auditId: 'uses-optimized-images',
      type: /** @type {'numericValue'} */ ('numericValue'),
      baseValue: 200 * 1024,
      compareValue: 80 * 1024,
    };
    const audit = {
      id: 'uses-optimized-images',
      score: 0.5,
      displayValue: 'Est savings of 120 KiB',
    };

    const {container} = render(<NumericDiff diff={diff} audit={audit} />);
    const deltaEl = container.querySelector('.audit-numeric-diff__delta-label');
    const boxEl = container.querySelector('.audit-numeric-diff__box');

    expect(deltaEl.textContent).toBe('-120KB');
    expect(boxEl.getAttribute('data-tooltip')).toBe('200KB to 80KB');
  });

  it('should render unitless when numericUnit is element', () => {
    const diff = {
      auditId: 'dom-size',
      type: /** @type {'numericValue'} */ ('numericValue'),
      baseValue: 20,
      compareValue: 30,
    };
    const audit = {
      id: 'dom-size',
      score: 0.5,
      numericUnit: 'element',
      displayValue: '30 elements',
    };

    const {container} = render(<NumericDiff diff={diff} audit={audit} />);
    const deltaEl = container.querySelector('.audit-numeric-diff__delta-label');
    const boxEl = container.querySelector('.audit-numeric-diff__box');

    expect(deltaEl.textContent).toBe('+10');
    expect(boxEl.getAttribute('data-tooltip')).toBe('20 to 30');
  });
});

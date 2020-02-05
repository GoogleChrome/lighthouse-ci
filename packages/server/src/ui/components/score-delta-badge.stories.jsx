/**
 * @license Copyright 2020 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h} from 'preact';
import {ScoreDeltaBadge} from './score-delta-badge';

export default {
  title: 'Components/Score Delta Badge',
  component: ScoreDeltaBadge,
  parameters: {dimensions: {width: 120, height: 60}},
};

/** @type {LHCI.NumericAuditDiff} */
const numericDiff = {
  type: 'score',
  auditId: '',
  baseValue: 0.5,
  compareValue: 0.5,
};

export const Netural = () => <ScoreDeltaBadge diff={numericDiff} />;
export const Improvement = () => <ScoreDeltaBadge diff={{...numericDiff, compareValue: 0.7}} />;
export const Regression = () => <ScoreDeltaBadge diff={{...numericDiff, compareValue: 0.3}} />;

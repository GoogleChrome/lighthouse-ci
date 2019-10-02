/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h} from 'preact';
import './build-view-legend.css';
import {ScoreIcon} from '../../components/score-icon';

export const BuildViewLegend = () => {
  return (
    <div className="build-view__legend">
      <ScoreIcon score={0} />
      <span className="build-view-legend__label">0-49</span>
      <ScoreIcon score={0.5} />
      <span className="build-view-legend__label">50-89</span>
      <ScoreIcon score={1} />
      <span className="build-view-legend__label">90-100</span>
      <i className="build-view-legend__chip build-view-legend__chip--regression" />
      <span className="build-view-legend__label">Regression</span>
      <i className="build-view-legend__chip build-view-legend__chip--improvement" />
      <span className="build-view-legend__label">Improvement</span>
    </div>
  );
};

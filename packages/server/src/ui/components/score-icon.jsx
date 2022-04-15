/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h} from 'preact';


/** @type {Record<LHCI.AssertCommand.Budget.TimingMetric, [number, number]>} */
const SCORE_LEVEL_METRIC_THRESHOLDS = {
  'first-contentful-paint': [2000, 4000],
  'first-meaningful-paint': [2000, 4000],
  'largest-contentful-paint': [2000, 4000],
  'first-cpu-idle': [3000, 7500],
  interactive: [3000, 7500],
  'speed-index': [3000, 6000],
  'total-blocking-time': [300, 600],
  'cumulative-layout-shift': [0.1, 0.25],
  'max-potential-fid': [100, 250],
};

/** @param {{score: number, diffs?: LHCI.AuditDiff[]}} props */
export const ScoreIcon = props => {
  const { score, diffs } = props;
  let result = score;
  const numericDiff = diffs && diffs.find(diff => diff.type === 'numericValue');
  if (numericDiff && numericDiff.type === 'numericValue') {
    // @ts-ignore
    const thresholds = SCORE_LEVEL_METRIC_THRESHOLDS[numericDiff.auditId];
    if (thresholds) {
      if (numericDiff.compareValue <= thresholds[0]) {
        result = 0.9;
      } else if (numericDiff.compareValue <= thresholds[1]) {
        result = 0.5;
      } else {
        result = 0.49;
      }
    }
  }
  if (result >= 0.9) return <i className="lh-score-pass" />;
  if (result >= 0.5) return <i className="lh-score-average" />;
  return (
    <i className="lh-score-fail">
      <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
        <polygon points="10,110 60,10 110,110" />
      </svg>
    </i>
  );
};

/** @param {{audit: LH.AuditResult}} props */
export const ScoreWord = props => {
  const score = props.audit.score || 0;
  if (score >= 0.9) return <span className="lh-score-word">Pass</span>;
  return <span className="lh-score-word">Fail</span>;
};

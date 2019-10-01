/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h} from 'preact';
import clsx from 'clsx';
import './gauge.css';
import {getDiffLabel} from '@lhci/utils/src/audit-diff-finder';

/** @param {{className?: string, score: number, diff?: LHCI.NumericAuditDiff}} props */
export const Gauge = props => {
  const score = Math.round(props.score * 100);
  const rawBaseScore = props.diff ? props.diff.baseValue : props.score;
  const baseScore = Math.round(rawBaseScore * 100);
  const label = props.diff ? getDiffLabel(props.diff) : 'neutral';

  // 352 is ~= 2 * Math.PI * gauge radius (56)
  // https://codepen.io/xgad/post/svg-radial-progress-meters
  // score of 50: `stroke-dasharray: 176 352`;
  const baseStrokeDasharray = `${props.score * 352} 352`;
  const delta = Math.abs(baseScore - score);
  const deltaStrokeDasharray = `${(delta / 100) * 352} 352`;
  const deltaTransform = `rotate(${(Math.min(score, baseScore) / 100) * 360}deg)`;
  const indicatorTransform = `rotate(${props.score * 360}deg)`;

  return (
    <div className={clsx('gauge', `gauge--${label}`)}>
      <div className="gauge-arc">
        <svg viewBox="0 0 120 120">
          <circle
            className="gauge-arc__arc"
            transform="rotate(-90 60 60)"
            r="56"
            cx="60"
            cy="60"
            style={{strokeDasharray: baseStrokeDasharray}}
          />
        </svg>
        <div className="gauge-arc__delta-wrapper" style={{transform: deltaTransform}}>
          <svg viewBox="0 0 120 120">
            <circle
              className="gauge-arc__arc"
              transform="rotate(-90 60 60)"
              r="56"
              cx="60"
              cy="60"
              style={{strokeDasharray: deltaStrokeDasharray}}
            />
          </svg>
        </div>
        <div className="gauge-arc__indicator-wrapper" style={{transform: indicatorTransform}}>
          <div className="gauge-arc__indicator" />
        </div>
      </div>
      <span>{score}</span>
    </div>
  );
};

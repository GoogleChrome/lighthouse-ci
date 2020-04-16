/**
 * @license Copyright 2020 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h} from 'preact';
import './lhr-comparison-runtime-diff.css';
import clsx from 'clsx';

/** @typedef {{label: string, base: string, compare: string, severity: 'warn'|'error'}} RuntimeDiff */

/** @param {any} value */
function getStringValueFromRawConfigSetting(value) {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return value.toString();
  if (typeof value === 'undefined') return 'Unset';
  if (typeof value === 'boolean') return value ? 'Enabled' : 'Disabled';
  if (Array.isArray(value)) return value.join(', ');
  return 'Unknown';
}

/**
 * @param {LH.Result} lhr
 * @param {LH.Result|undefined} baseLhr
 * @return {Array<RuntimeDiff>}
 */
export function computeRuntimeDiffs(lhr, baseLhr) {
  if (!baseLhr) return [];

  /** @type {Array<RuntimeDiff>} */
  const diffs = [];

  const {benchmarkIndex} = lhr.environment;
  const {benchmarkIndex: baseBenchmarkIndex} = baseLhr.environment;
  const benchmarkMultiplicativeDelta =
    Math.abs(benchmarkIndex - baseBenchmarkIndex) / Math.min(benchmarkIndex, baseBenchmarkIndex);
  if (benchmarkMultiplicativeDelta > 1.5) {
    diffs.push({
      label: 'CPU/Memory Power',
      base: baseLhr.environment.benchmarkIndex.toString(),
      compare: lhr.environment.benchmarkIndex.toString(),
      severity: benchmarkMultiplicativeDelta > 2 ? 'error' : 'warn',
    });
  }

  const settings = lhr.configSettings;
  const baseSettings = baseLhr.configSettings;
  const throttling = settings.throttling || {};
  const baseThrottling = settings.throttling || {};
  const potentialDiffs = [
    ['Lighthouse Version', baseLhr.lighthouseVersion, lhr.lighthouseVersion],
    ['Storage Reset', baseSettings.disableStorageReset, settings.disableStorageReset],
    ['Emulated Form Factor', baseSettings.emulatedFormFactor, settings.emulatedFormFactor],
    ['Throttling Method', baseSettings.throttlingMethod, settings.throttlingMethod],
    ['CPU Throttling', baseThrottling.cpuSlowdownMultiplier, throttling.cpuSlowdownMultiplier],
    ['Network RTT', baseThrottling.rttMs, throttling.rttMs],
    ['Network Throughput', baseThrottling.throughputKbps, throttling.throughputKbps],
    ['Network RTT', baseThrottling.requestLatencyMs, throttling.requestLatencyMs],
    [
      'Network Throughput (Up)',
      baseThrottling.uploadThroughputKbps,
      throttling.uploadThroughputKbps,
    ],
    [
      'Network Throughput (Down)',
      baseThrottling.downloadThroughputKbps,
      throttling.downloadThroughputKbps,
    ],
  ];

  for (const [label, rawBase, rawCompare] of potentialDiffs) {
    const base = getStringValueFromRawConfigSetting(rawBase);
    const compare = getStringValueFromRawConfigSetting(rawCompare);
    if (base === compare) continue;
    diffs.push({label, base, compare, severity: 'error'});
  }

  return diffs;
}

/**
 * @param {{diffs: Array<RuntimeDiff>, variant: 'mini'|'full'}} props
 */
export const LhrRuntimeDiff = props => {
  const {diffs} = props;

  return (
    <div
      className={clsx(
        'lhr-comparison-runtime-diff',
        `lhr-comparison-runtime-diff--${props.variant}`
      )}
    >
      <div className="lhr-comparison__warning">
        <i className="material-icons">info</i>
        <div>
          Changes of runtime settings or the environment can substantially affect your Lighthouse
          scores and might be the reason for the differences here.
        </div>
      </div>
      <div className="lhr-comparison-runtime-diff__diffs">
        The following runtime differences were detected:
        <table>
          <thead>
            <tr>
              <th />
              <th>Base</th>
              <th>Compare</th>
            </tr>
          </thead>
          <tbody>
            {diffs.map(diff => (
              <tr key={diff.label}>
                <td>{diff.label}</td>
                <td>{diff.base}</td>
                <td>{diff.compare}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

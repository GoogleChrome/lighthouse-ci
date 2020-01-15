/**
 * @license Copyright 2020 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

declare namespace jest {
  interface Matchers<R> {
    toMatchImageSnapshot: (
      options?: import('jest-image-snapshot').MatchImageSnapshotOptions
    ) => void;
  }
}

declare module 'jest-image-snapshot' {
  export interface MatchImageSnapshotOptions {
    /**
     * Custom config passed to 'pixelmatch'
     */
    customDiffConfig?: any;
    /**
     * Custom snapshots directory.
     * Absolute path of a directory to keep the snapshot in.
     */
    customSnapshotsDir?: string;
    /**
     * A custom absolute path of a directory to keep this diff in
     */
    customDiffDir?: string;
    /**
     * A custom name to give this snapshot. If not provided, one is computed au
tomatically. When a function is provided
     * it is called with an object containing testPath, currentTestName, counte
r and defaultIdentifier as its first
     * argument. The function must return an identifier to use for the snapshot
.
     */
    customSnapshotIdentifier?: (parameters: {
      testPath: string;
      currentTestName: string;
      counter: number;
      defaultIdentifier: string;
    }) => string | string;
    /**
     * Changes diff image layout direction, default is horizontal.
     */
    diffDirection?: 'horizontal' | 'vertical';
    /**
     * Removes coloring from the console output, useful if storing the results to a file.
     * Defaults to false.
     */
    noColors?: boolean;
    /**
     * Sets the threshold that would trigger a test failure based on the failureThresholdType selected. This is different
     * to the customDiffConfig.threshold above - the customDiffConfig.threshold is the per pixel failure threshold, whereas
     * this is the failure threshold for the entire comparison.
     * Defaults to 0.
     */
    failureThreshold?: number;
    /**
     * Sets the type of threshold that would trigger a failure.
     * Defaults to 'pixel'.
     */
    failureThresholdType?: 'pixel' | 'percent';
    /**
     * Updates a snapshot even if it passed the threshold against the existing one.
     * Defaults to false.
     */
    updatePassedSnapshot?: boolean;
    /**
     * Applies Gaussian Blur on compared images, accepts radius in pixels as value. Useful when you have noise after
     * scaling images per different resolutions on your target website, usually setting it's value to 1-2 should be
     * enough to solve that problem.
     * Defaults to 0.
     */
    blur?: number;
    /**
     * Runs the diff in process without spawning a child process.
     * Defaults to false.
     */
    runInProcess?: boolean;
  }

  export function configureToMatchImageSnapshot(options: MatchImageSnapshotOptions): any;
}

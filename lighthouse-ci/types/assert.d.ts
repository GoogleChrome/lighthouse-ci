/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

declare global {
  namespace LHCI {
    namespace AssertCommand {
      export type AssertionMergeMethod = 'median' | 'optimistic' | 'pessimistic';

      export type AssertionFailureLevel = 'off' | 'warn' | 'error';

      export interface AssertionOptions {
        mergeMethod?: AssertionMergeMethod;
        minScore?: number;
        maxLength?: number;
      }

      export interface Assertions {
        [auditId: string]: AssertionFailureLevel | [AssertionFailureLevel, AssertionOptions];
      }

      export interface Options {
        assertions?: Assertions;
      }
    }
  }
}

// empty export to keep file a module
export {};

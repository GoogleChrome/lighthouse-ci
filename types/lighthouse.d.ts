/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

declare global {
  /** Remove properties K from T. */
  type StrictOmit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

  /** Unwrap the type from the Promise wrapper. */
  type UnPromisify<T> = T extends Promise<infer U> ? U : T;

  namespace LH {
    export interface AuditResult {
      score: number | null;
      numericValue?: number;
      details?: {items?: any[]};
      scoreDisplayMode?:
        | 'notApplicable'
        | 'informative'
        | 'numeric'
        | 'binary'
        | 'error'
        | 'manual';
    }

    export interface CategoryResult {
      score: number;
    }

    export interface Result {
      finalUrl: string;
      categories: {[categoryId: string]: CategoryResult};
      audits: {[auditId: string]: AuditResult};
    }
  }
}

// empty export to keep file a module
export {};

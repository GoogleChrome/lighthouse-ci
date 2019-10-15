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
    export type DetailsType =
      | 'node'
      | 'code'
      | 'bytes'
      | 'ms'
      | 'timespanMs'
      | 'text'
      | 'numeric'
      | 'url'
      | 'thumbnail'
      | 'unknown';

    export interface AuditResult {
      id?: string;
      title?: string;
      description?: string;
      score: number | null;
      displayValue?: string;
      numericValue?: number;
      details?: {
        type: string;
        items?: Array<Record<string, any>>;
        overallSavingsMs?: number;
        overallSavingsBytes?: number;
        headings?: Array<{
          key: string;
          valueType?: DetailsType;
          itemType?: DetailsType;
          label?: string;
        }>;
      };
      scoreDisplayMode?:
        | 'notApplicable'
        | 'informative'
        | 'numeric'
        | 'binary'
        | 'error'
        | 'manual';
    }

    export interface CategoryResult {
      id: string;
      score: number;
      title: string;
      auditRefs: Array<{id: string; weight: number; group?: string}>;
    }

    export interface Result {
      requestedUrl: string;
      finalUrl: string;
      fetchTime: string;
      lighthouseVersion: string;
      categories: {[categoryId: string]: CategoryResult};
      audits: {[auditId: string]: AuditResult};
      categoryGroups?: Record<string, {title: string; description?: string}>;
      configSettings: Record<string, any>;
      runWarnings: string[];
      userAgent: string;
      environment: {hostUserAgent: string; networkUserAgent: string; benchmarkIndex: number};
      timing: {total: number; entries: any[]};
      i18n: {
        rendererFormattedStrings: Record<string, string>;
        icuMessagePaths: Record<string, string>;
      };
      stackPacks?: any[];
    }
  }
}

// empty export to keep file a module
export {};

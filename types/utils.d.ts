/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {ComponentChildren} from 'preact';

declare global {
  namespace LHCI {
    export type Unpromised<T extends Promise<U>> = U;

    export type YargsOptions = Partial<
      {extends?: string | undefined; config?: string} & AssertCommand.Options &
        CollectCommand.Options &
        HealthcheckCommand.Options &
        OpenCommand.Options &
        ServerCommand.Options &
        UploadCommand.Options &
        WizardCommand.Options
    >;

    export type AuditDiffType =
      | 'error'
      | 'score'
      | 'numericValue'
      | 'displayValue'
      | 'itemCount'
      | 'itemAddition'
      | 'itemRemoval'
      | 'itemDelta';

    interface BaseAuditDiff {
      auditId: string;
    }

    interface BaseNumericAuditDiff {
      baseValue: number;
      compareValue: number;
    }

    export interface NumericAuditDiff extends BaseAuditDiff, BaseNumericAuditDiff {
      type: 'score' | 'numericValue' | 'itemCount';
    }

    export interface ItemAdditionAuditDiff extends BaseAuditDiff {
      type: 'itemAddition';
      compareItemIndex: number;
    }

    export interface ItemRemovalAuditDiff extends BaseAuditDiff {
      type: 'itemRemoval';
      baseItemIndex: number;
    }

    export interface NumericItemAuditDiff extends BaseAuditDiff, BaseNumericAuditDiff {
      type: 'itemDelta';
      baseItemIndex?: number;
      compareItemIndex?: number;
      itemKey: string;
    }

    export interface ErrorAuditDiff extends BaseAuditDiff {
      type: 'error';
      attemptedType: AuditDiffType;
      baseValue?: number;
      compareValue?: number;
    }

    export interface DisplayValueAuditDiff extends BaseAuditDiff {
      type: 'displayValue';
      baseValue: string;
      compareValue: string;
    }

    export type AuditDiff =
      | NumericAuditDiff
      | DisplayValueAuditDiff
      | ItemAdditionAuditDiff
      | ItemRemovalAuditDiff
      | NumericItemAuditDiff
      | ErrorAuditDiff;

    export interface AuditPair {
      audit: LH.AuditResult;
      baseAudit?: LH.AuditResult;
      diffs: Array<AuditDiff>;
      maxSeverity: number;
      group: {id: string; title: string};
    }

    export type PreactNode = ComponentChildren;
    export type HookElements<K extends keyof any> = {[P in K]?: PreactNode};

    export interface E2EState {
      debug: boolean;
      dataset: 'generated' | 'actual';
      rootURL: string;
      client: import('../packages/utils/src/api-client');
      server: {port: number; close: () => Promise<void>};
      browser: import('puppeteer').Browser;
      page: import('puppeteer').Page;
    }
  }
}

// empty export to keep file a module
export {};

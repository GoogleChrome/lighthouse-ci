/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

declare global {
  namespace LHCI {
    namespace CollectCommand {
      export interface LighthouseSettings {
        // From LH.SharedFlagsSettings
        locale?: string;
        maxWaitForFcp?: number;
        maxWaitForLoad?: number;
        blockedUrlPatterns?: string[] | null;
        additionalTraceCategories?: string | null;
        disableStorageReset?: boolean;
        emulatedFormFactor?: 'mobile' | 'desktop' | 'none';
        throttlingMethod?: 'devtools' | 'simulate' | 'provided';
        throttling?: Record<string, number>;
        onlyAudits?: string[] | null;
        onlyCategories?: string[] | null;
        skipAudits?: string[] | null;
        extraHeaders?: Record<string, string> | null; // See extraHeaders TODO in bin.js
        precomputedLanternData?: Record<string, any> | null;
        budgets?: Array<Record<string, any>> | null;
        // From LH.CliFlags
        chromeFlags?: string;
        budgetPath?: string;
        // Not allowed
        auditMode?: never;
        gatherMode?: never;
        output?: never;
        outputPath?: never;
        channel?: never;
        listAllAudits?: never;
        listAllCategories?: never;
        printConfig?: never;
      }

      export interface Options {
        url: string;
        method: 'node' | 'docker';
        numberOfRuns: number;
        headful: boolean;
        additive: boolean;
        settings?: LighthouseSettings;
      }
    }
  }
}

// empty export to keep file a module
export {};

/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

declare global {
  namespace LHCI {
    namespace UploadCommand {
      export type UploadTarget = 'lhci' | 'temporary-public-storage' | 'filesystem';

      export interface Options {
        target: UploadTarget;
        /** Temporary public storage only */
        uploadUrlMap?: boolean;
        /** LHCI only */
        token?: string;
        serverBaseUrl: string;
        ignoreDuplicateBuildFailure?: boolean;
        basicAuth?: ServerCommand.Options['basicAuth'];
        extraHeaders?: Record<string, string>;
        /** Filesystem only */
        outputDir?: string;
        reportFilenamePattern: string;
        /** Applies to multiple targets */
        githubToken?: string;
        githubApiHost?: string;
        githubAppToken?: string;
        githubAppUrl?: string;
        githubStatusContextSuffix?: string;
        urlReplacementPatterns: string[];
      }

      export interface ManifestEntrySummary {
        performance: number; // all category scores on 0-1 scale
        accessibility: number;
        'best-practices': number;
        seo: number;
        pwa: number;
      }

      export interface ManifestEntry {
        url: string; // finalUrl of the run
        isRepresentativeRun: boolean; // whether it was the median run for the URL
        jsonPath: string;
        htmlPath: string;
        summary: EntrySummary;
      }
    }
  }
}

// empty export to keep file a module
export {};

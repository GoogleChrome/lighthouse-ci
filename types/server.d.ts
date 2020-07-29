/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

type StorageMethod_ = import('../packages/server/src/api/storage/storage-method.js');

declare global {
  namespace LHCI {
    namespace ServerCommand {
      export type TableDefinition<T, TAllKeys extends keyof T = keyof T> = {
        [K in TAllKeys]: import('sequelize').DefineAttributeColumnOptions
      };

      export type TableAttributes<T, TAllKeys extends keyof T = keyof T> = {[K in TAllKeys]: {}};

      export interface Project {
        id: string;
        name: string;
        externalUrl: string;
        token: string;
        baseBranch: string;
        adminToken: string;
        slug: string;
        createdAt?: string;
        updatedAt?: string;
      }

      export interface Build {
        id: string;
        projectId: string;
        lifecycle: 'unsealed' | 'sealed';
        hash: string;
        branch: string;
        externalBuildUrl: string;
        runAt: string;
        commitMessage?: string;
        author?: string;
        avatarUrl?: string;
        ancestorHash?: string;
        committedAt?: string;
        ancestorCommittedAt?: string;
        createdAt?: string;
        updatedAt?: string;
      }

      export interface Run {
        id: string;
        projectId: string;
        buildId: string;
        representative: boolean;
        url: string;
        lhr: string;
        createdAt?: string;
        updatedAt?: string;
      }

      export type StatisticName =
        | 'meta_lighthouse_version'
        | 'audit_interactive_median'
        | 'audit_first-contentful-paint_median'
        | 'audit_speed-index_median'
        | 'audit_largest-contentful-paint_median'
        | 'audit_total-blocking-time_median'
        | 'audit_max-potential-fid_median'
        | 'category_performance_median'
        | 'category_pwa_median'
        | 'category_seo_median'
        | 'category_accessibility_median'
        | 'category_best-practices_median'
        | 'category_performance_min'
        | 'category_pwa_min'
        | 'category_seo_min'
        | 'category_accessibility_min'
        | 'category_best-practices_min'
        | 'category_performance_max'
        | 'category_pwa_max'
        | 'category_seo_max'
        | 'category_accessibility_max'
        | 'category_best-practices_max'
        | 'auditgroup_pwa-fast-reliable_pass'
        | 'auditgroup_pwa-fast-reliable_fail'
        | 'auditgroup_pwa-fast-reliable_na'
        | 'auditgroup_pwa-installable_pass'
        | 'auditgroup_pwa-installable_fail'
        | 'auditgroup_pwa-installable_na'
        | 'auditgroup_pwa-optimized_pass'
        | 'auditgroup_pwa-optimized_fail'
        | 'auditgroup_pwa-optimized_na'
        | 'auditgroup_a11y-best-practices_pass'
        | 'auditgroup_a11y-best-practices_fail'
        | 'auditgroup_a11y-best-practices_na'
        | 'auditgroup_a11y-color-contrast_pass'
        | 'auditgroup_a11y-color-contrast_fail'
        | 'auditgroup_a11y-color-contrast_na'
        | 'auditgroup_a11y-names-labels_pass'
        | 'auditgroup_a11y-names-labels_fail'
        | 'auditgroup_a11y-names-labels_na'
        | 'auditgroup_a11y-navigation_pass'
        | 'auditgroup_a11y-navigation_fail'
        | 'auditgroup_a11y-navigation_na'
        | 'auditgroup_a11y-aria_pass'
        | 'auditgroup_a11y-aria_fail'
        | 'auditgroup_a11y-aria_na'
        | 'auditgroup_a11y-language_pass'
        | 'auditgroup_a11y-language_fail'
        | 'auditgroup_a11y-language_na'
        | 'auditgroup_a11y-audio-video_pass'
        | 'auditgroup_a11y-audio-video_fail'
        | 'auditgroup_a11y-audio-video_na'
        | 'auditgroup_a11y-tables-lists_pass'
        | 'auditgroup_a11y-tables-lists_fail'
        | 'auditgroup_a11y-tables-lists_na'
        | 'auditgroup_seo-mobile_pass'
        | 'auditgroup_seo-mobile_fail'
        | 'auditgroup_seo-mobile_na'
        | 'auditgroup_seo-content_pass'
        | 'auditgroup_seo-content_fail'
        | 'auditgroup_seo-content_na'
        | 'auditgroup_seo-crawl_pass'
        | 'auditgroup_seo-crawl_fail'
        | 'auditgroup_seo-crawl_na';

      export interface Statistic {
        id: string;
        projectId: string;
        buildId: string;
        version: number;
        url: string;
        name: StatisticName;
        value: number;
        createdAt?: string;
        updatedAt?: string;
      }

      export interface GetBuildsOptions {
        branch?: string;
        hash?: string;
        limit?: number;
        lifecycle?: Build['lifecycle'];
      }

      export interface GetRunsOptions {
        representative?: boolean;
        url?: string;
      }

      export type StorageMethod = StorageMethod_;

      export interface PsiCollectEntry {
        urls: string[];
        schedule: string;
        numberOfRuns?: number;
        projectSlug: string;
        label?: string;
        branch?: string;
      }

      export interface StorageOptions {
        storageMethod: 'sql' | 'spanner';
        sqlDialect: 'sqlite' | 'mysql' | 'postgres';
        sqlDialectOptions?: {
          socketPath?: string;
          ssl?: {
            ca?: string;
            key?: string;
            cert?: string;
          };
        };
        sqlDatabasePath?: string;
        sqlConnectionSsl?: string;
        sqlConnectionUrl?: string;
        sqlDangerouslyResetDatabase?: boolean;
        sequelizeOptions?: import('sequelize').Options;
      }

      export interface Options {
        logLevel: 'silent' | 'verbose';
        port: number;
        storage: StorageOptions;
        psiCollectCron?: {
          psiApiKey: string;
          psiApiEndpoint?: string;
          sites: Array<PsiCollectEntry>;
        };
        basicAuth?: {
          username?: string;
          password?: string;
        };
      }
    }
  }
}

// empty export to keep file a module
export {};

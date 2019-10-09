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
        | 'audit_interactive_average'
        | 'audit_first-contentful-paint_average'
        | 'audit_speed-index_average'
        | 'category_performance_average'
        | 'category_pwa_average'
        | 'category_seo_average'
        | 'category_accessibility_average'
        | 'category_best-practices_average';

      export interface Statistic {
        id: string;
        projectId: string;
        buildId: string;
        url: string;
        name: StatisticName;
        value: number;
        createdAt?: string;
        updatedAt?: string;
      }

      export interface GetBuildsOptions {
        branch?: string;
        hash?: string;
      }

      export interface GetRunsOptions {
        representative?: boolean;
        url?: string;
      }

      export type StorageMethod = StorageMethod_;

      export interface StorageOptions {
        storageMethod: 'sql' | 'spanner';
        sqlDialect: 'sqlite' | 'mysql' | 'postgres';
        sqlDatabasePath?: string;
        sqlConnectionSsl?: string;
        sqlConnectionUrl?: string;
        sqlDangerouslyResetDatabase?: boolean;
      }

      export interface Options {
        logLevel: 'silent' | 'verbose';
        port: number;
        storage: StorageOptions;
      }
    }
  }
}

// empty export to keep file a module
export {};

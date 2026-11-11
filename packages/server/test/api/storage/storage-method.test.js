/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/* eslint-env jest */

const PRandom = require('@lhci/utils/src/seed-data/prandom.js');
const StorageMethod = require('../../../src/api/storage/storage-method.js');
const mysqlUtf8mb4Migration = require('../../../src/api/storage/sql/migrations/20261111-mysql-utf8mb4.js');

describe('StorageMethod', () => {
  let prandom;

  beforeEach(() => {
    prandom = new PRandom();
  });

  describe('mysql utf8mb4 migration', () => {
    it('should convert tables to utf8mb4 in migration for mysql', async () => {
      const query = jest.fn().mockResolvedValue(undefined);
      const queryInterface = /** @type {any} */ ({
        quoteIdentifier: /** @param {string} id */ id => `\`${id}\``,
        sequelize: {query},
      });

      await mysqlUtf8mb4Migration.up({
        queryInterface,
        options: {
          storageMethod: 'sql',
          sqlDialect: 'mysql',
        },
      });

      expect(query.mock.calls.map(c => c[0])).toEqual([
        'ALTER TABLE `projects` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;',
        'ALTER TABLE `builds` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;',
        'ALTER TABLE `runs` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;',
        'ALTER TABLE `statistics` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;',
      ]);

      query.mockClear();
      await mysqlUtf8mb4Migration.down({
        queryInterface,
        options: {
          storageMethod: 'sql',
          sqlDialect: 'mysql',
        },
      });

      expect(query.mock.calls.map(c => c[0])).toEqual([
        'ALTER TABLE `projects` CONVERT TO CHARACTER SET utf8 COLLATE utf8_general_ci;',
        'ALTER TABLE `builds` CONVERT TO CHARACTER SET utf8 COLLATE utf8_general_ci;',
        'ALTER TABLE `runs` CONVERT TO CHARACTER SET utf8 COLLATE utf8_general_ci;',
        'ALTER TABLE `statistics` CONVERT TO CHARACTER SET utf8 COLLATE utf8_general_ci;',
      ]);
    });

    it('should be a no-op in utf8mb4 migration for non-mysql dialects', async () => {
      const query = jest.fn();
      const queryInterface = /** @type {any} */ ({
        quoteIdentifier: /** @param {string} id */ id => `"${id}"`,
        sequelize: {query},
      });

      await mysqlUtf8mb4Migration.up({
        queryInterface,
        options: {
          storageMethod: 'sql',
          sqlDialect: 'postgres',
        },
      });
      await mysqlUtf8mb4Migration.down({
        queryInterface,
        options: {
          storageMethod: 'sql',
          sqlDialect: 'sqlite',
        },
      });

      expect(query).not.toHaveBeenCalled();
    });
  });

  describe('#generateSlug()', () => {
    it('should use the base slug', () => {
      expect(StorageMethod.generateSlug('My Project')).toEqual('my-project');
      expect(StorageMethod.generateSlug('  10 Things @#$@FSD!')).toEqual('10-things-fsd-');
    });

    it('should cutoff at maxLength', () => {
      expect(StorageMethod.generateSlug('123456789', {maxLength: 5})).toEqual('12345');
    });

    it('should add randomness', () => {
      expect(StorageMethod.generateSlug('12345', {randomLength: 2, prandom})).toEqual('12345-zc');
      expect(StorageMethod.generateSlug('12345', {randomLength: 1, prandom})).toEqual('12345-k');
    });

    it('should truncate to add randomness', () => {
      expect(StorageMethod.generateSlug('12345', {maxLength: 4, randomLength: 2, prandom})).toEqual(
        '1-zc'
      );
    });

    it('should throw if random length is too high', () => {
      expect(() =>
        StorageMethod.generateSlug('1', {maxLength: 4, randomLength: 3, prandom})
      ).toThrow();
    });
  });
});

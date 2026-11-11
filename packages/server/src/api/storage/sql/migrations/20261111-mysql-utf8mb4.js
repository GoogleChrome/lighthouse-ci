/**
 * @license Copyright 2026 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const TABLES = ['projects', 'builds', 'runs', 'statistics'];

module.exports = {
  /**
   * @param {{queryInterface: import('sequelize').QueryInterface, options: LHCI.ServerCommand.StorageOptions}} _
   */
  up: async ({queryInterface, options}) => {
    if (options.sqlDialect !== 'mysql') return;
    for (const table of TABLES) {
      await queryInterface.sequelize.query(
        `ALTER TABLE ${queryInterface.quoteIdentifier(
          table
        )} CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
      );
    }
  },
  /**
   * @param {{queryInterface: import('sequelize').QueryInterface, options: LHCI.ServerCommand.StorageOptions}} _
   */
  down: async ({queryInterface, options}) => {
    if (options.sqlDialect !== 'mysql') return;
    // NOTE: `utf8` / `utf8_general_ci` is MySQL's 3-byte UTF-8 (utf8mb3), so any 4-byte
    // characters (e.g. emoji) stored after the `up` migration will be lost.
    // This may also differ from the original charset of the tables (e.g. latin1).
    for (const table of TABLES) {
      await queryInterface.sequelize.query(
        `ALTER TABLE ${queryInterface.quoteIdentifier(
          table
        )} CONVERT TO CHARACTER SET utf8 COLLATE utf8_general_ci;`
      );
    }
  },
};

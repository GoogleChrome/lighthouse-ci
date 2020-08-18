/**
 * @license Copyright 2020 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

module.exports = {
  /**
   * @param {import('sequelize').QueryInterface} queryInterface
   */
  up: async queryInterface => {
    await queryInterface.addIndex('builds', ['projectId', 'lifecycle', 'createdAt']);
    await queryInterface.addIndex('builds', ['projectId', 'hash', 'createdAt']);
    await queryInterface.addIndex('builds', ['projectId', 'branch', 'hash', 'createdAt']);
    await queryInterface.addIndex('runs', ['projectId', 'buildId', 'url', 'createdAt']);
    await queryInterface.addIndex('statistics', ['projectId', 'buildId', 'createdAt']);
    await queryInterface.addIndex('statistics', ['projectId', 'buildId', 'url', 'name']);
  },
  /**
   * @param {import('sequelize').QueryInterface} queryInterface
   */
  down: async queryInterface => {
    await queryInterface.removeIndex('builds', ['projectId', 'lifecycle']);
    await queryInterface.removeIndex('builds', ['projectId', 'hash']);
    await queryInterface.removeIndex('builds', ['projectId', 'branch', 'hash']);
    await queryInterface.removeIndex('runs', ['projectId', 'buildId', 'url']);
    await queryInterface.removeIndex('statistics', ['projectId', 'buildId', 'createdAt']);
    await queryInterface.removeIndex('statistics', ['projectId', 'buildId', 'url', 'name']);
  },
};

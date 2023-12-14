/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const Sequelize = require('sequelize');

/* eslint-disable new-cap */

module.exports = {
  /**
   * @param {{queryInterface: import('sequelize').QueryInterface, options: LHCI.ServerCommand.StorageOptions}} _
   */
  up: async ({queryInterface, options}) => {
    await queryInterface.createTable('projects', {
      id: {type: Sequelize.UUID(), primaryKey: true},
      name: {type: Sequelize.STRING(40)},
      externalUrl: {type: Sequelize.STRING(256)},
      createdAt: {type: Sequelize.DATE(6)},
      updatedAt: {type: Sequelize.DATE(6)},
    });
    await queryInterface.createTable('builds', {
      id: {type: Sequelize.UUID(), primaryKey: true},
      projectId: {type: Sequelize.UUID()},
      lifecycle: {type: Sequelize.STRING(40)},
      hash: {type: Sequelize.STRING(40)},
      branch: {type: Sequelize.STRING(40)},
      commitMessage: {type: Sequelize.STRING(80)},
      author: {type: Sequelize.STRING(256)},
      avatarUrl: {type: Sequelize.STRING(256)},
      ancestorHash: {type: Sequelize.STRING(40)},
      externalBuildUrl: {type: Sequelize.STRING(256)},
      runAt: {type: Sequelize.DATE(6)},
      createdAt: {type: Sequelize.DATE(6)},
      updatedAt: {type: Sequelize.DATE(6)},
    });
    await queryInterface.createTable('runs', {
      id: {type: Sequelize.UUID(), primaryKey: true},
      projectId: {type: Sequelize.UUID()},
      buildId: {type: Sequelize.UUID()},
      representative: {type: Sequelize.BOOLEAN},
      url: {type: Sequelize.STRING({length: 256})},
      lhr: {type: options.sqlDialect === 'sqlite' ? Sequelize.TEXT : Sequelize.TEXT('long')},
      createdAt: {type: Sequelize.DATE(6)},
      updatedAt: {type: Sequelize.DATE(6)},
    });
    await queryInterface.createTable('statistics', {
      id: {type: Sequelize.UUID(), primaryKey: true},
      projectId: {type: Sequelize.UUID()},
      buildId: {type: Sequelize.UUID()},
      url: {type: Sequelize.STRING({length: 256})},
      name: {type: Sequelize.STRING({length: 100})},
      value: {type: Sequelize.DECIMAL(12, 4)},
      createdAt: {type: Sequelize.DATE(6)},
      updatedAt: {type: Sequelize.DATE(6)},
    });
  },
  /**
   * @param {{queryInterface: import('sequelize').QueryInterface, options: LHCI.ServerCommand.StorageOptions}} _
   */
  down: async ({queryInterface}) => {
    await queryInterface.dropTable('statistics');
    await queryInterface.dropTable('runs');
    await queryInterface.dropTable('builds');
    await queryInterface.dropTable('projects');
  },
};

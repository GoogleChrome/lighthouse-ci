/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const {DataTypes} = require('sequelize');
/* eslint-disable new-cap */

module.exports = {
  /**
   * @param {import('sequelize').QueryInterface} queryInterface
   * @param {LHCI.ServerCommand.StorageOptions} options
   */
  up: async (queryInterface, options) => {
    await queryInterface.createTable('projects', {
      id: {type: DataTypes.UUID(), primaryKey: true},
      name: {type: DataTypes.STRING(40)},
      externalUrl: {type: DataTypes.STRING(256)},
      createdAt: {type: DataTypes.DATE(6)},
      updatedAt: {type: DataTypes.DATE(6)},
    });
    await queryInterface.createTable('builds', {
      id: {type: DataTypes.UUID(), primaryKey: true},
      projectId: {type: DataTypes.UUID()},
      lifecycle: {type: DataTypes.STRING(40)},
      hash: {type: DataTypes.STRING(40)},
      branch: {type: DataTypes.STRING(40)},
      commitMessage: {type: DataTypes.STRING(80)},
      author: {type: DataTypes.STRING(256)},
      avatarUrl: {type: DataTypes.STRING(256)},
      ancestorHash: {type: DataTypes.STRING(40)},
      externalBuildUrl: {type: DataTypes.STRING(256)},
      runAt: {type: DataTypes.DATE(6)},
      createdAt: {type: DataTypes.DATE(6)},
      updatedAt: {type: DataTypes.DATE(6)},
    });
    await queryInterface.createTable('runs', {
      id: {type: DataTypes.UUID(), primaryKey: true},
      projectId: {type: DataTypes.UUID()},
      buildId: {type: DataTypes.UUID()},
      representative: {type: DataTypes.BOOLEAN},
      url: {type: DataTypes.STRING({length: 256})},
      lhr: {
        type:
          options.sqlDialect === 'sqlite' || options.sqlDialect === 'postgres'
            ? DataTypes.TEXT
            : DataTypes.TEXT('long'),
      },
      createdAt: {type: DataTypes.DATE(6)},
      updatedAt: {type: DataTypes.DATE(6)},
    });
    await queryInterface.createTable('statistics', {
      id: {type: DataTypes.UUID(), primaryKey: true},
      projectId: {type: DataTypes.UUID()},
      buildId: {type: DataTypes.UUID()},
      url: {type: DataTypes.STRING({length: 256})},
      name: {type: DataTypes.STRING({length: 100})},
      value: {type: DataTypes.DECIMAL(12, 4)},
      createdAt: {type: DataTypes.DATE(6)},
      updatedAt: {type: DataTypes.DATE(6)},
    });
  },
  /**
   * @param {import('sequelize').QueryInterface} queryInterface
   */
  down: async queryInterface => {
    await queryInterface.dropTable('statistics');
    await queryInterface.dropTable('runs');
    await queryInterface.dropTable('builds');
    await queryInterface.dropTable('projects');
  },
};

/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/* eslint-disable new-cap */

const {DataTypes} = require('sequelize');

/** @type {import('sequelize').Model<any, any>} */
const ModelRef = /** @type {any} */ (undefined);

/** @type {LHCI.ServerCommand.TableDefinition<LHCI.ServerCommand.Build>} */
const attributes = {
  id: {type: DataTypes.UUID(), primaryKey: true},
  projectId: {type: DataTypes.UUID(), references: {model: ModelRef, key: 'id'}},
  lifecycle: {type: DataTypes.STRING(40)},
  hash: {type: DataTypes.STRING(40)},
  branch: {type: DataTypes.STRING(40)},
  commitMessage: {type: DataTypes.STRING(80)},
  author: {type: DataTypes.STRING(256)},
  avatarUrl: {type: DataTypes.STRING(256)},
  ancestorHash: {type: DataTypes.STRING(40)},
  externalBuildUrl: {type: DataTypes.STRING(256)},
  runAt: {type: DataTypes.DATE(6)}, // should mostly be equal to createdAt but modifiable by the consumer
  committedAt: {type: DataTypes.DATE(6)},
  ancestorCommittedAt: {type: DataTypes.DATE(6)},
  createdAt: {type: DataTypes.DATE(6)},
  updatedAt: {type: DataTypes.DATE(6)},
};

module.exports = {
  tableName: 'builds',
  attributes,
  indexes: [],
};

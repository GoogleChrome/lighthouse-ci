/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/* eslint-disable new-cap */

const Sequelize = require('sequelize');

/** @type {import('sequelize').Model<any, any>} */
const ModelRef = /** @type {any} */ (undefined);

/** @type {LHCI.ServerCommand.TableDefinition<LHCI.ServerCommand.Build>} */
const attributes = {
  id: {type: Sequelize.UUID(), primaryKey: true},
  projectId: {type: Sequelize.UUID(), references: {model: ModelRef, key: 'id'}},
  lifecycle: {type: Sequelize.STRING(40)},
  hash: {type: Sequelize.STRING(40)},
  branch: {type: Sequelize.STRING(40)},
  commitMessage: {type: Sequelize.STRING(80)},
  author: {type: Sequelize.STRING(256)},
  avatarUrl: {type: Sequelize.STRING(256)},
  ancestorHash: {type: Sequelize.STRING(40)},
  externalBuildUrl: {type: Sequelize.STRING(256)},
  runAt: {type: Sequelize.DATE()}, // should mostly be equal to createdAt but modifiable by the consumer
};

module.exports = {
  tableName: 'builds',
  attributes,
  indexes: [],
};

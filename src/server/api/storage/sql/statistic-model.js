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

module.exports = {
  tableName: 'statistics',
  attributes: {
    id: {type: Sequelize.UUID(), primaryKey: true},
    projectId: {type: Sequelize.UUID(), references: {model: ModelRef, key: 'id'}},
    buildId: {type: Sequelize.UUID(), references: {model: ModelRef, key: 'id'}},
    url: {type: Sequelize.STRING({length: 256})},
    name: {type: Sequelize.STRING({length: 100})},
    value: {type: Sequelize.DOUBLE(12, 4)},
  },
  indexes: [],
};

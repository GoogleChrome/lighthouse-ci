/**
 * @license Copyright 2020 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const Sequelize = require('sequelize');
const {hashAdminToken, generateAdminToken} = require('../../auth.js');

/* eslint-disable new-cap */

module.exports = {
  /**
   * @param {{queryInterface: import('sequelize').QueryInterface, options: LHCI.ServerCommand.StorageOptions}} _
   */
  up: async ({queryInterface}) => {
    await queryInterface.addColumn('projects', 'adminToken', {type: Sequelize.STRING(64)});
    await queryInterface.bulkUpdate(
      'projects',
      // Because of the useless salt, this will be an invalid admin token that requires resetting
      // via the wizard command, but our goal is exactly to create an initial token no one can guess.
      {adminToken: hashAdminToken(generateAdminToken(), '0')},
      {adminToken: null},
      {type: Sequelize.QueryTypes.BULKUPDATE}
    );
  },
  /**
   * @param {{queryInterface: import('sequelize').QueryInterface, options: LHCI.ServerCommand.StorageOptions}} _
   */
  down: async ({queryInterface}) => {
    await queryInterface.removeColumn('projects', 'adminToken');
  },
};

/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/* eslint-disable new-cap */

module.exports = {
  /**
   * @param {import('sequelize').QueryInterface} queryInterface
   * @param {typeof import('sequelize')} Sequelize
   */
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('projects', 'slug', {type: Sequelize.STRING(40)});
    await queryInterface.bulkUpdate(
      'projects',
      {slug: Sequelize.col('id')},
      {slug: null},
      {type: Sequelize.QueryTypes.BULKUPDATE}
    );
    await queryInterface.addIndex('projects', {
      // @ts-ignore - Sequelize types are out of date
      name: 'projects_unique_slug',
      unique: true,
      fields: ['slug'],
    });
  },
  /**
   * @param {import('sequelize').QueryInterface} queryInterface
   */
  down: async queryInterface => {
    await queryInterface.removeIndex('projects', 'projects_unique_slug');
    await queryInterface.removeColumn('projects', 'slug');
  },
};

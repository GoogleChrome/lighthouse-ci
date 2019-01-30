/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const uuid = require('uuid');
const Sequelize = require('sequelize');
const projectModelDefn = require('./project-model.js');

/**
 * @template T
 * @param {T} o
 * @return {T}
 */
function clone(o) {
  return JSON.parse(JSON.stringify(o));
}

/** @typedef {LHCI.ServerCommand.TableAttributes<LHCI.ServerCommand.Project>} ProjectAttrs */

/**
 * @typedef SqlState
 * @property {import('sequelize').Sequelize} sequelize
 * @property {import('sequelize').Model<LHCI.ServerCommand.Project, ProjectAttrs>} projectModel
*/

class SqlStorageMethod {
  constructor() {
    /** @type {SqlState|undefined} */
    this._sequelize = undefined;

    /** @type {LHCI.ServerCommand.StorageMethod} */
    const typecheck = this; // eslint-disable-line no-unused-vars
  }

  /** @return {SqlState} */
  _sql() {
    if (!this._sequelize) throw new Error('Sequelize not yet initialized!');
    return this._sequelize;
  }

  /**
   * @param {LHCI.ServerCommand.StorageOptions} options
   * @return {Promise<void>}
   */
  async initialize(options) {
    if (!options.sqlDatabasePath) throw new Error('Cannot use sqlite without a database path');

    const sequelize = new Sequelize({
      dialect: options.sqlDialect,
      storage: options.sqlDatabasePath,
      logging: () => {},
    });

    const projectModel = sequelize.define(projectModelDefn.tableName, projectModelDefn.attributes);

    await sequelize.sync({force: options.sqlDangerouslyForceMigration});

    this._sequelize = {sequelize, projectModel};
  }

  /**
   * @return {Promise<Array<LHCI.ServerCommand.Project>>}
   */
  async getProjects() {
    const {projectModel} = this._sql();
    const projects = await projectModel.findAll();
    return projects.map(clone);
  }

  /**
   * @param {Omit<LHCI.ServerCommand.Project, 'id'>} unsavedProject
   * @return {Promise<LHCI.ServerCommand.Project>}
   */
  async createProject(unsavedProject) {
    const {projectModel} = this._sql();
    const project = await projectModel.create({...unsavedProject, id: uuid.v4()});
    return clone(project);
  }
}

module.exports = SqlStorageMethod;

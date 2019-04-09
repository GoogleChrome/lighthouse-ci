/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const uuid = require('uuid');
const Sequelize = require('sequelize');
const projectModelDefn = require('./project-model.js');
const buildModelDefn = require('./build-model.js');
const runModelDefn = require('./run-model.js');

/**
 * Clones the object without the fancy function getters/setters.
 *
 * @template T
 * @param {T} o
 * @return {T}
 */
function clone(o) {
  return JSON.parse(JSON.stringify(o));
}

/** @typedef {LHCI.ServerCommand.TableAttributes<LHCI.ServerCommand.Project>} ProjectAttrs */
/** @typedef {LHCI.ServerCommand.TableAttributes<LHCI.ServerCommand.Build>} BuildAttrs */
/** @typedef {LHCI.ServerCommand.TableAttributes<LHCI.ServerCommand.Run>} RunAttrs */

/**
 * @typedef SqlState
 * @property {import('sequelize').Sequelize} sequelize
 * @property {import('sequelize').Model<LHCI.ServerCommand.Project, ProjectAttrs>} projectModel
 * @property {import('sequelize').Model<LHCI.ServerCommand.Build, BuildAttrs>} buildModel
 * @property {import('sequelize').Model<LHCI.ServerCommand.Run, RunAttrs>} runModel
*/

/** Sort all records by most recently updated */
const order = [['updatedAt', 'desc']];

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
      operatorsAliases: false,
      logging: () => {},
    });

    const projectModel = sequelize.define(projectModelDefn.tableName, projectModelDefn.attributes);

    buildModelDefn.attributes.projectId.references.model = projectModel;
    const buildModel = sequelize.define(buildModelDefn.tableName, buildModelDefn.attributes);

    runModelDefn.attributes.projectId.references.model = projectModel;
    runModelDefn.attributes.buildId.references.model = buildModel;
    // SQLite doesn't support long text fields so supress the warning
    if (options.sqlDialect === 'sqlite') runModelDefn.attributes.lhr.type = Sequelize.TEXT;
    const runModel = sequelize.define(runModelDefn.tableName, runModelDefn.attributes);

    await sequelize.sync({force: options.sqlDangerouslyForceMigration});

    this._sequelize = {sequelize, projectModel, buildModel, runModel};
  }

  /**
   * @return {Promise<Array<LHCI.ServerCommand.Project>>}
   */
  async getProjects() {
    const {projectModel} = this._sql();
    const projects = await projectModel.findAll({order});
    return projects.map(clone);
  }

  /**
   * @param {LHCI.ServerCommand.Project} project
   * @return {Promise<string>}
   */
  async getProjectToken(project) {
    return project.id;
  }

  /**
   * @param {string} token
   * @return {Promise<LHCI.ServerCommand.Project>}
   */
  async findProjectByToken(token) {
    const {projectModel} = this._sql();
    const project = await projectModel.findOne({where: {id: token}});
    if (!project) throw new Error(`No project for token ${token}`);
    return clone(project);
  }

  /**
   * @param {string} projectId
   * @return {Promise<LHCI.ServerCommand.Project>}
   */
  async findProjectById(projectId) {
    const {projectModel} = this._sql();
    const project = await projectModel.findByPk(projectId);
    if (!project) throw new Error(`No project for projectId ${projectId}`);
    return clone(project);
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

  /**
   * @param {string} projectId
   * @return {Promise<LHCI.ServerCommand.Build[]>}
   */
  async getBuilds(projectId) {
    const {buildModel} = this._sql();
    const builds = await buildModel.findAll({where: {projectId}, order});
    return clone(builds);
  }

  /**
   * @param {Omit<LHCI.ServerCommand.Build, 'id'>} unsavedBuild
   * @return {Promise<LHCI.ServerCommand.Build>}
   */
  async createBuild(unsavedBuild) {
    const {buildModel} = this._sql();
    const build = await buildModel.create({...unsavedBuild, id: uuid.v4()});
    return clone(build);
  }

  /**
   * @param {string} projectId
   * @param {string} buildId
   * @return {Promise<LHCI.ServerCommand.Run[]>}
   */
  async getRuns(projectId, buildId) {
    const {runModel} = this._sql();
    const runs = await runModel.findAll({where: {projectId, buildId}, order});
    return clone(runs);
  }

  /**
   * @param {Omit<LHCI.ServerCommand.Run, 'id'>} unsavedRun
   * @return {Promise<LHCI.ServerCommand.Run>}
   */
  async createRun(unsavedRun) {
    const {runModel} = this._sql();
    const run = await runModel.create({...unsavedRun, id: uuid.v4()});
    return clone(run);
  }
}

module.exports = SqlStorageMethod;

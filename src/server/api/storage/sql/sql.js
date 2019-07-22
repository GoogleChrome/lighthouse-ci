/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const uuid = require('uuid');
const Sequelize = require('sequelize');
const {omit} = require('../../../../shared/lodash.js');
const StorageMethod = require('../storage-method.js');
const projectModelDefn = require('./project-model.js');
const buildModelDefn = require('./build-model.js');
const runModelDefn = require('./run-model.js');
const statisticModelDefn = require('./statistic-model.js');

/**
 * Clones the object without the fancy function getters/setters.
 *
 * @template T
 * @param {T} o
 * @return {T}
 */
function clone(o) {
  if (o === undefined) return o;
  return JSON.parse(JSON.stringify(o));
}

/** @typedef {LHCI.ServerCommand.TableAttributes<LHCI.ServerCommand.Project>} ProjectAttrs */
/** @typedef {LHCI.ServerCommand.TableAttributes<LHCI.ServerCommand.Build>} BuildAttrs */
/** @typedef {LHCI.ServerCommand.TableAttributes<LHCI.ServerCommand.Run>} RunAttrs */
/** @typedef {LHCI.ServerCommand.TableAttributes<LHCI.ServerCommand.Statistic>} StatisticAttrs */

/**
 * @typedef SqlState
 * @property {import('sequelize').Sequelize} sequelize
 * @property {import('sequelize').Model<LHCI.ServerCommand.Project, ProjectAttrs>} projectModel
 * @property {import('sequelize').Model<LHCI.ServerCommand.Build, BuildAttrs>} buildModel
 * @property {import('sequelize').Model<LHCI.ServerCommand.Run, RunAttrs>} runModel
 * @property {import('sequelize').Model<LHCI.ServerCommand.Statistic, StatisticAttrs>} statisticModel
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

    statisticModelDefn.attributes.projectId.references.model = projectModel;
    statisticModelDefn.attributes.buildId.references.model = buildModel;
    const statisticModel = sequelize.define(
      statisticModelDefn.tableName,
      statisticModelDefn.attributes
    );

    await sequelize.sync({force: options.sqlDangerouslyForceMigration});

    this._sequelize = {sequelize, projectModel, buildModel, runModel, statisticModel};
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
   * @return {Promise<LHCI.ServerCommand.Project | undefined>}
   */
  async findProjectByToken(token) {
    const {projectModel} = this._sql();
    const project = await projectModel.findOne({where: {id: token}});
    return clone(project || undefined);
  }

  /**
   * @param {string} projectId
   * @return {Promise<LHCI.ServerCommand.Project | undefined>}
   */
  async findProjectById(projectId) {
    const {projectModel} = this._sql();
    const project = await projectModel.findByPk(projectId);
    return clone(project || undefined);
  }

  /**
   * @param {StrictOmit<LHCI.ServerCommand.Project, 'id'>} unsavedProject
   * @return {Promise<LHCI.ServerCommand.Project>}
   */
  async createProject(unsavedProject) {
    const {projectModel} = this._sql();
    const project = await projectModel.create({...unsavedProject, id: uuid.v4()});
    return clone(project);
  }

  /**
   * @param {string} projectId
   * @param {LHCI.ServerCommand.GetBuildsOptions} [options]
   * @return {Promise<LHCI.ServerCommand.Build[]>}
   */
  async getBuilds(projectId, options = {}) {
    const {buildModel} = this._sql();
    const builds = await buildModel.findAll({
      where: {projectId, ...omit(options, [], {dropUndefined: true})},
      order,
    });
    return clone(builds);
  }

  /**
   * @param {StrictOmit<LHCI.ServerCommand.Build, 'id'>} unsavedBuild
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
   * @return {Promise<LHCI.ServerCommand.Build | undefined>}
   */
  async findBuildById(projectId, buildId) {
    const {buildModel} = this._sql();
    const build = await buildModel.findByPk(buildId);
    if (build && build.projectId !== projectId) return undefined;
    return clone(build || undefined);
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
   * @param {string} projectId
   * @param {string} [buildId]
   * @return {Promise<Array<string>>}
   */
  async getUrls(projectId, buildId) {
    const {runModel} = this._sql();
    const runs = await runModel.findAll({
      where: buildId ? {projectId, buildId} : {projectId},
      order,
      group: 'url',
      attributes: ['url'],
    });

    return clone(runs.map(run => run.url));
  }

  /**
   * @param {StrictOmit<LHCI.ServerCommand.Run, 'id'>} unsavedRun
   * @return {Promise<LHCI.ServerCommand.Run>}
   */
  async createRun(unsavedRun) {
    const {runModel} = this._sql();
    const run = await runModel.create({...unsavedRun, id: uuid.v4()});
    return clone(run);
  }

  /**
   * @param {string} projectId
   * @param {string} buildId
   * @return {Promise<Array<LHCI.ServerCommand.Statistic>>}
   */
  async getStatistics(projectId, buildId) {
    return StorageMethod.getOrCreateStatistics(this, projectId, buildId);
  }

  /**
   * @param {StrictOmit<LHCI.ServerCommand.Statistic, 'id'>} unsavedStatistic
   * @return {Promise<LHCI.ServerCommand.Statistic>}
   */
  async _createOrUpdateStatistic(unsavedStatistic) {
    const {statisticModel} = this._sql();
    const existing = await statisticModel.findOne({
      where: {
        projectId: unsavedStatistic.projectId,
        buildId: unsavedStatistic.buildId,
        url: unsavedStatistic.url,
        name: unsavedStatistic.name,
      },
    });

    /** @type {LHCI.ServerCommand.Statistic} */
    let statistic;
    if (existing) {
      await statisticModel.update({...unsavedStatistic}, {where: {id: existing.id}});
      const updated = await statisticModel.findByPk(existing.id);
      if (!updated) throw new Error('Failed to update statistic');
      statistic = updated;
    } else {
      statistic = await statisticModel.create({...unsavedStatistic, id: uuid.v4()});
    }

    return clone(statistic);
  }

  /**
   * @param {string} projectId
   * @param {string} buildId
   * @return {Promise<Array<LHCI.ServerCommand.Statistic>>}
   */
  async _getStatistics(projectId, buildId) {
    const {statisticModel} = this._sql();
    const statistics = await statisticModel.findAll({where: {projectId, buildId}, order});
    return clone(statistics);
  }
}

module.exports = SqlStorageMethod;

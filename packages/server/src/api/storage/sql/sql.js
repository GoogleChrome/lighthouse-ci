/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const path = require('path');
const uuid = require('uuid');
const Umzug = require('umzug');
const Sequelize = require('sequelize');
const {omit} = require('@lhci/utils/src/lodash.js');
const {E422} = require('../../express-utils.js');
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

/**
 * @param {string|undefined} id
 */
function validateUuidOrEmpty(id) {
  if (typeof id === 'undefined') return undefined;
  if (id.match(/^\w{8}-\w{4}-\w{4}-\w{4}-\w{12}$/)) return id;
  // Valid v4 UUID's always have the third segment start with 4, so this will never match, but passes
  // as a UUID to postgres.
  return `11111111-1111-1111-1111-111111111111`;
}

/**
 * @param {LHCI.ServerCommand.StorageOptions} options
 */
function createSequelize(options) {
  const dialect = options.sqlDialect;
  const sequelizeOptions = {
    operatorsAliases: false,
    logging: () => {},
  };

  if (dialect === 'sqlite') {
    if (!options.sqlDatabasePath) throw new Error('Cannot use sqlite without a database path');
    return new Sequelize({
      ...sequelizeOptions,
      dialect: 'sqlite',
      storage: options.sqlDatabasePath,
    });
  }

  if (!options.sqlConnectionUrl) throw new Error(`Cannot use ${dialect} without a database URL`);

  return new Sequelize(options.sqlConnectionUrl, {
    ...sequelizeOptions,
    ssl: !!options.sqlConnectionSsl,
  });
}

/**
 * @param {import('sequelize').Sequelize} sequelize
 */
function createUmzug(sequelize) {
  return new Umzug({
    logging: () => {},
    storage: 'sequelize',
    storageOptions: {sequelize: /** @type {*} */ (sequelize)},
    migrations: {
      path: path.join(__dirname, 'migrations'),
      params: [sequelize.getQueryInterface(), Sequelize],
    },
  });
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

/** Sort all records by most recently created */
const order = [['createdAt', 'desc']];

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
   * @template T1
   * @template T2
   * @param {import('sequelize').Model<T1, T2>} model
   * @param {string} pk
   */
  async _findByPk(model, pk) {
    return model.findByPk(validateUuidOrEmpty(pk));
  }

  /**
   * @template T1
   * @template T2
   * @param {import('sequelize').Model<T1, T2>} model
   * @param {import('sequelize').FindOptions<T1 & T2>} options
   */
  async _findAll(model, options) {
    if (options.where) {
      options.where = {...options.where};

      for (const key of Object.keys(options.where)) {
        if (!key.endsWith('Id') && key !== 'token') continue;
        // @ts-ignore - `options.where` is not indexable in tsc's eyes
        options.where[key] = validateUuidOrEmpty(options.where[key]);
      }
    }

    return model.findAll(options);
  }

  /**
   * @param {LHCI.ServerCommand.StorageOptions} options
   * @return {Promise<void>}
   */
  async initialize(options) {
    if (!buildModelDefn.attributes.projectId.references) throw new Error('Invalid buildModel');
    if (!runModelDefn.attributes.projectId.references) throw new Error('Invalid runModel');
    if (!runModelDefn.attributes.buildId.references) throw new Error('Invalid runModel');

    const sequelize = createSequelize(options);

    const projectModel = sequelize.define(projectModelDefn.tableName, projectModelDefn.attributes);

    buildModelDefn.attributes.projectId.references.model = projectModel;
    const buildModel = sequelize.define(buildModelDefn.tableName, buildModelDefn.attributes);

    runModelDefn.attributes.projectId.references.model = projectModel;
    runModelDefn.attributes.buildId.references.model = buildModel;
    const runModel = sequelize.define(runModelDefn.tableName, runModelDefn.attributes);

    statisticModelDefn.attributes.projectId.references.model = projectModel;
    statisticModelDefn.attributes.buildId.references.model = buildModel;
    const statisticModel = sequelize.define(
      statisticModelDefn.tableName,
      statisticModelDefn.attributes
    );

    const umzug = createUmzug(sequelize);
    if (options.sqlDangerouslyResetDatabase) {
      await umzug.down({to: 0});
    }

    await umzug.up();

    this._sequelize = {sequelize, projectModel, buildModel, runModel, statisticModel};
  }

  /** @return {Promise<void>} */
  async close() {
    return this._sql().sequelize.close();
  }

  /**
   * @return {Promise<Array<LHCI.ServerCommand.Project>>}
   */
  async getProjects() {
    const {projectModel} = this._sql();
    const projects = await this._findAll(projectModel, {order});
    return projects.map(clone);
  }

  /**
   * @param {string} token
   * @return {Promise<LHCI.ServerCommand.Project | undefined>}
   */
  async findProjectByToken(token) {
    const {projectModel} = this._sql();
    const projects = await this._findAll(projectModel, {where: {token}, limit: 1});
    return clone(projects[0]);
  }

  /**
   * @param {string} projectId
   * @return {Promise<LHCI.ServerCommand.Project | undefined>}
   */
  async findProjectById(projectId) {
    const {projectModel} = this._sql();
    const project = await this._findByPk(projectModel, projectId);
    return clone(project || undefined);
  }

  /**
   * @param {StrictOmit<LHCI.ServerCommand.Project, 'id'|'token'>} unsavedProject
   * @return {Promise<LHCI.ServerCommand.Project>}
   */
  async createProject(unsavedProject) {
    const {projectModel} = this._sql();
    const project = await projectModel.create({...unsavedProject, token: uuid.v4(), id: uuid.v4()});
    return clone(project);
  }

  /**
   * @param {string} projectId
   * @param {LHCI.ServerCommand.GetBuildsOptions} [options]
   * @return {Promise<LHCI.ServerCommand.Build[]>}
   */
  async getBuilds(projectId, options = {}) {
    const {buildModel} = this._sql();
    const builds = await this._findAll(buildModel, {
      where: {projectId, ...omit(options, [], {dropUndefined: true})},
      order,
    });
    return clone(builds);
  }

  /**
   * @param {string} projectId
   * @return {Promise<Array<{branch: string}>>}
   */
  // eslint-disable-next-line no-unused-vars
  async getBranches(projectId) {
    const {buildModel} = this._sql();
    const builds = await this._findAll(buildModel, {
      where: {projectId},
      order: [['branch', 'desc']],
      group: ['branch'],
      attributes: ['branch'],
    });

    return clone(builds.map(build => ({branch: build.branch})));
  }

  /**
   * @param {StrictOmit<LHCI.ServerCommand.Build, 'id'>} unsavedBuild
   * @return {Promise<LHCI.ServerCommand.Build>}
   */
  async createBuild(unsavedBuild) {
    const {buildModel} = this._sql();
    if (unsavedBuild.lifecycle !== 'unsealed') throw new E422('Invalid lifecycle value');
    const build = await buildModel.create({...unsavedBuild, id: uuid.v4()});
    return clone(build);
  }

  /**
   * @param {string} projectId
   * @param {string} buildId
   * @return {Promise<void>}
   */
  // eslint-disable-next-line no-unused-vars
  async sealBuild(projectId, buildId) {
    const {sequelize, buildModel, runModel} = this._sql();
    let build = await this._findByPk(buildModel, buildId);
    if (!build) throw new E422('Invalid build');
    if (build.projectId !== projectId) throw new E422('Invalid project');
    build = {...clone(build), lifecycle: 'sealed'};

    const runs = await this.getRuns(projectId, buildId);
    if (!runs.length) throw new E422('Invalid build');

    const transaction = await sequelize.transaction();

    try {
      await buildModel.update({lifecycle: 'sealed'}, {where: {id: build.id}, transaction});

      const {representativeRuns} = await StorageMethod.createStatistics(this, build, {transaction});
      const runIds = representativeRuns.map(run => run.id);

      await runModel.update(
        {representative: true},
        {where: {id: {[Sequelize.Op.in]: runIds}}, transaction}
      );

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  /**
   * @param {string} projectId
   * @param {string} buildId
   * @return {Promise<LHCI.ServerCommand.Build | undefined>}
   */
  async findBuildById(projectId, buildId) {
    const {buildModel} = this._sql();
    const build = await this._findByPk(buildModel, buildId);
    if (build && build.projectId !== projectId) return undefined;
    return clone(build || undefined);
  }

  /**
   * @param {string} projectId
   * @param {string} buildId
   * @return {Promise<LHCI.ServerCommand.Build | undefined>}
   */
  async findAncestorBuildById(projectId, buildId) {
    const {buildModel} = this._sql();
    const build = await this._findByPk(buildModel, buildId);
    if (!build || (build && build.projectId !== projectId)) return undefined;

    if (build.ancestorHash) {
      const ancestorsByHash = await this._findAll(buildModel, {
        where: {projectId: build.projectId, hash: build.ancestorHash},
        limit: 1,
      });

      if (ancestorsByHash.length) return clone(ancestorsByHash[0]);
    }

    const where = {
      projectId: build.projectId,
      branch: 'master',
      id: {[Sequelize.Op.ne]: build.id},
    };

    const nearestBuildBefore = await buildModel.findAll({
      where: {...where, runAt: {[Sequelize.Op.lte]: build.runAt}},
      order: [['runAt', 'DESC']],
      limit: 1,
    });

    if (build.branch === 'master') {
      return nearestBuildBefore[0];
    }

    const nearestBuildAfter = await buildModel.findAll({
      where: {...where, runAt: {[Sequelize.Op.gte]: build.runAt}},
      order: [['runAt', 'ASC']],
      limit: 1,
    });

    /** @param {string} date */
    const getDateDistance = date =>
      Math.abs(new Date(date).getTime() - new Date(build.runAt).getTime());
    const candidates = nearestBuildBefore
      .concat(nearestBuildAfter)
      .sort((a, b) => getDateDistance(a.runAt) - getDateDistance(b.runAt));
    return clone(candidates[0]);
  }

  /**
   * @param {string} projectId
   * @param {string} buildId
   * @param {LHCI.ServerCommand.GetRunsOptions} [options]
   * @return {Promise<LHCI.ServerCommand.Run[]>}
   */
  async getRuns(projectId, buildId, options) {
    const {runModel} = this._sql();
    const runs = await this._findAll(runModel, {where: {...options, projectId, buildId}, order});
    return clone(runs);
  }

  /**
   * @param {string} projectId
   * @param {string} [buildId]
   * @return {Promise<Array<{url: string}>>}
   */
  async getUrls(projectId, buildId) {
    const {runModel} = this._sql();
    const runs = await this._findAll(runModel, {
      where: buildId ? {projectId, buildId} : {projectId},
      order: [['url', 'desc']],
      group: ['url'],
      attributes: ['url'],
    });

    return clone(runs.map(run => ({url: run.url})));
  }

  /**
   * @param {StrictOmit<LHCI.ServerCommand.Run, 'id'>} unsavedRun
   * @return {Promise<LHCI.ServerCommand.Run>}
   */
  async createRun(unsavedRun) {
    const {runModel} = this._sql();
    const build = await this.findBuildById(unsavedRun.projectId, unsavedRun.buildId);
    if (!build || build.lifecycle !== 'unsealed') throw new E422('Invalid build');
    if (unsavedRun.representative) throw new E422('Invalid representative value');

    const run = await runModel.create({...unsavedRun, representative: false, id: uuid.v4()});
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
   * @param {{transaction?: import('sequelize').Transaction}} [context]
   * @return {Promise<LHCI.ServerCommand.Statistic>}
   */
  async _createOrUpdateStatistic(unsavedStatistic, context) {
    const transaction = context && context.transaction;
    const {statisticModel} = this._sql();
    const existing = await statisticModel.findOne({
      where: {
        projectId: unsavedStatistic.projectId,
        buildId: unsavedStatistic.buildId,
        url: unsavedStatistic.url,
        name: unsavedStatistic.name,
      },
      transaction,
    });

    /** @type {LHCI.ServerCommand.Statistic} */
    let statistic;
    if (existing) {
      await statisticModel.update({...unsavedStatistic}, {where: {id: existing.id}, transaction});
      const updated = await this._findByPk(statisticModel, existing.id);
      if (!updated) throw new Error('Failed to update statistic');
      statistic = updated;
    } else {
      statistic = await statisticModel.create({...unsavedStatistic, id: uuid.v4()}, {transaction});
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
    const statistics = await this._findAll(statisticModel, {where: {projectId, buildId}, order});
    return clone(statistics);
  }
}

module.exports = SqlStorageMethod;

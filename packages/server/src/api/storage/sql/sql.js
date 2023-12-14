/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const path = require('path');
const log = require('debug')('lhci:server:sql');
const logVerbose = require('debug')('lhci:server:sql:verbose');
const uuid = require('uuid');
const {Umzug, SequelizeStorage} = require('umzug');
const {Sequelize, Op} = require('sequelize');
const {omit, padEnd} = require('@lhci/utils/src/lodash.js');
const {hashAdminToken, generateAdminToken} = require('../auth.js');
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
 * @return {boolean}
 */
function isUuid(id) {
  return (
    typeof id === 'string' &&
    !!id.match(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/)
  );
}

/**
 * @param {string} uuid
 * @param {string} filler
 */
function formatAsUuid(uuid, filler = '0') {
  const parts = padEnd(uuid, 32, filler).match(/\w{4}/g);
  if (!parts || parts.length !== 8) throw new Error('Invalid UUID');
  const [p1, p2, p3, p4, p5, p6, p7, p8] = parts;
  return `${p1}${p2}-${p3}-${p4}-${p5}-${p6}${p7}${p8}`;
}

/**
 * @param {string|undefined} id
 */
function validateUuidOrEmpty(id) {
  if (typeof id !== 'string') return undefined;
  if (isUuid(id)) return id;
  // Valid v4 UUID's always have the third segment start with 4, so this will never match, but passes
  // as a UUID to postgres.
  return `11111111-1111-1111-1111-111111111111`;
}

/**
 * @param {string|undefined} id
 */
function validatePartialUuidOrUndefined(id) {
  if (typeof id !== 'string') return undefined;
  if (id.match(/^[a-f0-9-]+$/)) return id;
  return undefined;
}

/**
 * @param {LHCI.ServerCommand.StorageOptions} options
 */
function createSequelize(options) {
  const dialect = options.sqlDialect;
  const sequelizeOptions = {
    logging: /** @param {*} msg */ msg => logVerbose('[sequelize]', msg),
    ...options.sequelizeOptions,
  };

  if (dialect === 'sqlite') {
    if (!options.sqlDatabasePath) throw new Error('Cannot use sqlite without a database path');
    return new Sequelize({
      ...sequelizeOptions,
      dialect: 'sqlite',
      storage: options.sqlDatabasePath,
    });
  }

  if (options.sqlDialectOptions && options.sqlDialectOptions.socketPath) {
    if (
      !options.sequelizeOptions ||
      !options.sequelizeOptions.database ||
      !options.sequelizeOptions.username ||
      !options.sequelizeOptions.password
    ) {
      throw new Error(
        `Cannot use ${dialect} with socketPath without database, username, or password`
      );
    }

    return new Sequelize(
      options.sequelizeOptions.database,
      options.sequelizeOptions.username,
      options.sequelizeOptions.password,
      {
        ...sequelizeOptions,
        dialect: options.sqlDialect,
        ssl: !!options.sqlConnectionSsl,
        dialectOptions: options.sqlDialectOptions,
      }
    );
  }

  if (!options.sqlConnectionUrl) throw new Error(`Cannot use ${dialect} without a database URL`);

  return new Sequelize(options.sqlConnectionUrl, {
    ...sequelizeOptions,
    ssl: !!options.sqlConnectionSsl,
    dialectOptions: options.sqlDialectOptions,
  });
}

/**
 * @param {import('sequelize').Sequelize} sequelize
 * @param {LHCI.ServerCommand.StorageOptions} options
 */
function createUmzug(sequelize, options) {
  return new Umzug({
    logger: {
      debug: msg => logVerbose('[umzug]', msg),
      warn: msg => logVerbose('[umzug]', msg),
      error: msg => logVerbose('[umzug]', msg),
      info: msg => logVerbose('[umzug]', msg),
    },
    storage: new SequelizeStorage({
      sequelize,
      tableName: options.sqlMigrationOptions && options.sqlMigrationOptions.tableName,
    }),
    context: {queryInterface: sequelize.getQueryInterface(), options},
    migrations: {
      glob: path.posix.join(__dirname.replaceAll('\\', '/'), 'migrations/*.js'),
      resolve: ({name, path, context}) => {
        if (!path) throw new Error('unexpected missing path');

        const migration = require(path);
        return {
          name,
          up: async () => migration.up(context),
          down: async () => migration.down(context),
        };
      },
    },
  });
}

/**
 * @param {LHCI.ServerCommand.Statistic} statistic
 * @return {LHCI.ServerCommand.Statistic}
 */
function normalizeStatistic(statistic) {
  return {...statistic, version: Number(statistic.version), value: Number(statistic.value)};
}

/** @typedef {LHCI.ServerCommand.TableAttributes<LHCI.ServerCommand.Project>} ProjectAttrs */
/** @typedef {LHCI.ServerCommand.TableAttributes<LHCI.ServerCommand.Build>} BuildAttrs */
/** @typedef {LHCI.ServerCommand.TableAttributes<LHCI.ServerCommand.Run>} RunAttrs */
/** @typedef {LHCI.ServerCommand.TableAttributes<LHCI.ServerCommand.Statistic>} StatisticAttrs */

/**
 * @typedef SqlState
 * @property {import('sequelize').Sequelize} sequelize
 * @property {import('sequelize').ModelDefined<LHCI.ServerCommand.Project, ProjectAttrs>} projectModel
 * @property {import('sequelize').ModelDefined<LHCI.ServerCommand.Build, BuildAttrs>} buildModel
 * @property {import('sequelize').ModelDefined<LHCI.ServerCommand.Run, RunAttrs>} runModel
 * @property {import('sequelize').ModelDefined<LHCI.ServerCommand.Statistic, StatisticAttrs>} statisticModel
 */

/**
 * Sort all records by most recently created
 * @type {import("sequelize").Order}
 */
const orderByCreated = [['createdAt', 'DESC']];

/**
 * Sort all records by name
 * @type {import("sequelize").Order}
 */
const orderByName = [['name', 'ASC']];

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
   * @template {Object} T1
   * @template {Object} T2
   * @param {import('sequelize').Model<T1, T2>} model
   * @return {T1}
   */
  _value(model) {
    return model.dataValues;
  }

  /**
   * @template {Object} T1
   * @template {Object} T2
   * @param {import('sequelize').Model<T1, T2> | null} model
   * @return {T1 | null}
   */
  _valueOrNull(model) {
    if (!model) return null;
    return model.dataValues;
  }

  /**
   * @template {Object} T1
   * @template {Object} T2
   * @param {import('sequelize').ModelDefined<T1, T2>} model
   * @param {string} pk
   * @return {Promise<T1 | null>}
   */
  async _findByPk(model, pk) {
    const result = await model.findByPk(validateUuidOrEmpty(pk));
    return this._valueOrNull(result);
  }

  /**
   * @template {Object} T1
   * @template {Object} T2
   * @param {import('sequelize').ModelDefined<T1, T2>} model
   * @param {import('sequelize').FindOptions<T1 & T2>} options
   * @return {Promise<T1[]>}
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

    const result = await model.findAll(options);
    return result.map(this._value);
  }

  /**
   * @param {LHCI.ServerCommand.StorageOptions} options
   * @return {Promise<void>}
   */
  async initialize(options) {
    if (!buildModelDefn.attributes.projectId.references) throw new Error('Invalid buildModel');
    if (!runModelDefn.attributes.projectId.references) throw new Error('Invalid runModel');
    if (!runModelDefn.attributes.buildId.references) throw new Error('Invalid runModel');
    if (!statisticModelDefn.attributes.projectId.references) throw new Error('Invalid runModel');
    if (!statisticModelDefn.attributes.buildId.references) throw new Error('Invalid runModel');

    log('[initialize] initializing database connection');
    const sequelize = createSequelize(options);

    log('[initialize] defining models');
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

    const umzug = createUmzug(sequelize, options);
    if (options.sqlDangerouslyResetDatabase) {
      log('[initialize] resetting database');
      await umzug.down({to: 0});
    }

    log('[initialize] running migrations');
    await umzug.up();
    log('[initialize] migrations performed');

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
    const projects = await this._findAll(projectModel, {order: orderByName});
    return projects.map(clone);
  }

  /**
   * @param {string} projectId
   * @return {Promise<void>}
   */
  async deleteProject(projectId) {
    const {sequelize, projectModel, buildModel, runModel, statisticModel} = this._sql();
    const project = await this._findByPk(projectModel, projectId);
    if (!project) throw new E422('Invalid project ID');

    const transaction = await sequelize.transaction();

    try {
      await statisticModel.destroy({where: {projectId}, transaction});
      await runModel.destroy({where: {projectId}, transaction});
      await buildModel.destroy({where: {projectId}, transaction});
      await projectModel.destroy({where: {id: projectId}, transaction});

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
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
   * @param {string} slug
   * @return {Promise<LHCI.ServerCommand.Project | undefined>}
   */
  async findProjectBySlug(slug) {
    const {projectModel} = this._sql();
    const projects = await this._findAll(projectModel, {where: {slug}});
    if (projects.length !== 1) return undefined;
    return clone(projects[0] || undefined);
  }

  /**
   * @param {StrictOmit<LHCI.ServerCommand.Project, 'id'|'token'|'adminToken'>} unsavedProject
   * @return {Promise<LHCI.ServerCommand.Project>}
   */
  async createProject(unsavedProject) {
    return StorageMethod.createProjectWithUniqueSlug(this, unsavedProject);
  }

  /**
   * @param {StrictOmit<LHCI.ServerCommand.Project, 'id'|'token'|'adminToken'>} unsavedProject
   * @return {Promise<LHCI.ServerCommand.Project>}
   */
  async _createProject(unsavedProject) {
    const {projectModel} = this._sql();
    if (typeof unsavedProject.name !== 'string') throw new E422('Project name missing');
    if (unsavedProject.name.length < 4) throw new E422('Project name too short');
    const projectId = uuid.v4();
    const adminToken = generateAdminToken();
    const project = await projectModel.create({
      ...unsavedProject,
      baseBranch: unsavedProject.baseBranch || 'master',
      adminToken: hashAdminToken(adminToken, projectId),
      token: uuid.v4(),
      id: projectId,
    });

    // Replace the adminToken with the original non-hashed version.
    // This will be the only time it's readable other than reset.
    return {...clone(this._value(project)), adminToken};
  }

  /**
   * @param {Pick<LHCI.ServerCommand.Project, 'id'|'baseBranch'|'externalUrl'|'name'>} projectUpdates
   * @return {Promise<void>}
   */
  async updateProject(projectUpdates) {
    const {projectModel} = this._sql();
    if (projectUpdates.name.length < 4) throw new E422('Project name too short');

    await projectModel.update(
      {
        name: projectUpdates.name,
        externalUrl: projectUpdates.externalUrl,
        baseBranch: projectUpdates.baseBranch,
      },
      {where: {id: projectUpdates.id}}
    );
  }

  /**
   * @param {string} projectId
   * @param {LHCI.ServerCommand.GetBuildsOptions} [options]
   * @return {Promise<LHCI.ServerCommand.Build[]>}
   */
  async getBuilds(projectId, options = {}) {
    const {buildModel} = this._sql();
    const builds = await this._findAll(buildModel, {
      where: {projectId, ...omit(options, ['limit'], {dropUndefined: true})},
      order: orderByCreated,
      limit: options.limit || 10,
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

    const existingWhere = {
      projectId: unsavedBuild.projectId,
      branch: unsavedBuild.branch,
      hash: unsavedBuild.hash,
    };
    const existingForHash = await buildModel.findOne({where: existingWhere});
    if (existingForHash) throw new E422(`Build already exists for hash "${unsavedBuild.hash}"`);

    const build = await buildModel.create({...unsavedBuild, id: uuid.v4()});
    return clone(this._value(build));
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

    log('[sealBuild] validating buildId');
    const runs = await this.getRuns(projectId, buildId);
    if (!runs.length) throw new E422('Invalid build');

    log('[sealBuild] starting transaction');
    const transaction = await sequelize.transaction();

    try {
      log('[sealBuild] updating lifecycle');
      await buildModel.update({lifecycle: 'sealed'}, {where: {id: build.id}, transaction});

      log('[sealBuild] creating statistics');
      const {representativeRuns} = await StorageMethod.createStatistics(this, build, {transaction});
      const runIds = representativeRuns.map(run => run.id);

      log('[sealBuild] updating run representative flag');
      await runModel.update({representative: true}, {where: {id: {[Op.in]: runIds}}, transaction});

      log('[sealBuild] committing transaction');
      await transaction.commit();
    } catch (err) {
      log('[sealBuild] rolling back transaction');
      await transaction.rollback();
      throw err;
    }
  }

  /**
   * @param {Date} runAt
   * @return {Promise<LHCI.ServerCommand.Build[]>}
   */
  async findBuildsBeforeTimestamp(runAt) {
    const {buildModel} = this._sql();
    const oldBuilds = await buildModel.findAll({
      where: {runAt: {[Op.lte]: runAt}},
      order: [['runAt', 'ASC']],
    });
    return oldBuilds.map(this._value);
  }

  /**
   * @param {string} projectId
   * @param {string} buildId
   * @return {Promise<void>}
   */
  async deleteBuild(projectId, buildId) {
    const {sequelize, buildModel, runModel, statisticModel} = this._sql();
    const build = await this._findByPk(buildModel, buildId);
    if (!build) throw new E422('Invalid build ID');
    if (build.projectId !== projectId) throw new E422('Invalid project ID');

    const transaction = await sequelize.transaction();

    try {
      await statisticModel.destroy({where: {projectId, buildId}, transaction});
      await runModel.destroy({where: {projectId, buildId}, transaction});
      await buildModel.destroy({where: {id: buildId}, transaction});

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
    if (isUuid(buildId)) {
      const build = await this._findByPk(buildModel, buildId);
      if (build && build.projectId !== projectId) return undefined;
      return clone(build || undefined);
    }

    if (!validatePartialUuidOrUndefined(buildId)) return undefined;

    // Postgres stores UUIDs as numbers so it's impossible to do a pattern match.
    // Instead we'll do a range check which works whether the UUID is treated as a string or a
    // number. For example...
    //
    // Given the prefix `a82fb732` we can look for all UUIDs that are...
    //      >= a82fb732-0000-0000-0000-000000000000
    //      <= a82fb732-ffff-ffff-ffff-ffffffffffff
    const [leadingZeros = ''] = buildId.match(/^0+/) || [];
    const numericValue = parseInt(buildId.replace(/-/g, ''), 16);
    // If the prefix *is* 0 we don't want to double count it.
    let prefix = numericValue.toString(16);
    if (numericValue !== 0) prefix = `${leadingZeros}${prefix}`;
    const lowerUuid = formatAsUuid(prefix, '0');
    const upperUuid = formatAsUuid(prefix, 'f');
    const builds = await buildModel.findAll({
      where: {id: {[Op.gte]: lowerUuid, [Op.lte]: upperUuid}, projectId},
      limit: 2,
    });

    if (builds.length !== 1) return undefined;
    return clone(this._value(builds[0]));
  }

  /**
   * @param {string} projectId
   * @param {string} buildId
   * @return {Promise<LHCI.ServerCommand.Build | undefined>}
   */
  async findAncestorBuildById(projectId, buildId) {
    const {projectModel, buildModel} = this._sql();
    const project = await this._findByPk(projectModel, projectId);
    const build = await this._findByPk(buildModel, buildId);
    if (!project || !build || (build && build.projectId !== projectId)) return undefined;

    if (build.ancestorHash) {
      const ancestorsByHash = await this._findAll(buildModel, {
        where: {projectId: build.projectId, branch: project.baseBranch, hash: build.ancestorHash},
        limit: 1,
      });

      if (ancestorsByHash.length) return clone(ancestorsByHash[0]);
    }

    const where = {
      projectId: build.projectId,
      branch: project.baseBranch,
      id: {[Op.ne]: build.id},
    };

    const nearestBuildBefore = await this._findAll(buildModel, {
      where: {...where, runAt: {[Op.lte]: build.runAt}},
      order: [['runAt', 'DESC']],
      limit: 1,
    });

    if (build.branch === project.baseBranch) {
      return nearestBuildBefore[0];
    }

    const nearestBuildAfter = await this._findAll(buildModel, {
      where: {...where, runAt: {[Op.gte]: build.runAt}},
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
    const runs = await this._findAll(runModel, {
      where: {...options, projectId, buildId},
      order: orderByCreated,
    });
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
    if (typeof unsavedRun.lhr !== 'string') throw new E422('Invalid LHR');
    if (unsavedRun.representative) throw new E422('Invalid representative value');
    if (unsavedRun.url.length > 256) throw new E422('URL too long');

    const run = await runModel.create({...unsavedRun, representative: false, id: uuid.v4()});
    return clone(this._value(run));
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
    logVerbose('[_createOrUpdateStatistic] looking up existing statistic');
    const existing = this._valueOrNull(
      await statisticModel.findOne({
        where: {
          projectId: unsavedStatistic.projectId,
          buildId: unsavedStatistic.buildId,
          url: unsavedStatistic.url,
          name: unsavedStatistic.name,
        },
        transaction,
      })
    );

    /** @type {LHCI.ServerCommand.Statistic} */
    let statistic;
    if (existing) {
      logVerbose('[_createOrUpdateStatistic] existing statistic found, updating data');
      await statisticModel.update({...unsavedStatistic}, {where: {id: existing.id}, transaction});
      const updated = await this._findByPk(statisticModel, existing.id);
      if (!updated) throw new Error('Failed to update statistic');
      statistic = updated;
    } else {
      logVerbose('[_createOrUpdateStatistic] no existing statistic found, creating one');
      statistic = this._value(
        await statisticModel.create({...unsavedStatistic, id: uuid.v4()}, {transaction})
      );
    }

    return normalizeStatistic(clone(statistic));
  }

  /**
   * @param {string} projectId
   * @param {string} buildId
   * @return {Promise<Array<LHCI.ServerCommand.Statistic>>}
   */
  async _getStatistics(projectId, buildId) {
    const {statisticModel} = this._sql();
    const statistics = await this._findAll(statisticModel, {
      where: {projectId, buildId},
      order: orderByCreated,
    });
    return clone(statistics).map(normalizeStatistic);
  }

  /**
   * @param {string} projectId
   * @param {string} buildId
   * @return {Promise<void>}
   */
  async _invalidateStatistics(projectId, buildId) {
    const {statisticModel} = this._sql();
    await statisticModel.update({version: 0}, {where: {projectId, buildId}});
  }

  /**
   * @param {string} projectId
   * @return {Promise<string>}
   */
  async _resetAdminToken(projectId) {
    const {projectModel} = this._sql();
    const newToken = generateAdminToken();
    await projectModel.update(
      {adminToken: hashAdminToken(newToken, projectId)},
      {where: {id: projectId}}
    );
    return newToken;
  }

  /**
   * @param {string} projectId
   * @return {Promise<string>}
   */
  async _resetProjectToken(projectId) {
    const {projectModel} = this._sql();
    const newToken = uuid.v4();
    await projectModel.update({token: newToken}, {where: {id: projectId}});
    return newToken;
  }
}

module.exports = SqlStorageMethod;

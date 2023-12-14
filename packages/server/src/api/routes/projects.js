/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const express = require('express');
const {
  handleAsyncError,
  validateBuildTokenMiddleware,
  validateAdminTokenMiddleware,
} = require('../express-utils.js');

/**
 * @param {{storageMethod: LHCI.ServerCommand.StorageMethod}} context
 * @return {import('express').Router}
 */
function createRouter(context) {
  const router = express.Router(); // eslint-disable-line new-cap

  // GET /projects
  router.get(
    '/',
    handleAsyncError(async (_, res) => {
      const projects = await context.storageMethod.getProjects();
      res.json(projects.map(project => ({...project, token: '', adminToken: ''})));
    })
  );

  // POST /projects
  router.post(
    '/',
    handleAsyncError(async (req, res) => {
      const unsavedProject = req.body;
      const project = await context.storageMethod.createProject(unsavedProject);
      res.json(project);
    })
  );

  // POST /projects/lookup
  router.post(
    '/lookup',
    handleAsyncError(async (req, res) => {
      const token = req.body.token;
      const project = await context.storageMethod.findProjectByToken(token);
      if (!project) return res.sendStatus(404);
      res.json({...project, adminToken: ''});
    })
  );

  // GET /projects/slug::id
  router.get(
    '/slug::projectSlug',
    handleAsyncError(async (req, res) => {
      const project = await context.storageMethod.findProjectBySlug(req.params.projectSlug);
      if (!project) return res.sendStatus(404);
      res.json({...project, token: '', adminToken: ''});
    })
  );

  // GET /projects/:id
  router.get(
    '/:projectId',
    handleAsyncError(async (req, res) => {
      const project = await context.storageMethod.findProjectById(req.params.projectId);
      if (!project) return res.sendStatus(404);
      res.json({...project, token: '', adminToken: ''});
    })
  );

  // PUT /projects/:id
  router.put(
    '/:projectId',
    validateAdminTokenMiddleware(context),
    handleAsyncError(async (req, res) => {
      await context.storageMethod.updateProject({
        ...req.body,
        id: req.params.projectId,
      });
      res.sendStatus(204);
    })
  );

  // DELETE /projects/:id
  router.delete(
    '/:projectId',
    validateAdminTokenMiddleware(context),
    handleAsyncError(async (req, res) => {
      await context.storageMethod.deleteProject(req.params.projectId);
      res.sendStatus(204);
    })
  );

  // GET /projects/<id>/builds
  router.get(
    '/:projectId/builds',
    handleAsyncError(async (req, res) => {
      if (Number.isInteger(parseInt(req.query.limit))) {
        req.query.limit = parseInt(req.query.limit);
      }
      const builds = await context.storageMethod.getBuilds(req.params.projectId, req.query);
      res.json(builds);
    })
  );

  // GET /projects/<id>/urls
  router.get(
    '/:projectId/urls',
    handleAsyncError(async (req, res) => {
      const urls = await context.storageMethod.getUrls(req.params.projectId);
      res.json(urls);
    })
  );

  // GET /projects/<id>/branches
  router.get(
    '/:projectId/branches',
    handleAsyncError(async (req, res) => {
      const branches = await context.storageMethod.getBranches(req.params.projectId);
      res.json(branches);
    })
  );

  // POST /projects/<id>/builds
  router.post(
    '/:projectId/builds',
    validateBuildTokenMiddleware(context),
    handleAsyncError(async (req, res) => {
      const unsavedBuild = req.body;
      unsavedBuild.projectId = req.params.projectId;
      const build = await context.storageMethod.createBuild(unsavedBuild);
      res.json(build);
    })
  );

  // DELETE /projects/<id>/builds/<id>
  router.delete(
    '/:projectId/builds/:buildId',
    validateAdminTokenMiddleware(context),
    handleAsyncError(async (req, res) => {
      await context.storageMethod.deleteBuild(req.params.projectId, req.params.buildId);
      res.sendStatus(204);
    })
  );

  // GET /projects/:id/builds/:id
  router.get(
    '/:projectId/builds/:buildId',
    handleAsyncError(async (req, res) => {
      const build = await context.storageMethod.findBuildById(
        req.params.projectId,
        req.params.buildId
      );

      if (!build) return res.sendStatus(404);
      res.json(build);
    })
  );

  // GET /projects/:id/builds/:id/ancestor
  router.get(
    '/:projectId/builds/:buildId/ancestor',
    handleAsyncError(async (req, res) => {
      const build = await context.storageMethod.findAncestorBuildById(
        req.params.projectId,
        req.params.buildId
      );

      if (!build) return res.sendStatus(404);
      res.json(build);
    })
  );

  // GET /projects/<id>/builds/<id>/runs
  router.get(
    '/:projectId/builds/:buildId/runs',
    handleAsyncError(async (req, res) => {
      if (typeof req.query.representative === 'string') {
        req.query.representative = req.query.representative === 'true';
      }

      const runs = await context.storageMethod.getRuns(
        req.params.projectId,
        req.params.buildId,
        req.query
      );
      res.json(runs);
    })
  );

  // POST /projects/<id>/builds/<id>/runs
  router.post(
    '/:projectId/builds/:buildId/runs',
    validateBuildTokenMiddleware(context),
    handleAsyncError(async (req, res) => {
      const unsavedRun = req.body;
      unsavedRun.projectId = req.params.projectId;
      unsavedRun.buildId = req.params.buildId;
      const run = await context.storageMethod.createRun(unsavedRun);
      res.json(run);
    })
  );

  // GET /projects/<id>/builds/<id>/urls
  router.get(
    '/:projectId/builds/:buildId/urls',
    handleAsyncError(async (req, res) => {
      const urls = await context.storageMethod.getUrls(req.params.projectId, req.params.buildId);
      res.json(urls);
    })
  );

  // PUT /projects/<id>/builds/<id>/lifecycle
  router.put(
    '/:projectId/builds/:buildId/lifecycle',
    validateBuildTokenMiddleware(context),
    handleAsyncError(async (req, res) => {
      if (req.body !== 'sealed') throw new Error('Invalid lifecycle');
      await context.storageMethod.sealBuild(req.params.projectId, req.params.buildId);
      res.sendStatus(204);
    })
  );

  // GET /projects/<id>/builds/<id>/statistics
  router.get(
    '/:projectId/builds/:buildId/statistics',
    handleAsyncError(async (req, res) => {
      const statistics = await context.storageMethod.getStatistics(
        req.params.projectId,
        req.params.buildId
      );
      res.json(statistics);
    })
  );

  return router;
}

module.exports = createRouter;

/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const express = require('express');
const {handleAsyncError} = require('../express-utils.js');

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
      res.json(projects);
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
      res.json(project);
    })
  );

  // GET /projects/:id
  router.get(
    '/:projectId',
    handleAsyncError(async (req, res) => {
      const project = await context.storageMethod.findProjectById(req.params.projectId);
      if (!project) return res.sendStatus(404);
      res.json(project);
    })
  );

  // GET /projects/:id/token
  router.get(
    '/:projectId/token',
    handleAsyncError(async (req, res) => {
      const project = await context.storageMethod.findProjectById(req.params.projectId);
      if (!project) return res.sendStatus(404);
      res.json({token: await context.storageMethod.getProjectToken(project)});
    })
  );

  // GET /projects/<id>/builds
  router.get(
    '/:projectId/builds',
    handleAsyncError(async (req, res) => {
      const builds = await context.storageMethod.getBuilds(req.params.projectId, req.query);
      res.json(builds);
    })
  );

  // POST /projects/<id>/builds
  router.post(
    '/:projectId/builds',
    handleAsyncError(async (req, res) => {
      const unsavedBuild = req.body;
      unsavedBuild.projectId = req.params.projectId;
      const build = await context.storageMethod.createBuild(unsavedBuild);
      res.json(build);
    })
  );

  // GET /projects/<id>/builds/<id>/runs
  router.get(
    '/:projectId/builds/:buildId/runs',
    handleAsyncError(async (req, res) => {
      const runs = await context.storageMethod.getRuns(req.params.projectId, req.params.buildId);
      res.json(runs);
    })
  );

  // POST /projects/<id>/builds/<id>/runs
  router.post(
    '/:projectId/builds/:buildId/runs',
    handleAsyncError(async (req, res) => {
      const unsavedBuild = req.body;
      unsavedBuild.projectId = req.params.projectId;
      unsavedBuild.buildId = req.params.buildId;
      const run = await context.storageMethod.createRun(unsavedBuild);
      res.json(run);
    })
  );

  return router;
}

module.exports = createRouter;

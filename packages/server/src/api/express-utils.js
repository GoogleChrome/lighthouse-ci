/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const basicAuth = require('express-basic-auth');
const ApiClient = require('@lhci/utils/src/api-client.js');
const {hashAdminToken} = require('./storage/auth.js');

class E404 extends Error {}
class E422 extends Error {}

module.exports = {
  E404,
  E422,
  /**
   * @param {import('express-serve-static-core').RequestHandler} handler
   * @return {import('express-serve-static-core').RequestHandler}
   */
  handleAsyncError(handler) {
    return (req, res, next) => {
      Promise.resolve()
        .then(() => handler(req, res, next))
        .catch(err => {
          if (err.name === 'SequelizeDatabaseError' && err.message.includes('value too long')) {
            next(new E422(err.message));
          } else {
            next(err);
          }
        });
    };
  },
  /**
   * @param {{storageMethod: LHCI.ServerCommand.StorageMethod}} context
   * @return {import('express-serve-static-core').RequestHandler}
   */
  validateBuildTokenMiddleware(context) {
    return (req, res, next) => {
      Promise.resolve()
        .then(async () => {
          const project = await context.storageMethod.findProjectById(req.params.projectId);
          if (!project) throw new Error('Invalid token');

          const buildToken = req.header('x-lhci-build-token') || '';
          if (buildToken !== project.token) throw new Error('Invalid token');

          next();
        })
        .catch(err => {
          res.status(403);
          res.send(JSON.stringify({message: err.message}));
        });
    };
  },
  /**
   * @param {{storageMethod: LHCI.ServerCommand.StorageMethod}} context
   * @return {import('express-serve-static-core').RequestHandler}
   */
  validateAdminTokenMiddleware(context) {
    return (req, res, next) => {
      Promise.resolve()
        .then(async () => {
          const project = await context.storageMethod.findProjectById(req.params.projectId);
          if (!project) throw new Error('Invalid token');

          const adminToken = req.header('x-lhci-admin-token') || '';
          const hashedAdminToken = hashAdminToken(adminToken, project.id);
          if (hashedAdminToken !== project.adminToken) throw new Error('Invalid token');

          next();
        })
        .catch(err => {
          res.status(403);
          res.send(JSON.stringify({message: err.message}));
        });
    };
  },
  /**
   * @param {{options: LHCI.ServerCommand.Options}} context
   * @return {import('express-serve-static-core').RequestHandler|undefined}
   */
  createBasicAuthMiddleware(context) {
    if (!context.options.basicAuth) return undefined;
    const {username = ApiClient.DEFAULT_BASIC_AUTH_USERNAME, password} = context.options.basicAuth;
    if (!password) return undefined;

    return basicAuth({users: {[username]: password}, challenge: true});
  },
  /**
   * @param {Error} err
   * @param {import('express-serve-static-core').Request} req
   * @param {import('express-serve-static-core').Response} res
   * @param {*} next
   */
  errorMiddleware(err, req, res, next) {
    if (err instanceof E422) {
      res.status(422);
      res.send(JSON.stringify({message: err.message}));
      return;
    }

    if (err instanceof E404) {
      res.status(404);
      res.send(JSON.stringify({message: err.message}));
      return;
    }

    next(err);
  },
};

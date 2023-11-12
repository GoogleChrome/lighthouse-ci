/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const path = require('path');
const inquirer = require('inquirer');
const {getGitHubRepoSlug} = require('@lhci/utils/src/build-context.js');
const ApiClient = require('@lhci/utils/src/api-client.js');
const _ = require('@lhci/utils/src/lodash.js');
const log = require('lighthouse-logger');
const {assertOptionalDependency} = require('../utils.js');
const fetch = require('../fetch.js');

/**
 * @param {import('yargs').Argv} yargs
 */
function buildCommand(yargs) {
  return yargs;
}

/**
 * @param {LHCI.WizardCommand.Options} options
 * @return {Promise<void>}
 */
async function runNewProjectWizard(options) {
  const repoSlug = getGitHubRepoSlug();
  const fallbackProjectName = path.basename(process.cwd());
  const [defaultProjectName = fallbackProjectName] = (repoSlug && repoSlug.match(/[^/]+$/)) || [];

  const responses = await inquirer.prompt([
    {
      type: 'input',
      name: 'serverBaseUrl',
      message: 'What is the URL of your LHCI server?',
      default: options.serverBaseUrl || 'https://your-lhci-server.example.com/',
    },
    {
      type: 'input',
      name: 'projectName',
      message: 'What would you like to name the project?',
      validate: input => !!input.length,
      default: defaultProjectName,
    },
    {
      type: 'input',
      name: 'projectExternalUrl',
      message: "Where is the project's code hosted?",
      default: `https://github.com/${repoSlug || '<org>/<repo>'}`,
    },
    {
      type: 'input',
      name: 'projectBaseBranch',
      message: "What branch is considered the repo's trunk or main branch?",
      default: 'master',
    },
  ]);

  const api = new ApiClient({
    fetch,
    ...options,
    rootURL: responses.serverBaseUrl || options.serverBaseUrl,
  });
  const project = await api.createProject({
    name: responses.projectName,
    externalUrl: responses.projectExternalUrl,
    baseBranch: responses.projectBaseBranch,
    slug: '', // this property is dynamically generated server-side
  });

  const token = project.token;
  const adminToken = project.adminToken;
  const adminWarning = 'to manage data. KEEP THIS SECRET!';
  process.stdout.write(`Created project ${project.name} (${project.id})!\n`);
  process.stdout.write(`Use build token ${log.bold}${token}${log.reset} to add data.\n`);
  if (adminToken) {
    process.stdout.write(`Use admin token ${log.bold}${adminToken}${log.reset} ${adminWarning}\n`);
  } else {
    process.stdout.write(
      [
        `WARNING: The server you've used is out-of-date and cannot issue admin tokens.`,
        `         Upgrade your server to take advantage of administrator functions.`,
        '',
      ].join('\n')
    );
  }
}

/**
 * @param {'admin'|'build'} type
 * @param {LHCI.WizardCommand.Options} options
 * @return {Promise<void>}
 */
async function runResetTokenWizard(type, options) {
  if (!options.storage) {
    throw new Error(`Cannot run ${type} token wizard without a storage configuration`);
  }

  // Require this only when run since `@lhci/server` is an optional dependency
  assertOptionalDependency('@lhci/server');
  // eslint-disable-next-line import/no-extraneous-dependencies
  const StorageMethod = require('@lhci/server/src/api/storage/storage-method.js');

  const storageMethod = StorageMethod.from(options.storage);
  await storageMethod.initialize(options.storage);
  const projects = await storageMethod.getProjects();

  process.stdout.write(`\nYou are about to reset the ${type} token for an LHCI project.\n`);
  process.stdout.write(`WARNING: all current token holders will be locked out and will need to `);
  process.stdout.write(`re-enter the new ${type} token to retain their privileges.\n\n`);
  process.stdout.write(`THIS ACTION CANNOT BE UNDONE\nPress Ctrl+C at any time to cancel.\n\n`);

  const {project, confirmationName} = await inquirer.prompt([
    {
      type: 'list',
      name: 'project',
      message: 'Which project would you like to reset?',
      choices: projects
        .map(project => ({
          name: project.name,
          value: project,
        }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    },
    {
      type: 'input',
      name: 'confirmationName',
      message: answers => `Type "${answers.project.name}" to confirm the token reset.`,
    },
  ]);

  if (project.name !== confirmationName && project.name !== `"${confirmationName}"`) {
    process.stdout.write(`${confirmationName} did not match ${project.name}, cancelling.`);
    return;
  }

  const newToken =
    type === 'admin'
      ? await storageMethod._resetAdminToken(project.id)
      : await storageMethod._resetProjectToken(project.id);
  const adminWarning = type === 'admin' ? ' to manage data. KEEP THIS SECRET!' : '';
  process.stdout.write(`Reset token for project ${project.name} (${project.id})!\n`);
  process.stdout.write(`Use ${type} token ${log.bold}${newToken}${log.reset}${adminWarning}\n`);
}

/**
 * @param {LHCI.WizardCommand.Options} options
 * @return {Promise<void>}
 */
async function runCommand(options) {
  const whichWizardPrompt = options.wizard
    ? options
    : await inquirer.prompt([
        {
          type: 'list',
          name: 'wizard',
          message: 'Which wizard do you want to run?',
          choices: ['new-project', 'reset-build-token', 'reset-admin-token'],
        },
      ]);

  switch (whichWizardPrompt.wizard) {
    case 'new-project':
      await runNewProjectWizard(options);
      break;
    case 'reset-build-token':
      await runResetTokenWizard('build', options);
      break;
    case 'reset-admin-token':
      await runResetTokenWizard('admin', options);
      break;
    default:
      throw new Error(`Unrecognized wizard: ${whichWizardPrompt.wizard}`);
  }
}

module.exports = {buildCommand, runCommand};

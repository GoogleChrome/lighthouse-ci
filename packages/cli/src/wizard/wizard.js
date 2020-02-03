/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const inquirer = require('inquirer');
const ApiClient = require('@lhci/utils/src/api-client.js');
const _ = require('@lhci/utils/src/lodash.js');
const log = require('lighthouse-logger');

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
    },
    {
      type: 'input',
      name: 'projectExternalUrl',
      message: "Where is the project's code hosted?",
      default: 'https://github.com/<org>/<repo>',
    },
  ]);

  const api = new ApiClient({
    rootURL: responses.serverBaseUrl || options.serverBaseUrl,
    extraHeaders: options.extraHeaders || {},
  });
  const project = await api.createProject({
    name: responses.projectName,
    externalUrl: responses.projectExternalUrl,
    slug: '', // this property is dynamically generated server-side
  });

  const token = project.token;
  process.stdout.write(`Created project ${project.name} (${project.id})!\n`);
  process.stdout.write(`Use token ${log.bold}${token}${log.reset} to connect.\n`);
}

/**
 * @param {LHCI.WizardCommand.Options} options
 * @return {Promise<void>}
 */
async function runCommand(options) {
  const whichWizardPrompt = await inquirer.prompt([
    {
      type: 'list',
      name: 'wizard',
      message: 'Which wizard do you want to run?',
      choices: ['new-project'],
    },
  ]);

  switch (whichWizardPrompt.wizard) {
    case 'new-project':
      await runNewProjectWizard(options);
      break;
    default:
      throw new Error(`Unrecognized wizard: ${whichWizardPrompt.wizard}`);
  }
}

module.exports = {buildCommand, runCommand};

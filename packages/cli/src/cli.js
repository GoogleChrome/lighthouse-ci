#!/usr/bin/env node
/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const yargs = require('yargs');
const loadAndParseRcFile = require('@lhci/utils/src/lighthouserc.js').loadAndParseRcFile;
const getVersion = require('@lhci/utils/src/version.js').getVersion;
const assertCmd = require('./assert/assert.js');
const uploadCmd = require('./upload/upload.js');
const collectCmd = require('./collect/collect.js');
const serverCmd = require('./server/server.js');
const wizardCmd = require('./wizard/wizard.js');
const openCmd = require('./open/open.js');

async function run() {
  /** @type {any} */
  const argv = yargs
    .help('help')
    .version(getVersion())
    .usage('lhci <command> <options>')
    .env('LHCI')
    .config('rc-file', loadAndParseRcFile)
    .demand(1)
    .command('collect', 'Run Lighthouse and save the results to a local folder', commandYargs =>
      collectCmd.buildCommand(commandYargs)
    )
    .command('upload', 'Save the results to the server', commandYargs =>
      uploadCmd.buildCommand(commandYargs)
    )
    .command('assert', 'Assert that the latest results meet expectations', commandYargs =>
      assertCmd.buildCommand(commandYargs)
    )
    .command('open', 'Opens the HTML reports of collected runs', commandYargs =>
      openCmd.buildCommand(commandYargs)
    )
    .command('wizard', 'Step-by-step wizard for CI tasks like creating a project', commandYargs =>
      wizardCmd.buildCommand(commandYargs)
    )
    .command('server', 'Run Lighthouse CI server', commandYargs =>
      serverCmd.buildCommand(commandYargs)
    ).argv;

  switch (argv._[0]) {
    case 'collect':
      await collectCmd.runCommand(argv);
      break;
    case 'assert':
      await assertCmd.runCommand(argv);
      break;
    case 'upload':
      await uploadCmd.runCommand(argv);
      break;
    case 'server': {
      const {port} = await serverCmd.runCommand(argv);
      process.stdout.write(`Server listening on port ${port}\n`);
      // Keep the server open indefinitely
      await new Promise(_ => {});
      break;
    }
    case 'wizard':
      await wizardCmd.runCommand(argv);
      break;
    case 'open':
      await openCmd.runCommand(argv);
      break;
    default:
      throw new Error(`Unrecognized command ${argv._[0]}`);
  }

  process.exit(0);
}

run().catch(err => {
  if (err.stderr) process.stderr.write(err.stderr);
  process.stderr.write(err.stack);
  process.exit(1);
});

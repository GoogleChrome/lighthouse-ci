#!/usr/bin/env node
/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const yargs = require('yargs');
const yargsParser = require('yargs-parser');
const updateNotifier = require('update-notifier');
const {
  loadAndParseRcFile,
  hasOptedOutOfRcDetection,
  findRcFile,
} = require('@lhci/utils/src/lighthouserc.js');
const assertCmd = require('./assert/assert.js');
const autorunCmd = require('./autorun/autorun.js');
const healthcheckCmd = require('./healthcheck/healthcheck.js');
const uploadCmd = require('./upload/upload.js');
const collectCmd = require('./collect/collect.js');
const serverCmd = require('./server/server.js');
const wizardCmd = require('./wizard/wizard.js');
const openCmd = require('./open/open.js');
const pkg = require('../package.json');

updateNotifier({pkg}).notify({defer: false});

/** @return {[string, (path: string) => LHCI.YargsOptions]|[LHCI.YargsOptions]} */
function createYargsConfigArguments() {
  const simpleArgv = yargsParser(process.argv.slice(2), {envPrefix: 'LHCI'});
  /** @type {[string, (path: string) => LHCI.YargsOptions]} */
  const configOption = ['config', loadAndParseRcFile];
  // If they're using the config option or opting out of auto-detection, use the config option.
  if (simpleArgv.config || hasOptedOutOfRcDetection()) return configOption;
  const rcFile = findRcFile();
  // If they don't currently have an rc file, use the config option for awareness.
  if (!rcFile) return configOption;
  return [loadAndParseRcFile(rcFile)];
}

async function run() {
  /** @type {any} */
  const argv = yargs
    .help('help')
    .version(pkg.version)
    .usage('lhci <command> <options>')
    .env('LHCI')
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
    .command('autorun', 'Run collect/assert/upload with sensible defaults', commandYargs =>
      autorunCmd.buildCommand(commandYargs)
    )
    .command('healthcheck', 'Run diagnostics to ensure a valid configuration', commandYargs =>
      healthcheckCmd.buildCommand(commandYargs)
    )
    .command('open', 'Opens the HTML reports of collected runs', commandYargs =>
      openCmd.buildCommand(commandYargs)
    )
    .command('wizard', 'Step-by-step wizard for CI tasks like creating a project', commandYargs =>
      wizardCmd.buildCommand(commandYargs)
    )
    .command('server', 'Run Lighthouse CI server', commandYargs =>
      serverCmd.buildCommand(commandYargs)
    )
    .option('no-lighthouserc', {
      type: 'boolean',
      description: 'Disables automatic usage of a .lighthouserc file.',
    })
    // This must appear last because we lose the type of yargs once we do the `ts-ignore`
    // @ts-ignore - yargs types won't accept our bifurcated type
    .config(...createYargsConfigArguments()).argv;

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
    case 'autorun':
      await autorunCmd.runCommand(argv);
      break;
    case 'healthcheck':
      await healthcheckCmd.runCommand(argv);
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
  process.stderr.write(err.stack);
  if (err.stdout) process.stderr.write('\n' + err.stdout.slice(0, 4000));
  if (err.stderr) process.stderr.write('\n' + err.stderr);
  process.exit(1);
});

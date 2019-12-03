/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const path = require('path');
const ChromeLauncher = require('chrome-launcher').Launcher;
const FallbackServer = require('./fallback-server.js');
const LighthouseRunner = require('./lighthouse-runner.js');
const PuppeteerManager = require('./puppeteer-manager.js');
const {saveLHR, clearSavedLHRs} = require('@lhci/utils/src/saved-reports.js');
const {
  runCommandAndWaitForPattern,
  killProcessTree,
} = require('@lhci/utils/src/child-process-helper.js');

/**
 * @param {import('yargs').Argv} yargs
 */
function buildCommand(yargs) {
  return yargs.options({
    method: {type: 'string', choices: ['node'], default: 'node'},
    headful: {type: 'boolean', description: 'Run with a headful Chrome'},
    additive: {type: 'boolean', description: 'Skips clearing of previous collect data'},
    url: {
      description:
        'A URL to run Lighthouse on. Use this flag multiple times to evaluate multiple URLs.',
    },
    staticDistDir: {
      description: 'The build directory where your HTML files to run Lighthouse on are located.',
    },
    chromePath: {
      description: 'The path to the Chrome or Chromium executable to use for collection.',
      default: process.env.CHROME_PATH || ChromeLauncher.getInstallations()[0],
    },
    puppeteerScript: {
      description:
        'The path to a script that manipulates the browser with puppeteer before running Lighthouse, used for auth.',
    },
    puppeteerLaunchOptions: {
      description: 'The object of puppeteer launch options',
    },
    startServerCommand: {
      description: 'The command to run to start the server.',
    },
    settings: {description: 'The Lighthouse settings and flags to use when collecting'},
    numberOfRuns: {
      alias: 'n',
      description: 'The number of times to run Lighthouse.',
      default: 3,
      type: 'number',
    },
  });
}

/**
 * @param {string} url
 * @param {LHCI.CollectCommand.Options} options
 * @param {{puppeteer: import('./puppeteer-manager.js')}} context
 * @return {Promise<void>}
 */
async function runOnUrl(url, options, context) {
  const runner = new LighthouseRunner();
  process.stdout.write(`Running Lighthouse ${options.numberOfRuns} time(s) on ${url}\n`);

  const baseSettings = options.settings || {};
  const settings = context.puppeteer.isActive()
    ? {...baseSettings, port: await context.puppeteer.getBrowserPort()}
    : baseSettings;

  for (let i = 0; i < options.numberOfRuns; i++) {
    process.stdout.write(`Run #${i + 1}...`);
    try {
      const lhr = await runner.runUntilSuccess(url, {
        headful: options.headful,
        settings,
      });
      saveLHR(lhr);
      process.stdout.write('done.\n');
    } catch (err) {
      process.stdout.write('failed!\n');
      throw err;
    }
  }
}

/**
 * @param {LHCI.CollectCommand.Options} options
 * @return {Promise<{urls: Array<string>, close: () => Promise<void>}>}
 */
async function startServerAndDetermineUrls(options) {
  const urlsAsArray = Array.isArray(options.url) ? options.url : options.url ? [options.url] : [];
  if (!options.staticDistDir) {
    let close = async () => undefined;
    if (options.startServerCommand) {
      const {child, patternMatch, stdout, stderr} = await runCommandAndWaitForPattern(
        options.startServerCommand,
        /(listen|ready)/i,
        {timeout: 10000}
      );
      process.stdout.write(`Started a web server with "${options.startServerCommand}"...\n`);
      close = () => killProcessTree(child.pid);

      if (!patternMatch) {
        process.stdout.write(`WARNING: Timed out waiting for the server to start listening.\n`);
        process.stdout.write(`         Ensure the server prints "listening" when it is ready.\n`);
        if (process.env.CI) process.stderr.write(`\nServer Output:\n${stdout}\n${stderr}\n`);
      }
    }

    return {
      urls: urlsAsArray,
      close,
    };
  }

  const pathToBuildDir = path.resolve(process.cwd(), options.staticDistDir);
  const server = new FallbackServer(pathToBuildDir);
  await server.listen();
  process.stdout.write(`Started a web server on port ${server.port}...\n`);

  const urls = urlsAsArray;
  if (!urls.length) {
    urls.push(...server.getAvailableUrls());
  }

  urls.forEach((rawUrl, i) => {
    const url = new URL(rawUrl, 'http://localhost');
    url.port = server.port.toString();
    urls[i] = url.href;
  });

  return {urls, close: async () => server.close()};
}

/**
 * @param {LHCI.CollectCommand.Options} options
 * @return {Promise<void>}
 */
async function runCommand(options) {
  if (options.method !== 'node') throw new Error(`Method "${options.method}" not yet supported`);
  if (!options.additive) clearSavedLHRs();

  const puppeteer = new PuppeteerManager(options);
  const {urls, close} = await startServerAndDetermineUrls(options);
  try {
    for (const url of urls) {
      await puppeteer.invokePuppeteerScriptForUrl(url);
      await runOnUrl(url, options, {puppeteer});
    }
  } finally {
    await close();
  }

  process.stdout.write(`Done running Lighthouse!\n`);
}

module.exports = {buildCommand, runCommand};

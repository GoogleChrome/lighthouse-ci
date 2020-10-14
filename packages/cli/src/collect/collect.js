/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const path = require('path');
const yargsParser = require('yargs-parser');
const {determineChromePath} = require('../utils.js');
const FallbackServer = require('./fallback-server.js');
const PsiRunner = require('@lhci/utils/src/psi-runner.js');
const NodeRunner = require('./node-runner.js');
const PuppeteerManager = require('./puppeteer-manager.js');
const {saveLHR, clearSavedReportsAndLHRs} = require('@lhci/utils/src/saved-reports.js');
const {
  runCommandAndWaitForPattern,
  killProcessTree,
} = require('@lhci/utils/src/child-process-helper.js');

/**
 * @param {import('yargs').Argv} yargs
 */
function buildCommand(yargs) {
  /** @type {any} */
  const naiveOptions = yargsParser(process.argv);

  return yargs.options({
    method: {
      type: 'string',
      description:
        'The method of running Lighthouse to use. PSI will send the URL to a Google API and only be able to access URLs publicly available on the internet.',
      choices: ['node', 'psi'],
      default: 'node',
    },
    headful: {type: 'boolean', description: 'Run with a headful Chrome'},
    additive: {type: 'boolean', description: 'Skips clearing of previous collect data'},
    url: {
      description:
        'A URL to run Lighthouse on. Use this flag multiple times to evaluate multiple URLs.',
    },
    autodiscoverUrlBlocklist: {
      description:
        'A URL to not include when autodiscovering urls from staticDistDir. Use this flag multiple times to filter multiple URLs.',
    },
    psiApiKey: {
      description: '[psi only] The API key to use for PageSpeed Insights runner method.',
    },
    staticDistDir: {
      description: 'The build directory where your HTML files to run Lighthouse on are located.',
    },
    isSinglePageApplication: {
      description:
        'If the application is created by Single Page Application, enable redirect to index.html.',
    },
    chromePath: {
      description: 'The path to the Chrome or Chromium executable to use for collection.',
      default: determineChromePath(naiveOptions),
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
    startServerReadyPattern: {
      description: 'String pattern to listen for started server.',
      type: 'string',
      default: 'listen|ready',
    },
    startServerReadyTimeout: {
      description: 'The number of milliseconds to wait for the server to start before continuing',
      type: 'number',
      default: 10000,
    },
    settings: {description: 'The Lighthouse settings and flags to use when collecting'},
    numberOfRuns: {
      alias: 'n',
      description: 'The number of times to run Lighthouse.',
      default: 3,
      type: 'number',
    },
    maxAutodiscoverUrls: {
      description:
        'The maximum number of pages to collect when using the staticDistDir option with no specified URLs. Disable this limit by setting to 0.',
      default: 5,
      type: 'number',
    },
  });
}

/** @param {LHCI.CollectCommand.Options} options @return {LHCI.CollectCommand.Runner} */
function getRunner(options) {
  if (options.method === 'psi') return new PsiRunner();
  return new NodeRunner();
}

/**
 * @param {string} url
 * @param {LHCI.CollectCommand.Options} options
 * @param {{puppeteer: import('./puppeteer-manager.js')}} context
 * @return {Promise<void>}
 */
async function runOnUrl(url, options, context) {
  const runner = getRunner(options);
  process.stdout.write(`Running Lighthouse ${options.numberOfRuns} time(s) on ${url}\n`);

  const baseSettings = options.settings || {};
  const settings = context.puppeteer.isActive()
    ? {...baseSettings, port: await context.puppeteer.getBrowserPort()}
    : baseSettings;

  for (let i = 0; i < options.numberOfRuns; i++) {
    process.stdout.write(`Run #${i + 1}...`);
    try {
      const lhr = await runner.runUntilSuccess(url, {
        ...options,
        settings,
      });
      saveLHR(lhr);
      process.stdout.write('done.\n');

      // PSI caches results for a minute. Ensure each run is unique by waiting 60s between runs.
      if (options.method === 'psi' && i < options.numberOfRuns - 1) {
        await new Promise(r => setTimeout(r, PsiRunner.CACHEBUST_TIMEOUT));
      }
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
    if (!urlsAsArray.length) throw new Error(`No URLs provided to collect`);

    let close = async () => undefined;
    if (options.startServerCommand) {
      const regexPattern = new RegExp(options.startServerReadyPattern, 'i');
      const {child, patternMatch, stdout, stderr} = await runCommandAndWaitForPattern(
        options.startServerCommand,
        regexPattern,
        {timeout: options.startServerReadyTimeout}
      );
      process.stdout.write(`Started a web server with "${options.startServerCommand}"...\n`);
      close = () => killProcessTree(child.pid);

      if (!patternMatch) {
        // This `message` variable is only for readability.
        const message = `Ensure the server prints a pattern that matches ${regexPattern} when it is ready.\n`;
        process.stdout.write(`WARNING: Timed out waiting for the server to start listening.\n`);
        process.stdout.write(`         ${message}`);
        if (process.env.CI) process.stderr.write(`\nServer Output:\n${stdout}\n${stderr}\n`);
      }
    }

    return {
      urls: urlsAsArray,
      close,
    };
  }

  const pathToBuildDir = path.resolve(process.cwd(), options.staticDistDir);
  const server = new FallbackServer(pathToBuildDir, options.isSinglePageApplication);
  await server.listen();
  process.stdout.write(`Started a web server on port ${server.port}...\n`);

  const urls = urlsAsArray;
  if (!urls.length) {
    const maxNumberOfUrls = options.maxAutodiscoverUrls || Infinity;
    const autodiscoverUrlBlocklistAsArray = Array.isArray(options.autodiscoverUrlBlocklist)
      ? options.autodiscoverUrlBlocklist
      : options.autodiscoverUrlBlocklist
      ? [options.autodiscoverUrlBlocklist]
      : [];
    const availableUrls = server.getAvailableUrls();
    const normalizedBlocklist = autodiscoverUrlBlocklistAsArray.map(rawUrl => {
      const url = new URL(rawUrl, 'http://localhost');
      url.port = server.port.toString();
      return url.href;
    });
    const urlsToUse = availableUrls
      .filter(url => !normalizedBlocklist.includes(url))
      .slice(0, maxNumberOfUrls);
    urls.push(...urlsToUse);
  }

  if (!urls.length) {
    throw new Error(`No URLs provided to collect and no HTML files found in staticDistDir`);
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
 * @return {void}
 */
function checkIgnoredChromeFlagsOption(options) {
  const usePuppeteerScript = !!options.puppeteerScript;
  const useChromeFlags = options.settings ? !!options.settings.chromeFlags : false;

  if (usePuppeteerScript && useChromeFlags) {
    process.stderr.write(`WARNING: collect.settings.chromeFlags option will be ignored.\n`);
    process.stderr.write(
      `WARNING: If you want chromeFlags with puppeteerScript, use collect.puppeteerLaunchOptions.args option.\n`
    );
  }
}

/**
 * @param {LHCI.CollectCommand.Options} options
 * @return {Promise<void>}
 */
async function runCommand(options) {
  if (!options.additive) clearSavedReportsAndLHRs();

  checkIgnoredChromeFlagsOption(options);

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

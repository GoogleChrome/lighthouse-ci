/**
 * @license Copyright 2020 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const {CronJob} = require('cron');
const {getGravatarUrlFromEmail} = require('@lhci/utils/src/build-context');
const PsiRunner = require('@lhci/utils/src/psi-runner.js');

/**
 * @param {LHCI.ServerCommand.StorageMethod} storageMethod
 * @param {PsiRunner} psi
 * @param {LHCI.ServerCommand.AutocollectEntry} site
 * @return {Promise<void>}
 */
async function autocollectForProject(storageMethod, psi, site) {
  const {urls, buildToken, numberOfRuns = 3} = site;
  const project = await storageMethod.findProjectByToken(buildToken);
  if (!project) throw new Error(`Invalid build token "${buildToken}"`);
  if (!urls || !urls.length) throw new Error('No URLs set');

  const build = await storageMethod.createBuild({
    projectId: project.id,
    lifecycle: 'unsealed',
    branch: site.branch || project.baseBranch,
    externalBuildUrl: urls[0],

    commitMessage: `Autocollected at ${new Date().toLocaleString()}`,
    author: `Lighthouse CI Server <no-reply@example.com>`,
    avatarUrl: getGravatarUrlFromEmail('no-reply@example.com'),
    hash: Date.now()
      .toString(16)
      .split('')
      .reverse()
      .join(''),

    runAt: new Date().toISOString(),
    committedAt: new Date().toISOString(),
  });

  // Run all URLs in parallel
  await Promise.all(
    urls.map(async url => {
      for (let i = 0; i < numberOfRuns; i++) {
        const lhr = await psi.runUntilSuccess(url);
        await storageMethod.createRun({
          projectId: project.id,
          buildId: build.id,
          representative: false,
          url,
          lhr,
        });

        // If we're not on the last one, wait at least 60s before trying again to cachebust PSI
        if (i !== numberOfRuns - 1) {
          await new Promise(r => setTimeout(r, psi.CACHEBUST_TIMEOUT));
        }
      }
    })
  );
}

/**
 * @param {LHCI.ServerCommand.StorageMethod} storageMethod
 * @param {LHCI.ServerCommand.Options} options
 * @return {void}
 */
function startAutocollectCron(storageMethod, options) {
  if (!options.autocollect) return;

  /** @type {(msg: string) => void} */
  const log = options.logLevel === 'silent' ? () => {} : msg => process.stdout.write(msg);

  const psi = new PsiRunner(options.autocollect);
  for (const site of options.autocollect.sites) {
    const index = options.autocollect.sites.indexOf(site);
    const label = site.label || `Site #${index}`;
    const cron = new CronJob(site.schedule, () => {
      log(`${new Date().toISOString()} - Starting autocollection for ${label}\n`);
      autocollectForProject(storageMethod, psi, site)
        .then(() => {
          log(`${new Date().toISOString()} - Successfully completed autocollection for ${label}\n`);
        })
        .catch(err => {
          process.stderr.write(`Autocollection for ${label} failed.\n${err.stack}\n`);
        });
    });
    cron.start();
  }
}

module.exports = {startAutocollectCron, autocollectForProject};

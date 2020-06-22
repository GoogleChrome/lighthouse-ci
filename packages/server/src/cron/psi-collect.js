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
 * @param {string} schedule
 * @return {string}
 */
function normalizeCronSchedule(schedule) {
  if (typeof schedule !== 'string') {
    throw new Error(`Schedule must be provided`);
  }

  if (process.env.OVERRIDE_SCHEDULE_FOR_TEST) {
    return process.env.OVERRIDE_SCHEDULE_FOR_TEST;
  }

  const parts = schedule.split(/\s+/).filter(Boolean);
  if (parts.length !== 5) {
    throw new Error(`Invalid cron format, expected <minutes> <hours> <day> <month> <day of week>`);
  }

  if (parts[0] === '*') {
    throw new Error(`Cron schedule "${schedule}" is too frequent`);
  }

  return ['0', ...parts].join(' ');
}

/**
 * @param {LHCI.ServerCommand.StorageMethod} storageMethod
 * @param {PsiRunner} psi
 * @param {LHCI.ServerCommand.PsiCollectEntry} site
 * @return {Promise<void>}
 */
async function psiCollectForProject(storageMethod, psi, site) {
  const {urls, projectSlug, numberOfRuns = 5} = site;
  const project = await storageMethod.findProjectBySlug(projectSlug);
  if (!project) throw new Error(`Invalid project slug "${projectSlug}"`);
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

  await storageMethod.sealBuild(build.projectId, build.id);
}

/**
 * @param {LHCI.ServerCommand.StorageMethod} storageMethod
 * @param {LHCI.ServerCommand.Options} options
 * @return {void}
 */
function startPsiCollectCron(storageMethod, options) {
  if (!options.psiCollectCron) return;
  const uniqueProjectBranches = new Set(
    options.psiCollectCron.sites.map(site => `${site.projectSlug}@${site.branch}`)
  );

  if (uniqueProjectBranches.size < options.psiCollectCron.sites.length) {
    throw new Error('Cannot configure more than one cron per project-branch pair');
  }

  /** @type {(msg: string) => void} */
  const log =
    options.logLevel === 'silent'
      ? () => {}
      : msg => process.stdout.write(`${new Date().toISOString()} - ${msg}\n`);

  const psi = new PsiRunner(options.psiCollectCron);
  for (const site of options.psiCollectCron.sites) {
    const index = options.psiCollectCron.sites.indexOf(site);
    const label = site.label || `Site #${index}`;
    log(`Scheduling cron for ${label} with schedule ${site.schedule}`);

    let inProgress = false;
    const cron = new CronJob(normalizeCronSchedule(site.schedule), () => {
      if (inProgress) {
        log(`Previous PSI collection for ${label} still in progress. Skipping...`);
        return;
      }

      inProgress = true;
      log(`Starting PSI collection for ${label}`);
      psiCollectForProject(storageMethod, psi, site)
        .then(() => {
          log(`Successfully completed collection for ${label}`);
        })
        .catch(err => {
          log(`PSI collection failure for ${label}: ${err.message}`);
        })
        .finally(() => {
          inProgress = false;
        });
    });
    cron.start();
  }
}

module.exports = {startPsiCollectCron, psiCollectForProject};

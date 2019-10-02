/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const ApiClient = require('@lhci/utils/src/api-client.js');

async function main() {
  const rootURL = process.env.LHCI_ROOT_URL;
  if (!rootURL) throw new Error(`Missing LHCI_ROOT_URL environment variable`);

  const client = new ApiClient({rootURL});

  const projects = await client.getProjects();
  const project = projects.find(project => project.name.includes('Viewer')) || projects[0];
  const builds = await client.getBuilds(project.id);
  const build = builds.find(build => build.branch.includes('test_1')) || builds[0];

  process.stdout.write(
    [
      new URL(`/app`, rootURL),
      new URL(`/app/projects/${project.id}`, rootURL),
      new URL(`/app/projects/${project.id}/builds/${build.id}`, rootURL),
    ].join('\n')
  );

  process.exit(0);
}

main().catch(err => {
  process.stderr.write(err.stack);
  process.exit(1);
});

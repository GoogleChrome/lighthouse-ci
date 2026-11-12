/**
 * @license Copyright 2026 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/**
 * Removes build output (`dist` and `.cache`) from every package in `packages/`.
 */

const fs = require('fs');
const path = require('path');

const PACKAGES_DIR = path.join(__dirname, '../packages');

for (const entry of fs.readdirSync(PACKAGES_DIR, {withFileTypes: true})) {
  if (!entry.isDirectory()) continue;
  for (const dir of ['dist', '.cache']) {
    fs.rmSync(path.join(PACKAGES_DIR, entry.name, dir), {recursive: true, force: true});
  }
}

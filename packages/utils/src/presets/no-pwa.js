/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const recommended = require('./recommended.js');

module.exports = {
  assertions: {
    ...recommended.assertions,
    // Every PWA audit is disabled
    'is-on-https': 'off',
    'service-worker': 'off',
    'installable-manifest': 'off',
    'redirects-http': 'off',
    'splash-screen': 'off',
    'themed-omnibox': 'off',
    'content-width': 'off',
    viewport: 'off',
    'apple-touch-icon': 'off',
    'maskable-icon': 'off',
  },
};

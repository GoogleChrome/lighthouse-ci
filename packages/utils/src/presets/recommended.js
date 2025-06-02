/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const all = require('./all.js');

module.exports = {
  assertions: {
    ...all.assertions,
    // Flaky audits (warn)
    'bootup-time': ['warn', {}],
    'cumulative-layout-shift': ['warn', {}],
    'first-contentful-paint': ['warn', {}],
    'first-meaningful-paint': ['warn', {}],
    'largest-contentful-paint': ['warn', {}],
    'mainthread-work-breakdown': ['warn', {}],
    'max-potential-fid': ['warn', {}],
    'speed-index': ['warn', {}],
    interactive: ['warn', {}],
    // Flaky score but non-flaky details (error, maxLength)
    'duplicated-javascript': ['warn', {maxLength: 0}], // warn until https://github.com/GoogleChrome/lighthouse/issues/11285 is fixed
    'efficient-animated-content': ['error', {maxLength: 0}],
    'legacy-javascript': ['warn', {maxLength: 0}], // warn until https://github.com/GoogleChrome/lighthouse/issues/11285 is fixed
    'offscreen-images': ['error', {maxLength: 0}],
    'unminified-css': ['error', {maxLength: 0}],
    'unminified-javascript': ['error', {maxLength: 0}],
    'unused-css-rules': ['error', {maxLength: 0}],
    'unused-javascript': ['error', {maxLength: 0}],
    'uses-optimized-images': ['error', {maxLength: 0}],
    'uses-rel-preconnect': ['error', {maxLength: 0}],
    'uses-responsive-images': ['error', {maxLength: 0}],
    'uses-text-compression': ['error', {maxLength: 0}],
    // Audits that don't typically apply in dev environments or are more opinionated (warn)
    'uses-http2': ['off', {}], // not useful for the dev server
    'long-tasks': ['off', {}], // too strict

    'cache-insight': ['warn', {maxLength: 0}],
    'dom-size-insight': ['warn', {}],
    'dom-size': ['warn', {}],
    'is-on-https': ['warn', {}], // passes on localhost, so OK to leave on
    'modern-image-formats': ['warn', {maxLength: 0}],
    'render-blocking-insight': ['warn', {maxLength: 0}],
    'render-blocking-resources': ['warn', {maxLength: 0}],
    'server-response-time': ['warn', {}],
    'uses-long-cache-ttl': ['warn', {maxLength: 0}],
  },
};

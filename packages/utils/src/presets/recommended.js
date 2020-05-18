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
    'mainthread-work-breakdown': ['warn', {}],
    'first-contentful-paint': ['warn', {}],
    'first-cpu-idle': ['warn', {}],
    'first-meaningful-paint': ['warn', {}],
    interactive: ['warn', {}],
    'speed-index': ['warn', {}],
    'max-potential-fid': ['warn', {}],
    'load-fast-enough-for-pwa': ['warn', {}],
    'uses-rel-preload': ['warn', {}],
    // Flaky score but non-flaky details (error, maxLength)
    'efficient-animated-content': ['error', {maxLength: 0}],
    'offscreen-images': ['error', {maxLength: 0}],
    'unminified-css': ['error', {maxLength: 0}],
    'unminified-javascript': ['error', {maxLength: 0}],
    'unused-css-rules': ['error', {maxLength: 0}],
    'uses-optimized-images': ['error', {maxLength: 0}],
    'uses-rel-preconnect': ['error', {maxLength: 0}],
    'uses-responsive-images': ['error', {maxLength: 0}],
    'uses-text-compression': ['error', {maxLength: 0}],
    // Audits that don't typically apply in dev environments or are more opinionated (warn)
    'dom-size': ['warn', {}],
    'render-blocking-resources': ['warn', {maxLength: 0}],
    'uses-webp-images': ['warn', {maxLength: 0}],
    'uses-long-cache-ttl': ['warn', {maxLength: 0}],
    'is-on-https': ['warn', {}],
    'redirects-http': ['warn', {}],
    'time-to-first-byte': ['warn', {}],
    'uses-http2': ['warn', {}],
  },
};

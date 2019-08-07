/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/* eslint-env jest, browser */

const fs = require('fs');
const path = require('path');
const {spawn} = require('child_process');
const preactRender = require('preact').render;
const testingLibrary = require('@testing-library/dom');

const CLI_PATH = path.join(__dirname, '../src/cli.js');

const servers = [];
const renderedComponents = new Set();

async function startServer(sqlFile) {
  if (!sqlFile) {
    sqlFile = `cli-test-${Math.round(Math.random() * 1e9)}.tmp.sql`;
  }

  let stdout = '';
  const serverProcess = spawn(CLI_PATH, ['server', '-p=0', `--storage.sqlDatabasePath=${sqlFile}`]);
  serverProcess.stdout.on('data', chunk => (stdout += chunk.toString()));

  await waitForCondition(() => stdout.includes('listening'));

  const port = stdout.match(/port (\d+)/)[1];
  const server = {port, process: serverProcess, sqlFile};
  servers.push(server);
  return server;
}

function waitForCondition(fn, label) {
  return testingLibrary.wait(() => {
    if (!fn()) throw new Error(label || 'Condition not met');
  });
}

function render(preactNodeToRender, {container} = {}) {
  if (!container) {
    container = document.body.appendChild(document.createElement('div'));
  }

  renderedComponents.add(container);
  preactRender(preactNodeToRender, container);

  return {
    container,
    ...testingLibrary.getQueriesForElement(container),
  };
}

function cleanup() {
  for (const container of renderedComponents) {
    preactRender('', document.body, container);
  }

  if (servers.length > 1) throw new Error('Cannot have multiple servers in same jest context');

  for (const server of servers) {
    if (fs.existsSync(server.sqlFile)) fs.unlinkSync(server.sqlFile);
    server.process.kill();
  }
}

/** @type {typeof import('@testing-library/dom').fireEvent} */
const dispatchEvent = (...args) => testingLibrary.fireEvent(...args);

Object.keys(testingLibrary.fireEvent).forEach(key => {
  dispatchEvent[key] = (...args) => {
    testingLibrary.fireEvent(...args);
    return new Promise(resolve => process.nextTick(resolve));
  };
});

const wait = testingLibrary.wait;

const prettyDOM = testingLibrary.prettyDOM;

/** PrettyDOM but without the color control characters. */
const snapshotDOM = (el, maxLength) => prettyDOM(el, maxLength).replace(/\[\d{1,2}m/g, '');

module.exports = {
  CLI_PATH,
  startServer,
  waitForCondition,
  render,
  cleanup,
  wait,
  dispatchEvent,
  prettyDOM,
  snapshotDOM,
};

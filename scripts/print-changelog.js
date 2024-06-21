// @ts-nocheck

// https://github.com/patrickhulce/hulk
/**
The MIT License (MIT)

Copyright (c) 2018 Patrick Hulce <patrick.hulce@gmail.com> (https://patrickhulce.com/)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
 */

'use strict';

const changelogLib = require('@patrickhulce/scripts/lib/shared/changelog.js');
const parseCommit = require('conventional-commits-parser').sync;
const shelljs = require('shelljs');

const lastTag = process.argv[2];
const nextTag = process.argv[3];

const GIT_BODY_DELIMITER = '______MARK_THE_BODY______';
const GIT_BODY = `${GIT_BODY_DELIMITER}"%B"${GIT_BODY_DELIMITER}`;
const GIT_LOG_JSON_FORMAT = `{"hash": "%H", "date": "%aI", "subject": "%s", "body": ${GIT_BODY}}`;

const RELEASE_TYPE = {
  MAJOR: 2,
  MINOR: 1,
  PATCH: 0,
};

const exec = cmd => shelljs.exec(cmd, {silent: true});

function getCommitsAndReleaseType(lastVersion) {
  const commitRange = `${lastVersion.tag}...HEAD`;
  const flags = `--pretty=format:'${GIT_LOG_JSON_FORMAT}' --no-merges`;
  const command = `git log ${commitRange} ${flags}`;
  let logs = exec(command).stdout;
  // Replace all the newlines in the body so it's valid JSON
  const regex = new RegExp(`${GIT_BODY_DELIMITER}"((.|[\n\r\f])*?)"${GIT_BODY_DELIMITER}}`, 'gim');
  logs = logs.replace(regex, (s, body) => `"${body.replace(/\r?\n/g, '\\n')}"}`);

  const commits = logs
    .split('\n')
    .filter(Boolean)
    .map(l => {
      try {
        return JSON.parse(l);
      } catch (err) {
        console.error('Unable to parse message:', l);
        return undefined;
      }
    })
    .filter(Boolean)
    .map(commit => {
      const parsed = parseCommit(commit.body);
      parsed.hash = commit.hash;
      parsed.date = commit.date;

      let releaseType = RELEASE_TYPE.PATCH;
      if (parsed.type === 'feat') releaseType = RELEASE_TYPE.MINOR;
      if (commit.body.includes('BREAKING CHANGE')) releaseType = RELEASE_TYPE.MAJOR;

      return {...commit, releaseType, parsed};
    });

  const releaseType = commits.reduce(
    (type, commit) => Math.max(type, commit.releaseType),
    RELEASE_TYPE.PATCH
  );

  return {releaseType, commits};
}

const options = {};
const tag = nextTag;
const lastVersion = {tag: lastTag};
const nextVersion = {tag};
const repository = {
  owner: 'GoogleChrome',
  name: 'lighthouse-ci',
};
const {commits} = getCommitsAndReleaseType(lastVersion);
changelogLib.get(options, {repository, lastVersion, nextVersion, commits, tag}).then(console.log);

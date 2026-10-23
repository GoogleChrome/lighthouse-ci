// @ts-nocheck
'use strict';

const parseCommit = require('conventional-commits-parser').sync;
const shelljs = require('shelljs');

const lastTag = process.argv[2];
const nextTag = process.argv[3];

if (!lastTag || !nextTag) {
  console.error('Usage: node ./scripts/print-changelog.js <lastTag> <nextTag>');
  process.exit(1);
}

const GIT_BODY_DELIMITER = '______MARK_THE_BODY______';
const GIT_BODY = `${GIT_BODY_DELIMITER}"%B"${GIT_BODY_DELIMITER}`;
const GIT_LOG_JSON_FORMAT = `{"hash": "%H", "date": "%aI", "subject": "%s", "body": ${GIT_BODY}}`;

const COMMIT_TYPE_ORDER = {
  feat: 1,
  fix: 2,
  docs: 3,
  refactor: 4,
  tests: 5,
  test: 5,
  chore: 6,
  misc: 7,
};

const exec = cmd => shelljs.exec(cmd, {silent: true});

function compareCommitSortOrder(commitA, commitB) {
  if (!commitA.scope) return -1;
  if (!commitB.scope) return 1;
  if (commitA.scope !== commitB.scope) return commitA.scope.localeCompare(commitB.scope);
  return new Date(commitB.date).getTime() - new Date(commitA.date).getTime();
}

function getCommits(fromTag) {
  const commitRange = `${fromTag}...HEAD`;
  const flags = `--pretty=format:'${GIT_LOG_JSON_FORMAT}' --no-merges`;
  const command = `git log ${commitRange} ${flags}`;
  let logs = exec(command).stdout;
  // Replace all the newlines in the body so it's valid JSON
  const regex = new RegExp(`${GIT_BODY_DELIMITER}"((.|[\n\r\f])*?)"${GIT_BODY_DELIMITER}}`, 'gim');
  logs = logs.replace(regex, (s, body) => `"${body.replace(/\r?\n/g, '\\n')}"}`);

  return logs
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
    .filter(commit => !commit.subject.includes('initial commit'))
    .map(commit => {
      const parsed = parseCommit(commit.body);
      parsed.hash = commit.hash;
      parsed.date = commit.date;
      return parsed;
    });
}

function formatChangelog({repoUrl, previousTag, currentTag, commits}) {
  const dateStr = new Date().toISOString().slice(0, 10);
  const isPatch = !currentTag.endsWith('.0');
  const compareLink = `${repoUrl}/compare/${previousTag}...${currentTag}`;
  const headerLine = isPatch
    ? `## <small>${currentTag} (${dateStr})</small>`
    : `## [${currentTag}](${compareLink}) (${dateStr})`;

  const groupsByType = new Map();
  const noteGroupsByTitle = new Map();

  for (const commit of commits) {
    for (const note of commit.notes || []) {
      if (!noteGroupsByTitle.has(note.title)) {
        noteGroupsByTitle.set(note.title, []);
      }
      noteGroupsByTitle.get(note.title).push(note);
    }

    if (!commit.type) continue;
    if (!groupsByType.has(commit.type)) {
      groupsByType.set(commit.type, []);
    }
    groupsByType.get(commit.type).push(commit);
  }

  const sortedTypes = Array.from(groupsByType.keys()).sort(
    (typeA, typeB) => (COMMIT_TYPE_ORDER[typeA] || 8) - (COMMIT_TYPE_ORDER[typeB] || 8)
  );

  const commitLines = [];
  for (const type of sortedTypes) {
    const groupCommits = groupsByType.get(type).sort(compareCommitSortOrder);
    for (const commit of groupCommits) {
      const shortHash = commit.hash.slice(0, 7);
      const hashLink = `([${shortHash}](${repoUrl}/commits/${shortHash}))`;

      const seenIssues = new Set();
      const issueLinks = [];
      for (const ref of commit.references || []) {
        if (!ref.issue || seenIssues.has(ref.issue)) continue;
        seenIssues.add(ref.issue);
        const prefix = ref.owner ? `${ref.owner}/${ref.repository || ''}` : ref.repository || '';
        const issueRepoUrl = prefix ? `https://github.com/${prefix}` : repoUrl;
        issueLinks.push(`[${prefix}#${ref.issue}](${issueRepoUrl}/issues/${ref.issue})`);
      }

      const closesSuffix = issueLinks.length ? `, closes ${issueLinks.join(' ')}` : '';
      commitLines.push(`* ${commit.header} ${hashLink}${closesSuffix}`);
    }
  }

  let output = `<a name="${currentTag}"></a>\n${headerLine}\n\n${commitLines.join('\n')}\n`;

  for (const [title, notes] of noteGroupsByTitle.entries()) {
    output += `\n\n### ${title}\n\n`;
    for (const note of notes) {
      output += `* ${note.text.trim()}\n`;
    }
  }

  return output.replace(/\n+$/, '\n\n');
}

const repoUrl = 'https://github.com/GoogleChrome/lighthouse-ci';
const commits = getCommits(lastTag);
console.log(formatChangelog({repoUrl, previousTag: lastTag, currentTag: nextTag, commits}));

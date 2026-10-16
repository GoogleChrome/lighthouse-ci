/** @jest-environment jsdom */

/**
 * @license Copyright 2026 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

/* eslint-env jest */

import {h} from 'preact';
import {findAuditDiffs} from '@lhci/utils/src/audit-diff-finder.js';
import {AuditDetail} from '../../../../../src/ui/routes/build-view/audit-detail/audit-detail.jsx';
import {render, cleanup} from '../../../../test-utils.js';

afterEach(cleanup);

describe('AuditDetail', () => {
  it('should render list audit details as a table instead of raw JSON', () => {
    const baseAudit = {
      id: 'lcp-breakdown-insight',
      title: 'LCP by phase',
      description: 'Each [subpart has specific improvement strategies](https://example.com).',
      score: 0,
      details: {
        type: 'list',
        items: [
          {
            type: 'table',
            headings: [
              {key: 'label', valueType: 'text', label: 'Phase'},
              {key: 'duration', valueType: 'ms', label: 'Duration'},
            ],
            items: [
              {phase: 'timeToFirstByte', label: 'Time to first byte', duration: 500},
              {phase: 'elementRenderDelay', label: 'Element render delay', duration: 1000},
            ],
          },
          {
            type: 'node',
            lhId: 'page-0-H2',
            path: '1,HTML,1,BODY,0,H2',
            snippet: '<h2>Upload your document</h2>',
          },
        ],
      },
    };

    const compareAudit = {
      ...baseAudit,
      details: {
        type: 'list',
        items: [
          {
            type: 'table',
            headings: [
              {key: 'label', valueType: 'text', label: 'Phase'},
              {key: 'duration', valueType: 'ms', label: 'Duration'},
            ],
            items: [
              {phase: 'timeToFirstByte', label: 'Time to first byte', duration: 600},
              {phase: 'elementRenderDelay', label: 'Element render delay', duration: 1500},
            ],
          },
          {
            type: 'node',
            lhId: 'page-0-H2',
            path: '1,HTML,1,BODY,0,H2',
            snippet: '<h2>Upload your document</h2>',
          },
        ],
      },
    };

    const diffs = findAuditDiffs(baseAudit, compareAudit, {synthesizeItemKeyDiffs: true});
    const pair = {
      audit: compareAudit,
      baseAudit,
      diffs,
      maxSeverity: 1,
      group: {id: 'diagnostics', title: 'Diagnostics'},
    };

    const {container, getByText} = render(<AuditDetail pair={pair} />);
    expect(container.querySelector('.table-details table')).not.toBeNull();
    expect(getByText('Time to first byte')).toBeTruthy();
    expect(getByText('Element render delay')).toBeTruthy();
    expect(getByText('<h2>Upload your document</h2>')).toBeTruthy();
  });

  it('should render checklist audit details as a table instead of raw JSON', () => {
    const baseAudit = {
      id: 'document-latency-insight',
      title: 'Document request latency',
      description: 'Your first network request is the most important.',
      score: 1,
      details: {
        type: 'checklist',
        items: {
          noRedirects: {label: 'Avoids redirects', value: true},
          usesCompression: {label: 'Applies text compression', value: true},
        },
      },
    };

    const compareAudit = {
      ...baseAudit,
      score: 0,
      details: {
        type: 'checklist',
        items: {
          noRedirects: {label: 'Avoids redirects', value: true},
          usesCompression: {label: 'Applies text compression', value: false},
        },
      },
    };

    const diffs = findAuditDiffs(baseAudit, compareAudit, {synthesizeItemKeyDiffs: true});
    const pair = {
      audit: compareAudit,
      baseAudit,
      diffs,
      maxSeverity: 1,
      group: {id: 'diagnostics', title: 'Diagnostics'},
    };

    const {container, getByText} = render(<AuditDetail pair={pair} />);
    expect(container.querySelector('.table-details table')).not.toBeNull();
    expect(getByText('Checklist')).toBeTruthy();
    expect(getByText('Avoids redirects')).toBeTruthy();
    expect(getByText('Fail')).toBeTruthy();
  });
});

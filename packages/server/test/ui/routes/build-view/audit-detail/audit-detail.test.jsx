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
import {render, cleanup, wait} from '../../../../test-utils.js';

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

  it('should render baseline-status items using displayString instead of raw JSON', () => {
    const audit = {
      id: 'baseline',
      title: 'Baseline Features',
      description: 'Lists web features used on the page.',
      score: 1,
      details: {
        type: 'table',
        headings: [
          {key: 'featureId', valueType: 'link', label: 'Web-features'},
          {key: 'displayStatus', valueType: 'baseline-status', label: 'Baseline Status'},
        ],
        items: [
          {
            featureId: {
              type: 'link',
              text: 'device-posture',
              url: 'https://webstatus.dev/features/device-posture',
            },
            displayStatus: {
              type: 'baseline-status',
              status: 'limited',
              displayString: 'Limited Availability',
            },
          },
        ],
      },
    };

    const pair = {
      audit,
      baseAudit: undefined,
      diffs: [],
      maxSeverity: 0,
      group: {id: 'best-practices-browser-compat', title: 'Browser Compatibility'},
    };

    const {getByText} = render(<AuditDetail pair={pair} />);
    expect(getByText('device-posture')).toBeTruthy();
    expect(getByText('Limited Availability')).toBeTruthy();
  });

  it('should render 0 values in table details instead of blank cells', () => {
    const baseAudit = {
      id: 'bootup-time',
      title: 'Reduce JavaScript execution time',
      description: 'Consider reducing the time spent parsing, compiling, and executing JS.',
      score: 0.5,
      details: {
        type: 'table',
        headings: [
          {key: 'url', valueType: 'url', label: 'URL'},
          {key: 'total', valueType: 'ms', label: 'Total CPU Time'},
          {key: 'scripting', valueType: 'ms', label: 'Script Evaluation'},
          {key: 'scriptParseCompile', valueType: 'ms', label: 'Script Parse'},
        ],
        items: [
          {
            url: 'https://example.com/app.js',
            total: 100,
            scripting: 80,
            scriptParseCompile: 0,
          },
        ],
      },
    };

    const compareAudit = {
      ...baseAudit,
      details: {
        ...baseAudit.details,
        items: [
          {
            url: 'https://example.com/app.js',
            total: 120,
            scripting: 90,
            scriptParseCompile: 0,
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

    const {container} = render(<AuditDetail pair={pair} />);
    const cells = Array.from(container.querySelectorAll('.table-details tbody td')).map(td =>
      td.textContent.replace(/\s+/g, ' ').trim()
    );
    expect(cells).toEqual(['/app.js(example.com)', '', '+20ms (20%)', '+10ms (13%)', '+0ms']);
  });

  it('should render subitems with diff filtering, show-unchanged button, and collapsible parent rows', async () => {
    const headings = [
      {
        key: 'entity',
        valueType: 'text',
        label: 'Third-Party',
        subItemsHeading: {key: 'url', valueType: 'url'},
      },
      {
        key: 'transferSize',
        valueType: 'bytes',
        label: 'Transfer Size',
        subItemsHeading: {key: 'transferSize'},
      },
    ];

    const baseAudit = {
      id: 'third-party-summary',
      title: 'Reduce the impact of third-party code',
      description: 'Third-party code can significantly impact load performance.',
      score: 0.5,
      details: {
        type: 'table',
        headings,
        items: [
          {
            entity: 'Hubspot',
            transferSize: 20480,
            subItems: {
              type: 'subitems',
              items: [
                {url: 'https://js.hs-analytics.net/analytics.js', transferSize: 10240},
                {url: 'https://js.hs-banner.com/banner.js', transferSize: 10240},
              ],
            },
          },
          {
            entity: 'Bing Ads',
            transferSize: 5120,
            subItems: {
              type: 'subitems',
              items: [{url: 'https://bat.bing.com/bat.js', transferSize: 5120}],
            },
          },
        ],
      },
    };

    const compareAudit = {
      ...baseAudit,
      details: {
        type: 'table',
        headings,
        items: [
          {
            entity: 'Hubspot',
            transferSize: 30720,
            subItems: {
              type: 'subitems',
              items: [
                {url: 'https://js.hs-analytics.net/analytics.js', transferSize: 20480},
                {url: 'https://js.hs-banner.com/banner.js', transferSize: 10240},
              ],
            },
          },
          {
            entity: 'Bing Ads',
            transferSize: 5120,
            subItems: {
              type: 'subitems',
              items: [{url: 'https://bat.bing.com/bat.js', transferSize: 5120}],
            },
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

    const {container, getByText, queryByText} = render(<AuditDetail pair={pair} />);

    // 1. Changed parent row (Hubspot) is auto-expanded and shows its changed subitem
    expect(getByText('/analytics.js')).toBeTruthy();
    // Unchanged subitem (/banner.js) is hidden behind "+ Show 1 unchanged subitem"
    expect(queryByText('/banner.js')).toBeNull();
    const showUnchangedBtn = getByText('+ Show 1 unchanged subitem');
    expect(showUnchangedBtn).toBeTruthy();

    // 2. Unchanged parent row (Bing Ads) is collapsed by default with a badge
    expect(queryByText('/bat.js')).toBeNull();
    expect(getByText('1 subitem')).toBeTruthy();

    // 3. Clicking "+ Show 1 unchanged subitem" reveals /banner.js
    showUnchangedBtn.click();
    await wait(() => expect(getByText('/banner.js')).toBeTruthy());

    // 4. Clicking the collapsed Bing Ads row expands its subitem (/bat.js)
    const bingRow = getByText('Bing Ads').closest('tr');
    bingRow.click();
    await wait(() => expect(getByText('/bat.js')).toBeTruthy());

    // Verify multiple tbody groups are rendered for zebra striping
    expect(container.querySelectorAll('.table-details tbody.table-details__row-group')).toHaveLength(
      2
    );
  });

  it('should render subitems that populate key: null columns (legacy-javascript)', () => {
    const headings = [
      {
        key: 'url',
        valueType: 'url',
        label: 'URL',
        subItemsHeading: {key: 'location', valueType: 'source-location'},
      },
      {
        key: null,
        valueType: 'code',
        label: '',
        subItemsHeading: {key: 'signal'},
      },
      {
        key: 'wastedBytes',
        valueType: 'bytes',
        label: 'Potential Savings',
      },
    ];

    const baseAudit = {
      id: 'legacy-javascript',
      title: 'Avoid serving legacy JavaScript to modern browsers',
      description: 'Polyfills and transforms enable legacy browsers to use new features.',
      score: 0.5,
      details: {
        type: 'opportunity',
        headings,
        items: [],
      },
    };

    const compareAudit = {
      ...baseAudit,
      details: {
        type: 'opportunity',
        headings,
        items: [
          {
            url: 'https://example.com/bundle.js',
            wastedBytes: 12288,
            subItems: {
              type: 'subitems',
              items: [
                {
                  signal: '@babel/plugin-transform-classes',
                  location: {
                    type: 'source-location',
                    url: 'https://example.com/bundle.js',
                    line: 19,
                    column: 1694,
                  },
                },
              ],
            },
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

    const {getByText} = render(<AuditDetail pair={pair} />);
    expect(getByText('@babel/plugin-transform-classes')).toBeTruthy();
    expect(getByText('https://example.com/bundle.js:19:1694')).toBeTruthy();
  });

  it('should render object-typed url/node/text subitems (layout-shifts, deprecations, duplicated-javascript-insight)', () => {
    const layoutShiftsAudit = {
      id: 'layout-shifts',
      title: 'Avoid large layout shifts',
      description: 'These DOM elements contribute most to the CLS of the page.',
      score: 0.5,
      details: {
        type: 'table',
        headings: [
          {
            key: 'node',
            valueType: 'node',
            subItemsHeading: {key: 'extra'},
            label: 'Element',
          },
          {
            key: 'score',
            valueType: 'numeric',
            subItemsHeading: {key: 'cause', valueType: 'text'},
            label: 'Layout shift score',
          },
        ],
        items: [
          {
            node: {type: 'node', path: '1,HTML,1,BODY,0,DIV', snippet: '<div>Hero</div>'},
            score: 0.15,
            subItems: {
              type: 'subitems',
              items: [
                {
                  extra: {type: 'url', value: 'https://fonts.example.com/font.woff2'},
                  cause: 'Web font loaded',
                },
                {
                  extra: {type: 'node', path: '1,HTML,1,BODY,0,IMG', snippet: '<img src="hero.jpg">'},
                  cause: 'Media element lacking an explicit size',
                },
              ],
            },
          },
        ],
      },
    };

    const layoutPair = {
      audit: layoutShiftsAudit,
      baseAudit: {
        ...layoutShiftsAudit,
        details: {...layoutShiftsAudit.details, items: []},
      },
      diffs: findAuditDiffs(
        {...layoutShiftsAudit, details: {...layoutShiftsAudit.details, items: []}},
        layoutShiftsAudit,
        {synthesizeItemKeyDiffs: true}
      ),
      maxSeverity: 1,
      group: {id: 'diagnostics', title: 'Diagnostics'},
    };

    const {getByText} = render(<AuditDetail pair={layoutPair} />);
    expect(getByText('/font.woff2')).toBeTruthy();
    expect(getByText('(fonts.example.com)')).toBeTruthy();
    expect(getByText('<img src="hero.jpg">')).toBeTruthy();
    expect(getByText('Web font loaded')).toBeTruthy();

    // 1D unmapped link subitems (`deprecations`)
    const deprecationsAudit = {
      id: 'deprecations',
      title: 'Avoids deprecated APIs',
      description: 'Deprecated APIs will eventually be removed from the browser.',
      score: 0,
      details: {
        type: 'table',
        headings: [
          {key: 'value', valueType: 'text', label: 'Deprecation / Warning'},
          {key: 'source', valueType: 'source-location', label: 'Source'},
        ],
        items: [
          {
            value: 'The Expect-CT header is deprecated.',
            source: {
              type: 'source-location',
              url: 'https://example.com/',
              line: 1,
              column: 1,
            },
            subItems: {
              type: 'subitems',
              items: [
                {
                  type: 'link',
                  url: 'https://chromestatus.com/feature/6244547273687040',
                  text: 'Check the feature status page for more details.',
                },
              ],
            },
          },
        ],
      },
    };

    const depPair = {
      audit: deprecationsAudit,
      baseAudit: {...deprecationsAudit, details: {...deprecationsAudit.details, items: []}},
      diffs: findAuditDiffs(
        {...deprecationsAudit, details: {...deprecationsAudit.details, items: []}},
        deprecationsAudit,
        {synthesizeItemKeyDiffs: true}
      ),
      maxSeverity: 1,
      group: {id: 'best-practices-general', title: 'General'},
    };

    const {getByText: getByTextDep} = render(<AuditDetail pair={depPair} />);
    expect(getByTextDep('Check the feature status page for more details.')).toBeTruthy();
  });

  it('should not toggle row expansion when clicking a link inside the parent row', async () => {
    const headings = [
      {
        key: 'entity',
        valueType: 'link',
        label: 'Third-Party',
        subItemsHeading: {key: 'url', valueType: 'url'},
      },
      {
        key: 'transferSize',
        valueType: 'bytes',
        label: 'Transfer Size',
        subItemsHeading: {key: 'transferSize'},
      },
    ];
    const audit = {
      id: 'third-party-summary',
      title: 'Reduce the impact of third-party code',
      description: 'Third-party code can significantly impact load performance.',
      score: 0.5,
      details: {
        type: 'table',
        headings,
        items: [
          {
            entity: {type: 'link', text: 'YouTube', url: 'https://youtube.com'},
            transferSize: 10240,
            subItems: {
              type: 'subitems',
              items: [{url: 'https://youtube.com/player.js', transferSize: 10240}],
            },
          },
        ],
      },
    };
    const baseAudit = {...audit, details: {...audit.details, items: []}};
    const diffs = findAuditDiffs(baseAudit, audit, {synthesizeItemKeyDiffs: true});
    const pair = {
      audit,
      baseAudit,
      diffs,
      maxSeverity: 1,
      group: {id: 'diagnostics', title: 'Diagnostics'},
    };

    const {getByText, getByLabelText} = render(<AuditDetail pair={pair} />);
    // Starts expanded because parent row is 'added'
    expect(getByText('/player.js')).toBeTruthy();

    // Clicking the <a href="https://youtube.com">YouTube</a> link should NOT collapse the row
    const link = getByText('YouTube');
    link.click();
    expect(getByText('/player.js')).toBeTruthy();

    // Clicking the chevron button SHOULD collapse the row
    const chevronBtn = getByLabelText('Collapse subitems');
    chevronBtn.click();
    await wait(() => expect(getByLabelText('Expand subitems')).toBeTruthy());
  });
});

/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h} from 'preact';
import {computeAuditGroups} from '../../../../src/ui/routes/build-view/lhr-comparison.jsx';
import {cleanup} from '../../../test-utils.js';

jest.mock('../../../../src/ui/layout/page');

afterEach(cleanup);

describe('LhrComparison', () => {
  describe('computeAuditGroups', () => {
    let audits;
    let categoryGroups;
    let categories;

    beforeEach(() => {
      audits = {
        tti: {name: 'Interactive', score: 1},
        badimages: {name: 'Bad images', score: 1},
        debugdata: {name: 'Debug data', score: 1},
      };

      categoryGroups = {
        metrics: {title: 'Metrics'},
        opportunites: {title: 'Opportunities'},
        images: {title: 'Images'},
      };

      categories = {
        performance: {
          title: 'Performance',
          auditRefs: [
            {id: 'tti', group: 'metrics'},
            {id: 'badimages', group: 'opportunites'},
            {id: 'debugdata'},
          ],
        },
        a11y: {
          title: 'Accessibility',
          auditRefs: [{id: 'badimages', group: 'images'}, {id: 'debugdata', group: 'missing'}],
        },
        seo: {
          title: 'SEO',
          description: 'SEO description',
          auditRefs: [{id: 'badimages'}],
        },
      };
    });

    it('should return the audit groups', () => {
      const lhr = {audits, categories, categoryGroups};

      expect(computeAuditGroups(lhr)).toEqual([
        {
          group: {id: 'metrics', title: 'Metrics'},
          id: 'metrics',
          pairs: [
            {
              audit: {id: 'tti', name: 'Interactive', score: 1},
              baseAudit: undefined,
              diffs: [],
              group: {id: 'metrics', title: 'Metrics'},
              maxSeverity: 0,
            },
          ],
          showAsUnchanged: false,
        },
        {
          group: {id: 'opportunites', title: 'Opportunities'},
          id: 'opportunites',
          pairs: [
            {
              audit: {id: 'badimages', name: 'Bad images', score: 1},
              baseAudit: undefined,
              diffs: [],
              group: {id: 'opportunites', title: 'Opportunities'},
              maxSeverity: 0,
            },
          ],
          showAsUnchanged: false,
        },
        {
          group: {id: 'images', title: 'Images'},
          id: 'images',
          pairs: [
            {
              audit: {id: 'badimages', name: 'Bad images', score: 1},
              baseAudit: undefined,
              diffs: [],
              group: {id: 'images', title: 'Images'},
              maxSeverity: 0,
            },
          ],
          showAsUnchanged: false,
        },
        {
          group: {id: 'category:seo', title: 'SEO', description: 'SEO description'},
          id: 'category:seo',
          pairs: [
            {
              audit: {id: 'badimages', name: 'Bad images', score: 1},
              baseAudit: undefined,
              diffs: [],
              group: {id: 'category:seo', title: 'SEO', description: 'SEO description'},
              maxSeverity: 0,
            },
          ],
          showAsUnchanged: false,
        },
      ]);
    });

    it('should compute the diffs', () => {
      const audits2 = JSON.parse(JSON.stringify(audits));
      Object.values(audits2).forEach(audit => (audit.score = 0));
      const lhr1 = {audits, categories, categoryGroups};
      const lhr2 = {audits: audits2, categories, categoryGroups};
      const actual = computeAuditGroups(lhr1, lhr2);
      expect(actual).toHaveLength(4);
      expect(actual[0].pairs).toEqual([
        {
          audit: {
            id: 'tti',
            name: 'Interactive',
            score: 1,
          },
          baseAudit: {
            name: 'Interactive',
            score: 0,
          },
          diffs: [
            {
              auditId: '',
              baseValue: 0,
              compareValue: 1,
              type: 'score',
            },
          ],
          group: {
            id: 'metrics',
            title: 'Metrics',
          },
          maxSeverity: expect.any(Number),
        },
      ]);
    });

    it('should render groups without diffs as showAsUnchanged=true', () => {
      const lhr = {audits, categories, categoryGroups};
      expect(computeAuditGroups(lhr, lhr)).toEqual([
        {
          group: {
            id: 'unchanged:performance',
            title: 'Unchanged Audits - Performance',
          },
          id: 'unchanged:performance',
          pairs: [
            {
              audit: {
                id: 'tti',
                name: 'Interactive',
                score: 1,
              },
              baseAudit: {
                name: 'Interactive',
                score: 1,
              },
              diffs: [],
              group: {
                id: 'metrics',
                title: 'Metrics',
              },
              maxSeverity: 0,
            },
            {
              audit: {
                id: 'badimages',
                name: 'Bad images',
                score: 1,
              },
              baseAudit: {
                name: 'Bad images',
                score: 1,
              },
              diffs: [],
              group: {
                id: 'opportunites',
                title: 'Opportunities',
              },
              maxSeverity: 0,
            },
          ],
          showAsUnchanged: true,
        },
        {
          group: {
            id: 'unchanged:a11y',
            title: 'Unchanged Audits - Accessibility',
          },
          id: 'unchanged:a11y',
          pairs: [
            {
              audit: {
                id: 'badimages',
                name: 'Bad images',
                score: 1,
              },
              baseAudit: {
                name: 'Bad images',
                score: 1,
              },
              diffs: [],
              group: {
                id: 'images',
                title: 'Images',
              },
              maxSeverity: 0,
            },
          ],
          showAsUnchanged: true,
        },
        {
          group: {
            id: 'unchanged:seo',
            title: 'Unchanged Audits - SEO',
          },
          id: 'unchanged:seo',
          pairs: [
            {
              audit: {
                id: 'badimages',
                name: 'Bad images',
                score: 1,
              },
              baseAudit: {
                name: 'Bad images',
                score: 1,
              },
              diffs: [],
              group: {
                description: 'SEO description',
                id: 'category:seo',
                title: 'SEO',
              },
              maxSeverity: 0,
            },
          ],
          showAsUnchanged: true,
        },
      ]);
    });
  });
});

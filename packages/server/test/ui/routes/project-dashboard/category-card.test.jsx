/** @jest-environment jsdom */

/**
 * @license Copyright 2026 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

/* eslint-env jest */

import {h} from 'preact';
import {CategoryCard} from '../../../../src/ui/routes/project-dashboard/category-card.jsx';
import {MetricLineGraph} from '../../../../src/ui/routes/project-dashboard/graphs/metric-line-graph.jsx';
import {render, cleanup, wait} from '../../../test-utils.js';

afterEach(cleanup);

/**
 * @param {string} id
 * @param {string} runAt
 * @return {LHCI.ServerCommand.Build}
 */
function makeBuild(id, runAt) {
  return {
    id,
    projectId: 'p1',
    lifecycle: 'sealed',
    branch: 'main',
    hash: `hash-${id}`,
    externalBuildUrl: 'https://example.com/build',
    commitMessage: `commit ${id}`,
    author: 'Test <test@example.com>',
    avatarUrl: '',
    ancestorHash: '',
    runAt,
    createdAt: runAt,
    updatedAt: runAt,
  };
}

/**
 * @param {LHCI.ServerCommand.Build} build
 * @param {LHCI.ServerCommand.StatisticName} name
 * @param {number} value
 */
function makeStat(build, name, value) {
  return {
    id: `${build.id}-${name}`,
    projectId: build.projectId,
    buildId: build.id,
    url: 'https://example.com/',
    version: 2,
    name,
    value,
    build,
    createdAt: build.runAt,
    updatedAt: build.runAt,
  };
}

describe('CategoryCard CLS median graphs', () => {
  const build1 = makeBuild('b1', '2025-01-01T12:00:00.000Z');
  const build2 = makeBuild('b2', '2025-01-02T12:00:00.000Z');
  const builds = [build1, build2];

  /** @type {Array<[LHCI.ServerCommand.StatisticName, number, number]>} */
  const metricPairs = [
    ['category_performance_median', 0.85, 0.92],
    ['category_performance_min', 0.8, 0.9],
    ['category_performance_max', 0.9, 0.95],
    ['audit_first-contentful-paint_median', 1200, 1100],
    ['audit_largest-contentful-paint_median', 2400, 2100],
    ['audit_interactive_median', 3500, 3200],
    ['audit_speed-index_median', 2800, 2600],
    ['audit_total-blocking-time_median', 250, 180],
    ['audit_max-potential-fid_median', 120, 90],
    ['audit_cumulative-layout-shift_median', 0.125, 0.04],
  ];

  const statistics = builds.flatMap((b, idx) =>
    metricPairs.map(([name, v1, v2]) => makeStat(b, name, idx === 0 ? v1 : v2))
  );

  it('renders CLS median in both Timeline and Distribution views with unitless axes', async () => {
    const category = {
      id: 'performance',
      title: 'Performance',
      score: 0.92,
      auditRefs: [],
    };

    const {container, getByText} = render(
      <CategoryCard
        category={category}
        categoryGroups={{}}
        statistics={statistics}
        loadingState="loaded"
        builds={builds}
        buildLimit={25}
        setBuildLimit={() => {}}
        lhr={/** @type {any} */ ({categories: {performance: category}, audits: {}})}
        url="https://example.com/"
      />
    );

    await wait(() => expect(getByText('Cumulative Layout Shift')).toBeTruthy());
    expect(getByText('CLS')).toBeTruthy();

    const lineGraphs = container.querySelectorAll('.metric-line-graph');
    expect(lineGraphs.length).toBe(3);

    const clsLineGraph = lineGraphs[2];
    await wait(() =>
      expect(clsLineGraph.querySelectorAll('.y-axis text').length).toBeGreaterThan(0)
    );
    const clsTicks = [...clsLineGraph.querySelectorAll('.y-axis text')].map(el => el.textContent);
    expect(clsTicks.every(t => t && !t.endsWith('s'))).toBe(true);

    // Switch to Distribution view
    getByText('Distribution').click();
    await wait(() =>
      expect(container.querySelectorAll('.metric-distribution-graph').length).toBe(7)
    );

    const distGraphs = container.querySelectorAll('.metric-distribution-graph');
    const clsDistGraph = distGraphs[6];
    expect(clsDistGraph.textContent).toContain('CLS');
    expect(clsDistGraph.textContent).toContain('Cumulative Layout Shift');
    const xAxisLabels = [
      ...clsDistGraph.querySelectorAll('.metric-distribution-graph__x-axis > div'),
    ]
      .map(el => el.textContent)
      .filter(Boolean);
    expect(xAxisLabels).toEqual(['0', '0.5']);
  });

  it('formats unitless hover values without ms suffix and handles unavailable (-1) builds', () => {
    const clsStats = [
      makeStat(build1, 'audit_cumulative-layout-shift_median', -1),
      makeStat(build2, 'audit_cumulative-layout-shift_median', 0.125),
    ];

    const {container, rerender} = (function renderWithSelection(selectedBuildId) {
      const rendered = render(
        <div className="category-card">
          <MetricLineGraph
            unit="unitless"
            pinned={false}
            setPinned={() => {}}
            selectedBuildId={selectedBuildId}
            setSelectedBuildId={() => {}}
            __selectedMetricIndexForTest={0}
            metrics={[
              {
                abbreviation: 'CLS',
                label: 'Cumulative Layout Shift',
                statistics: clsStats,
                scoreLevels: [0.1, 0.25],
              },
            ]}
          />
        </div>
      );
      return {
        ...rendered,
        /** @param {string} nextBuildId */
        rerender: nextBuildId =>
          render(
            <div className="category-card">
              <MetricLineGraph
                unit="unitless"
                pinned={false}
                setPinned={() => {}}
                selectedBuildId={nextBuildId}
                setSelectedBuildId={() => {}}
                __selectedMetricIndexForTest={0}
                metrics={[
                  {
                    abbreviation: 'CLS',
                    label: 'Cumulative Layout Shift',
                    statistics: clsStats,
                    scoreLevels: [0.1, 0.25],
                  },
                ]}
              />
            </div>,
            {container: rendered.container}
          ),
      };
    })('b2');

    const hoverData = container.querySelector('.metric-line-graph__hover-card-data');
    expect(hoverData && hoverData.textContent).toBe('0.125Cumulative Layout Shift');

    rerender('b1');
    const unavailableHover = container.querySelector('.metric-line-graph__hover-card-data');
    expect(unavailableHover && unavailableHover.textContent).toBe(
      'Not AvailableCumulative Layout Shift'
    );
  });
});

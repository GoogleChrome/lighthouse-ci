/**
 * @license Copyright 2020 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h} from 'preact';
import * as d3 from 'd3';
import * as _ from '@lhci/utils/src/lodash.js';

import {D3Graph, createRootSvg} from '../../../components/d3-graph';

import './donut-graph.css';

const GRAPH_MARGIN = {
  top: 5,
  bottom: 5,
  left: 5,
  right: 5,
};

const LEGEND_CIRCLE_MARGIN = {
  top: 2,
  bottom: 2,
  left: 2,
  right: 2,
};

/**
 * @typedef DonutGraphData
 * @prop {number} passCount
 * @prop {number} failCount
 * @prop {number} naCount
 */

/** @typedef {{count: number, type: 'pass'|'fail'|'na'}} CountPoint  */
/** @typedef {{type: CountPoint['type']}} LegendCircleData */

/** @param {ReturnType<typeof createRootSvg>['masks']} masks @param {string} maskId */
function renderPatternMasks(masks, maskId) {
  const passPattern = masks
    .append('pattern')
    .attr('id', `donut-pattern-pass-${maskId}`)
    .attr('class', `donut-pattern--pass`)
    .attr('width', 3)
    .attr('height', 10)
    .attr('patternUnits', 'userSpaceOnUse')
    .attr('patternTransform', `rotate(60 50 50)`);

  passPattern
    .append('line')
    .attr('stroke-width', 2)
    .attr('y2', 10);

  masks
    .append('pattern')
    .attr('id', `donut-pattern-fail-${maskId}`)
    .attr('class', `donut-pattern--fail`)
    .attr('width', 2)
    .attr('height', 2)
    .attr('patternUnits', 'userSpaceOnUse')
    .attr('patternTransform', `rotate(135 50 50)`)
    .append('line')
    .attr('stroke-width', 2)
    .attr('y2', 1);
}

/**
 * @param {HTMLElement} rootEl
 * @param {DonutGraphData} data
 */
function renderDonutGraph(rootEl, data) {
  const {svg, masks, graphWidth} = createRootSvg(rootEl, GRAPH_MARGIN);
  const outerRadius = graphWidth / 2;
  const innerRadius = outerRadius / 2;

  const maskId = _.uniqueId();
  renderPatternMasks(masks, maskId.toString());

  /** @type {Array<CountPoint>} */
  const items = [
    {type: 'pass', count: data.passCount},
    {type: 'fail', count: data.failCount},
    {type: 'na', count: data.naCount},
  ];

  /** @type {() => import('d3').Pie<any, CountPoint>} */
  const d3pie = d3.pie;
  const pie = d3pie()
    .padAngle(0.1)
    .value(item => item.count)
    .sort(item => items.indexOf(item));
  const arcData = pie(items.filter(item => item.count > 0));

  svg
    .selectAll('.donut-arc')
    .data(arcData)
    .enter()
    .append('path')
    .attr('class', item => `donut-arc donut-arc--${item.data.type}`)
    .attr('fill', item => `url(#donut-pattern-${item.data.type}-${maskId})`)
    .attr('style', `transform: translate(${outerRadius}px, ${outerRadius}px)`)
    .attr(
      'd',
      // @ts-ignore - can't figure out the right type for this
      d3
        .arc()
        .innerRadius(innerRadius)
        .outerRadius(outerRadius)
    );
}

/**
 * @param {HTMLElement} rootEl
 * @param {LegendCircleData} data
 */
function renderDonutGraphLegendCircle(rootEl, data) {
  const {svg, masks, graphWidth} = createRootSvg(rootEl, LEGEND_CIRCLE_MARGIN);
  const radius = Math.max(graphWidth / 2, 1);

  const maskId = _.uniqueId();
  renderPatternMasks(masks, maskId.toString());

  svg
    .append('circle')
    .attr('class', () => `donut-legend-circle donut-legend-circle--${data.type}`)
    .attr('fill', () => `url(#donut-pattern-${data.type}-${maskId})`)
    .attr('cx', radius)
    .attr('cy', radius)
    .attr('r', radius);
}

/** @param {DonutGraphData} props */
export const DonutGraph = props => {
  return (
    <div className="donut-graph graph-root-el">
      <D3Graph
        className="donut-graph__graph"
        data={{...props}}
        render={renderDonutGraph}
        computeRerenderKey={data => `${data.passCount},${data.failCount},${data.naCount}`}
      />
    </div>
  );
};

/** @param {{halfWidth: boolean}} props */
export const DonutGraphLegend = props => {
  return (
    <div className="donut-graph-legend" style={{width: props.halfWidth ? '50%' : '100%'}}>
      <D3Graph
        className="donut-graph-legend__legend-circle"
        data={{type: 'pass'}}
        render={renderDonutGraphLegendCircle}
        computeRerenderKey={() => ''}
      />
      <div className="donut-graph-legend__label">Passed</div>
      <D3Graph
        className="donut-graph-legend__legend-circle"
        data={{type: 'fail'}}
        render={renderDonutGraphLegendCircle}
        computeRerenderKey={() => ''}
      />
      <div className="donut-graph-legend__label">Failed</div>
      <D3Graph
        className="donut-graph-legend__legend-circle"
        data={{type: 'na'}}
        render={renderDonutGraphLegendCircle}
        computeRerenderKey={() => ''}
      />
      <div className="donut-graph-legend__label">Not Applicable</div>
    </div>
  );
};

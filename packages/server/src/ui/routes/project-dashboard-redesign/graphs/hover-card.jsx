/**
 * @license Copyright 2020 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h, Fragment} from 'preact';
import clsx from 'clsx';
import * as _ from '@lhci/utils/src/lodash.js';

import {LhrViewerLink} from '../../../components/lhr-viewer-link';
import {api} from '../../../hooks/use-api-data';
import './hover-card.css';

export const HOVER_CARD_WIDTH = 200;

export const HOVER_CARD_MARGIN = 100;

/** @param {number} value */
const padWith0 = value => value.toString().padStart(2, '0');

/** @param {{url: string, build?: LHCI.ServerCommand.Build, children?: LHCI.PreactNode, pinned: boolean, hideBuildDate?: boolean, hideActions?: boolean, className?: string}} props */
export const HoverCard = props => {
  const {url, build, children, pinned} = props;

  let contents = <Fragment />;
  if (build) {
    const runAt = new Date(build.runAt || '');
    contents = (
      <Fragment>
        {props.hideBuildDate ? (
          <Fragment />
        ) : (
          <div className="hover-card__datetime">
            <span className="hover-card__date">{runAt.toLocaleDateString()}</span>
            <span className="hover-card__time">
              {padWith0(runAt.getHours())}:{padWith0(runAt.getMinutes())}
            </span>
          </div>
        )}
        {children}
        {props.hideActions ? (
          <Fragment />
        ) : (
          <div className="hover-card__actions">
            <LhrViewerLink
              lhr={async () => {
                const getRunOptions = {url, representative: true};
                const [run] = await api.getRuns(build.projectId, build.id, getRunOptions);
                return JSON.parse(run.lhr);
              }}
            >
              Report
            </LhrViewerLink>
            <a href={`./compare/${_.shortId(build.id)}`}>CI Diff</a>
          </div>
        )}
      </Fragment>
    );
  }

  return (
    <div
      className={clsx('hover-card', props.className, {
        'hover-card--visible': !!build,
        'hover-card--pinned': !!pinned,
      })}
    >
      {contents}
    </div>
  );
};

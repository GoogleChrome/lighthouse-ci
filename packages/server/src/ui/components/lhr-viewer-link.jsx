/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h} from 'preact';
import clsx from 'clsx';
import {useState} from 'preact/hooks';
import './lhr-viewer-link.css';

/** @typedef {LH.Result|(() => Promise<LH.Result>)} LHResolver */

/** @param {LH.Result} lhr */
export function openLhrInClassicViewer(lhr) {
  const VIEWER_ORIGIN = 'https://googlechrome.github.io';
  // Chrome doesn't allow us to immediately postMessage to a popup right
  // after it's created. Normally, we could also listen for the popup window's
  // load event, however it is cross-domain and won't fire. Instead, listen
  // for a message from the target app saying "I'm open".
  window.addEventListener('message', function msgHandler(messageEvent) {
    if (messageEvent.origin !== VIEWER_ORIGIN) {
      return;
    }
    // https://github.com/GoogleChrome/lighthouse/blob/35f1a6f90e9443bdf42179a4c9823e6d4848a9e6/lighthouse-viewer/app/src/lighthouse-report-viewer.js#L415-L418
    if (popup && messageEvent.data.opened) {
      popup.postMessage({lhresults: lhr}, VIEWER_ORIGIN);
      window.removeEventListener('message', msgHandler);
    }
  });

  // The popup's window.name is keyed by version+url+fetchTime, so we reuse/select tabs correctly
  const fetchTime = lhr.fetchTime;
  const windowName = `${lhr.lighthouseVersion}-${lhr.requestedUrl}-${fetchTime}`;
  const popup = window.open(`${VIEWER_ORIGIN}/lighthouse/viewer`, windowName);
}

/** @param {{children: string|JSX.Element|JSX.Element[], lhr: LHResolver, className?: string}} props */
export const LhrViewerLink = props => {
  const {children, lhr: lhrOrResolver} = props;
  const [isLoading, setIsLoading] = useState(false);

  return (
    <span
      className={clsx('lhr-viewer-link', props.className, {
        'lhr-viewer-link--loading': isLoading,
      })}
      onClick={async evt => {
        evt.preventDefault();
        evt.stopImmediatePropagation();
        if (isLoading) return;

        if (typeof lhrOrResolver === 'object') return openLhrInClassicViewer(lhrOrResolver);

        setIsLoading(true);
        const lhr = await lhrOrResolver();
        setIsLoading(false);
        openLhrInClassicViewer(lhr);
      }}
    >
      {children}
    </span>
  );
};

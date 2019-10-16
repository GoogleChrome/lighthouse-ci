/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h} from 'preact';
import clsx from 'clsx';

import * as _ from '@lhci/utils/src/lodash.js';
import './pwa-gauge.css';

// For SVG to function properly, we need to use the real attribtues that preact doesn't set.
/* eslint-disable react/no-unknown-property */

/** @typedef {{optimized: boolean, installable: boolean, fastAndReliable: boolean}} PWABadgeStatus */

/** @param {{deltaType: import('@lhci/utils/src/audit-diff-finder').DiffLabel}} props */
export const FastReliableIcon = props => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      class={`pwa-icon pwa-icon--${props.deltaType}`}
    >
      <g fill-rule="nonzero" fill="none">
        <circle class={`pwa-icon__background`} cx="12" cy="12" r="12" />
        <path
          d="M12 4.3l6.3 2.8v4.2c0 3.88-2.69 7.52-6.3 8.4-3.61-.88-6.3-4.51-6.3-8.4V7.1L12 4.3zm-.56 12.88l3.3-5.79.04-.08c.05-.1.01-.29-.26-.29h-1.96l.56-3.92h-.56L9.3 12.82c0 .03.07-.12-.03.07-.11.2-.12.37.2.37h1.97l-.56 3.92h.56z"
          fill="#FFF"
        />
      </g>
    </svg>
  );
};

/** @param {{deltaType: import('@lhci/utils/src/audit-diff-finder').DiffLabel}} props */
export const InstallableIcon = props => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      class={`pwa-icon pwa-icon--${props.deltaType}`}
    >
      <g fill-rule="nonzero" fill="none">
        <circle class={`pwa-icon__background`} cx="12" cy="12" r="12" />
        <path
          d="M12 5a7 7 0 1 0 0 14 7 7 0 0 0 0-14zm3.5 7.7h-2.8v2.8h-1.4v-2.8H8.5v-1.4h2.8V8.5h1.4v2.8h2.8v1.4z"
          fill="#FFF"
        />
      </g>
    </svg>
  );
};

/** @param {{deltaType: import('@lhci/utils/src/audit-diff-finder').DiffLabel}} props */
export const OptimizedIcon = props => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      class={`pwa-icon pwa-icon--${props.deltaType}`}
    >
      <g fill="none" fill-rule="evenodd">
        <rect class={`pwa-icon__background`} width="24" height="24" rx="12" />
        <path d="M5 5h14v14H5z" />
        <path
          fill="#FFF"
          d="M12 15.07l3.6 2.18-.95-4.1 3.18-2.76-4.2-.36L12 6.17l-1.64 3.86-4.2.36 3.2 2.76-.96 4.1z"
        />
      </g>
    </svg>
  );
};

/**
 *
 * @param {PWABadgeStatus} base
 * @param {PWABadgeStatus} compare
 * @param {keyof PWABadgeStatus} key
 * @return {import('@lhci/utils/src/audit-diff-finder').DiffLabel}
 */
export function getBadgeDiffType(base, compare, key) {
  if (base[key] === compare[key]) return 'neutral';
  if (compare[key]) return 'improvement';
  return 'regression';
}

/** @param {LH.Result} lhr @return {PWABadgeStatus} */
export function getBadgeStatus(lhr) {
  const pwaCategory = lhr.categories.pwa;
  const auditsByCategory = _.groupIntoMap(pwaCategory.auditRefs, ref => ref.group);
  /** @param {LH.CategoryResult['auditRefs']} [refs] */
  const hasEveryPass = (refs = []) =>
    refs.map(ref => lhr.audits[ref.id]).every(audit => audit && audit.score === 1);
  return {
    optimized: hasEveryPass(auditsByCategory.get('pwa-optimized') || []),
    installable: hasEveryPass(auditsByCategory.get('pwa-installable') || []),
    fastAndReliable: hasEveryPass(auditsByCategory.get('pwa-fast-reliable') || []),
  };
}

/** @param {{status: PWABadgeStatus}} props */
export const PWAGauge = props => {
  const {status} = props;
  const all = status.optimized && status.installable && status.fastAndReliable;

  return (
    <div
      className={clsx('pwa-gauge', {
        'pwa-gauge--all': all,
        'pwa-gauge--pwa-optimized': !all && status.optimized,
        'pwa-gauge--pwa-installable': !all && status.installable,
        'pwa-gauge--pwa-fast-reliable': !all && status.fastAndReliable,
      })}
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60">
        <defs>
          <linearGradient
            id="pwa-gauge__check-circle__gradient"
            x1="50%"
            y1="0%"
            x2="50%"
            y2="100%"
          >
            <stop stop-color="#00C852" offset="0%" />
            <stop stop-color="#009688" offset="100%" />
          </linearGradient>
          <linearGradient
            id="pwa-gauge__installable__shadow-gradient"
            x1="76.056%"
            x2="24.111%"
            y1="82.995%"
            y2="24.735%"
          >
            <stop stop-color="#A5D6A7" offset="0%" />
            <stop stop-color="#80CBC4" offset="100%" />
          </linearGradient>
          <linearGradient
            id="pwa-gauge__fast-reliable__shadow-gradient"
            x1="76.056%"
            y1="82.995%"
            x2="25.678%"
            y2="26.493%"
          >
            <stop stop-color="#64B5F6" offset="0%" />
            <stop stop-color="#2979FF" offset="100%" />
          </linearGradient>

          <g id="pwa-gauge__fast-reliable-badge">
            <circle fill="#FFFFFF" cx="10" cy="10" r="10" />
            <path
              fill="#304FFE"
              d="M10 3.58l5.25 2.34v3.5c0 3.23-2.24 6.26-5.25 7-3.01-.74-5.25-3.77-5.25-7v-3.5L10 3.58zm-.47 10.74l2.76-4.83.03-.07c.04-.08 0-.24-.22-.24h-1.64l.47-3.26h-.47l-2.7 4.77c-.02.01.05-.1-.04.05-.09.16-.1.31.18.31h1.63l-.47 3.27h.47z"
            />
          </g>
          <g id="pwa-gauge__installable-badge">
            <circle fill="#FFFFFF" cx="10" cy="10" r="10" />
            <path
              fill="#009688"
              d="M10 4.167A5.835 5.835 0 0 0 4.167 10 5.835 5.835 0 0 0 10 15.833 5.835 5.835 0 0 0 15.833 10 5.835 5.835 0 0 0 10 4.167zm2.917 6.416h-2.334v2.334H9.417v-2.334H7.083V9.417h2.334V7.083h1.166v2.334h2.334v1.166z"
            />
          </g>
        </defs>

        <g stroke="none" fill-rule="nonzero">
          {/* Background and PWA logo (color by default) */}
          <circle class="pwa-gauge__disc" cx="30" cy="30" r="30" />
          <g class="pwa-gauge__logo">
            <path
              class="pwa-gauge__logo--secondary-color"
              d="M35.66 19.39l.7-1.75h2L37.4 15 38.6 12l3.4 9h-2.51l-.58-1.61z"
            />
            <path
              class="pwa-gauge__logo--primary-color"
              d="M33.52 21l3.65-9h-2.42l-2.5 5.82L30.5 12h-1.86l-1.9 5.82-1.35-2.65-1.21 3.72L25.4 21h2.38l1.72-5.2 1.64 5.2z"
            />
            <path
              class="pwa-gauge__logo--secondary-color"
              fill-rule="nonzero"
              d="M20.3 17.91h1.48c.45 0 .85-.05 1.2-.15l.39-1.18 1.07-3.3a2.64 2.64 0 0 0-.28-.37c-.55-.6-1.36-.91-2.42-.91H18v9h2.3V17.9zm1.96-3.84c.22.22.33.5.33.87 0 .36-.1.65-.29.87-.2.23-.59.35-1.15.35h-.86v-2.41h.87c.52 0 .89.1 1.1.32z"
            />
          </g>

          {/* No badges. */}
          <rect
            class="pwa-gauge__component pwa-gauge__na-line"
            fill="#FFFFFF"
            x="20"
            y="32"
            width="20"
            height="4"
            rx="2"
          />

          {/* Just fast and reliable. */}
          <g
            class="pwa-gauge__component pwa-gauge__fast-reliable-badge"
            transform="translate(20, 29)"
          >
            <path
              fill="url(#pwa-gauge__fast-reliable__shadow-gradient)"
              d="M33.63 19.49A30 30 0 0 1 16.2 30.36L3 17.14 17.14 3l16.49 16.49z"
            />
            <use href="#pwa-gauge__fast-reliable-badge" />
          </g>

          {/* Just installable. */}
          <g
            class="pwa-gauge__component pwa-gauge__installable-badge"
            transform="translate(20, 29)"
          >
            <path
              fill="url(#pwa-gauge__installable__shadow-gradient)"
              d="M33.629 19.487c-4.272 5.453-10.391 9.39-17.415 10.869L3 17.142 17.142 3 33.63 19.487z"
            />
            <use href="#pwa-gauge__installable-badge" />
          </g>

          {/* Fast and reliable and installable. */}
          <g class="pwa-gauge__component pwa-gauge__fast-reliable-installable-badges">
            <g transform="translate(8, 29)">
              {/* fast and reliable */}
              <path
                fill="url(#pwa-gauge__fast-reliable__shadow-gradient)"
                d="M16.321 30.463L3 17.143 17.142 3l22.365 22.365A29.864 29.864 0 0 1 22 31c-1.942 0-3.84-.184-5.679-.537z"
              />
              <use href="#pwa-gauge__fast-reliable-badge" />
            </g>
            <g transform="translate(32, 29)">
              {/* installable */}
              <path
                fill="url(#pwa-gauge__installable__shadow-gradient)"
                d="M25.982 11.84a30.107 30.107 0 0 1-13.08 15.203L3 17.143 17.142 3l8.84 8.84z"
              />
              <use href="#pwa-gauge__installable-badge" />
            </g>
          </g>

          {/* Full PWA. */}
          <g class="pwa-gauge__component pwa-gauge__check-circle" transform="translate(18, 28)">
            <circle fill="#FFFFFF" cx="12" cy="12" r="12" />
            <path
              fill="url(#pwa-gauge__check-circle__gradient)"
              d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
            />
          </g>
        </g>
      </svg>
    </div>
  );
};

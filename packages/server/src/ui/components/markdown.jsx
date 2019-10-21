/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {h, Fragment} from 'preact';
import {splitMarkdownLink} from '@lhci/utils/src/markdown.js';

/** @param {{text: string}} props */
export const Markdown = props => {
  const segments = splitMarkdownLink(props.text);

  return (
    <Fragment>
      {segments.map((segment, i) => {
        if (!segment.isLink) return <span key={i}>{segment.text}</span>;

        const url = new URL(segment.linkHref);

        const DOCS_ORIGINS = ['https://developers.google.com', 'https://web.dev'];
        if (DOCS_ORIGINS.includes(url.origin)) {
          url.searchParams.set('utm_source', 'lighthouse');
          url.searchParams.set('utm_medium', 'ci');
        }

        return (
          <a key={i} href={url.href} target="_blank" rel="noopener noreferrer">
            {segment.text}
          </a>
        );
      })}
    </Fragment>
  );
};

/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/**
 * @see https://github.com/GoogleChrome/lighthouse/blob/2ff07d29a3e12a75cc844427c567330eb84d4249/lighthouse-core/report/html/renderer/util.js#L320-L347
 *
 * Split a string on markdown links (e.g. [some link](https://...)) into
 * segments of plain text that weren't part of a link (marked as
 * `isLink === false`), and segments with text content and a URL that did make
 * up a link (marked as `isLink === true`).
 * @param {string} text
 * @return {Array<{isLink: true, text: string, linkHref: string}|{isLink: false, text: string}>}
 */
function splitMarkdownLink(text) {
  /** @type {Array<{isLink: true, text: string, linkHref: string}|{isLink: false, text: string}>} */
  const segments = [];

  const parts = text.split(/\[([^\]]+?)\]\((https?:\/\/.*?)\)/g);
  while (parts.length) {
    // Shift off the same number of elements as the pre-split and capture groups.
    const [preambleText, linkText, linkHref] = parts.splice(0, 3);

    if (preambleText) {
      // Skip empty text as it's an artifact of splitting, not meaningful.
      segments.push({
        isLink: false,
        text: preambleText,
      });
    }

    // Append link if there are any.
    if (linkText && linkHref) {
      segments.push({
        isLink: true,
        text: linkText,
        linkHref,
      });
    }
  }

  return segments;
}

module.exports = {splitMarkdownLink};

/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/* eslint-env jest, browser */

const {shouldRunE2E, emptyTest} = require('../test-utils.js');

// This injects a box into the page that moves with the mouse;
// Useful for debugging
async function installMouseHelper(page) {
  await page.evaluate(() => {
    // Install mouse helper only for top-level frame.
    if (window !== window.parent) return;
    const box = document.createElement('puppeteer-mouse-pointer');
    const styleElement = document.createElement('style');
    styleElement.innerHTML = `
      puppeteer-mouse-pointer {
        pointer-events: none;
        position: absolute;
        top: 0;
        z-index: 10000;
        left: 0;
        width: 20px;
        height: 20px;
        background: rgba(0,0,0,.4);
        border: 1px solid white;
        border-radius: 10px;
        margin: -10px 0 0 -10px;
        padding: 0;
        transition: background .2s, border-radius .2s, border-color .2s;
      }
      puppeteer-mouse-pointer.button-1 {
        transition: none;
        background: rgba(0,0,0,0.9);
      }
      puppeteer-mouse-pointer.button-2 {
        transition: none;
        border-color: rgba(0,0,255,0.9);
      }
      puppeteer-mouse-pointer.button-3 {
        transition: none;
        border-radius: 4px;
      }
      puppeteer-mouse-pointer.button-4 {
        transition: none;
        border-color: rgba(255,0,0,0.9);
      }
      puppeteer-mouse-pointer.button-5 {
        transition: none;
        border-color: rgba(0,255,0,0.9);
      }
    `;
    document.head.appendChild(styleElement);
    document.body.appendChild(box);
    document.addEventListener('mousemove', event => {
      box.style.left = event.pageX + 'px';
      box.style.top = event.pageY + 'px';
      updateButtons(event.buttons);
    }, true);
    document.addEventListener('mousedown', event => {
      updateButtons(event.buttons);
      box.classList.add('button-' + event.which);
    }, true);
    document.addEventListener('mouseup', event => {
      updateButtons(event.buttons);
      box.classList.remove('button-' + event.which);
    }, true);
    function updateButtons(buttons) {
      for (let i = 0; i < 5; i++)
        box.classList.toggle('button-' + i, buttons & (1 << i));
    }
  });
}

describe('Project dashboard', () => {
  if (!shouldRunE2E()) return emptyTest();

  const state = /** @type {LHCI.E2EState} */ ({dataset: 'actual'});

  require('./steps/setup')(state);

  require('./steps/navigate-to-project')(state, 'Lighthouse Real-World');

  describe('render the dashboard', () => {
    it('should show the commits', async () => {
      const commits = await state.page.evaluate(() => {
        return [...document.querySelectorAll('.dashboard-build-list tr')].map(
          row => row.textContent
        );
      });

      expect(commits).toMatchInlineSnapshot(`
        Array [
          "1246build 12call_splitmasterMay 22 6:00 AM",
          "1245build 11call_splitmasterMay 21 6:00 AM",
          "1244build 10call_splitmasterMay 20 6:00 AM",
          "1243build 9call_splitmasterMay 19 6:00 AM",
          "1242build 8call_splitmasterMay 18 6:00 AM",
        ]
      `);
    });

    it('should look correct', async () => {
      expect(await state.page.screenshot({fullPage: true})).toMatchImageSnapshot();
    });

    it('should render graphs for previously unavailable data', async () => {
      await installMouseHelper(state.page);
      const {x, y} = await state.page.evaluate(() => {
        const graphs = Array.from(document.querySelectorAll('.metric-line-graph__graph'));
        if (!graphs.length) throw new Error('Should have found 2 metric graphs');

        window.scrollTo({top: graphs[1].getBoundingClientRect().top - 50});
        const rect = graphs[1].getBoundingClientRect();
        return {x: rect.left + rect.width / 2, y: rect.top + rect.height / 2};
      });

      await state.page.mouse.move(x, y);
      await state.page.focus('.metric-line-graph__graph'); // ?
    });

    it('should look correct on hover', async () => {
      // await state.page.waitFor(1000 * 3);
      // This failure makes no sense.
      // Worked before with parcel, but not now with esbuild ?
      // When running debug mode
      //   DEBUG=1 yarn jest project-dashboard-mixed-v5-v6
      // the card shows on hover. but the browser viewport moves about,
      // perhaps causing the card to stop showing?
      expect(await state.page.screenshot({fullPage: false})).toMatchImageSnapshot();
    });
  });

  require('./steps/teardown')(state);
});

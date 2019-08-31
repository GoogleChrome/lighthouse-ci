/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/* eslint-env jest */

const PRandom = require('@lhci/utils/src/seed-data/prandom.js');

describe('PRandom', () => {
  it('should generate deterministic numbers', () => {
    const random = new PRandom();
    const numbers = [];
    for (let i = 0; i < 10; i++) numbers[i] = random.next();
    expect(numbers).toEqual([
      0.9872818551957607,
      0.34880331158638,
      0.5631933622062206,
      0.9990169629454613,
      0.8291510976850986,
      0.13247808441519737,
      0.8254958242177963,
      0.8386827223002911,
      0.11304118484258652,
      0.058928895741701126,
    ]);
  });

  it('should generate deterministic numbers with different variant', () => {
    const random = new PRandom(137);
    const numbers = [];
    for (let i = 0; i < 10; i++) numbers[i] = random.next();
    expect(numbers).toEqual([
      0.981050293892622,
      0.2517034336924553,
      0.4143013134598732,
      0.5354671590030193,
      0.17058493942022324,
      0.46943316981196404,
      0.16233910247683525,
      0.2525038607418537,
      0.6119818463921547,
      0.3286912925541401,
    ]);
  });

  it('should reset the generator', () => {
    const random = new PRandom(137);
    expect(random.next()).toEqual(0.981050293892622);
    expect(random.next()).toEqual(0.2517034336924553);
    random.reset();
    expect(random.next()).toEqual(0.981050293892622);
  });

  it('should be fast', () => {
    const random = new PRandom(137);
    // 10 million iterations shouldn't timeout
    for (let i = 0; i < 10e6; i++) {
      random.next();
    }
  });
});

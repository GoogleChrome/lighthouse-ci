/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const VARIANT_MULTIPLIER = 9653;

class PRandom {
  /** @param {number} variant */
  constructor(variant = 0) {
    this.variant = variant;
    /** @type {number} */
    this.seed = 0;
    this.reset();
  }

  reset() {
    this.seed = 49734321;
    for (let i = 0; i < this.variant * VARIANT_MULTIPLIER; i++) {
      this.next();
    }
  }

  /**
   * Generates a psuedo-random but deterministic number. Based on the v8 implementation of Math.random for testing.
   * @see https://github.com/chromium/octane/blob/570ad1ccfe86e3eecba0636c8f932ac08edec517/base.js#L120
   */
  next() {
    // Robert Jenkins' 32 bit integer hash function.
    this.seed = (this.seed + 0x7ed55d16 + (this.seed << 12)) & 0xffffffff;
    this.seed = (this.seed ^ 0xc761c23c ^ (this.seed >>> 19)) & 0xffffffff;
    this.seed = (this.seed + 0x165667b1 + (this.seed << 5)) & 0xffffffff;
    this.seed = ((this.seed + 0xd3a2646c) ^ (this.seed << 9)) & 0xffffffff;
    this.seed = (this.seed + 0xfd7046c5 + (this.seed << 3)) & 0xffffffff;
    this.seed = (this.seed ^ 0xb55a4f09 ^ (this.seed >>> 16)) & 0xffffffff;
    return (this.seed & 0xfffffff) / 0x10000000;
  }

  /**
   * Returns a random character from the character class [a-z0-9].
   * @param {number} input
   * @return {string}
   */
  static toAlphanumeric(input) {
    const valueOutOf36 = Math.round(input * 35);
    if (valueOutOf36 < 10) return valueOutOf36.toString();
    return String.fromCharCode(97 + valueOutOf36 - 10);
  }
}

module.exports = PRandom;
